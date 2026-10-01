# Arquitectura

Documento vivo del diseño del proyecto. Para la vista de producto (qué hace la app), ver el [README](../README.md). Este archivo cubre el **cómo** técnico.

## Mapa de servicios

Diagrama completo (web, API, CLI, base de datos y servicios externos): [`architecture-diagram.md`](./architecture-diagram.md).

```
   ┌──────────────────────────────────────────────────────────────┐
   │                        Railway project                       │
   │                       ecommerce-clothes                      │
   │                                                              │
   │   ┌────────────────┐    ┌────────────────┐    ┌───────────┐  │
   │   │ web (Next.js)  │───▶│  api (Express) │───▶│ Postgres  │  │
   │   │ port 3000      │    │  port 4000     │    │ 5432      │  │
   │   └────────────────┘    └────────────────┘    └───────────┘  │
   │          ▲                      ▲                            │
   └──────────┼──────────────────────┼────────────────────────────┘
              │                      │
       ecommerce-clothes.lat    api.ecommerce-clothes.lat
              │                      │
              │                      ├──▶ Stripe  (Checkout Sessions + webhook)
              │                      ├──▶ PayPal  (Orders API v2)
              │                      ├──▶ Resend  (emails)
              │                      └──▶ DO Spaces (uploads S3)
              │
          Browser
```

## Flujo de datos web ↔ API

La web **no usa Server Actions**. Hay dos caminos hacia la API:

| Quién llama | Módulo | URL base | Auth |
|---|---|---|---|
| Browser (Client Components) — todas las mutaciones y las tablas del dashboard | `src/lib/api-client.ts` (`api.*`) | `NEXT_PUBLIC_API_URL` | cookie `auth-token` (`credentials: "include"`) |
| Server Components — solo lecturas (detalle para editar, reportes, catálogo) | `src/lib/api.ts` (`productsApi.listAll`, …) | `API_URL` | cookie reenviada como `Authorization: Bearer` |

Los tipos compartidos viven en `src/lib/api-types.ts` (importable desde cliente y servidor).

## Flujo de autenticación

```
Browser                                   API (Express)              Web (Next server)
   │  POST /api/auth/login  (fetch, credentials)│                           │
   │ ─────────────────────────────────────────▶│ verify bcrypt, sign JWT   │
   │  Set-Cookie: auth-token (HttpOnly, lax)   │                           │
   │ ◀─────────────────────────────────────────│                           │
   │                                                                       │
   │  GET /dashboard  (cookie auth-token)                                  │
   │ ─────────────────────────────────────────────────────────────────────▶│
   │                                           │  GET /api/me              │
   │                                           │  Authorization: Bearer …  │
   │                                           │ ◀─────────────────────────│
   │  HTML renderizado                                                     │
   │ ◀─────────────────────────────────────────────────────────────────────│
```

- La cookie la emite y la borra **la API** (`POST /auth/login`, `/auth/register`, `/auth/logout`). La web solo la lee.
- Web y API deben compartir *site* para que la cookie viaje a ambos: en local `localhost:3000` / `localhost:4000`; en producción `ecommerce-clothes.lat` / `api.ecommerce-clothes.lat` con `COOKIE_DOMAIN=ecommerce-clothes.lat`.
- CORS de la API solo acepta los orígenes de `CORS_ORIGINS` y con `credentials: true`.
- `requireAuth` acepta el token desde `Authorization: Bearer` o desde la cookie.
- El `proxy.ts` de Next.js gatea `/dashboard/**` por presencia de cookie.
- El guard de rol se ejecuta en **layouts server**: `(admin)/layout.tsx` invoca `requireAdminPage()`.

## Flujo de checkout PayPal

```
USER                Web                 API                 PayPal           Postgres
  │  Pagar con PP    │                    │                    │                 │
  │ ────────────────▶│                    │                    │                 │
  │                  │ POST /payments/paypal/orders            │                 │
  │                  │ ─────────────────▶│                    │                 │
  │                  │                    │ upsert Customer   │                 │
  │                  │                    │ ───────────────────────────────────▶│
  │                  │                    │ create Order PENDING                │
  │                  │                    │ ───────────────────────────────────▶│
  │                  │                    │ POST /v2/checkout/orders           │
  │                  │                    │ ────────────────▶│                 │
  │                  │                    │  { id, approveUrl } ◀──────────────│
  │                  │                    │ patch Order (paypalOrderId)        │
  │                  │                    │ ───────────────────────────────────▶│
  │                  │  { approveUrl }   │                    │                 │
  │                  │ ◀─────────────────│                    │                 │
  │ 302 approveUrl  │                    │                    │                 │
  │ ◀────────────────│                    │                    │                 │
  │ ──── PayPal Sandbox (user aprueba) ────────────────▶      │                 │
  │ 302 /checkout/return?token=xxx                             │                 │
  │ ──────────────────▶│                  │                    │                 │
  │                  │ POST …/orders/:id/capture (browser)    │                 │
  │                  │ ─────────────────▶│                    │                 │
  │                  │                    │ POST /capture     │                 │
  │                  │                    │ ────────────────▶│                 │
  │                  │                    │  { COMPLETED }   │                 │
  │                  │                    │ update Order PROCESSING            │
  │                  │                    │ ───────────────────────────────────▶│
  │                  │                    │ sendOrderConfirmation (Resend)    │
  │                  │  "Gracias"        │                    │                 │
  │ ◀─────────────────│                    │                    │                 │
```

Ambas llamadas salen del navegador (`checkout-view.tsx` y `checkout/return/capture-view.tsx`). La captura es idempotente: si la orden ya no está `PENDING`, la API la devuelve sin volver a cobrar.

Endpoints relevantes:
- `POST /api/payments/paypal/orders` (requiere auth)
- `POST /api/payments/paypal/orders/:paypalOrderId/capture` (requiere auth)
- `GET /api/me/orders` (cualquier rol autenticado)
- `GET /api/orders` (admin)

## Flujo de checkout Stripe

Mismo patrón de redirect que PayPal, sobre [Stripe Checkout](https://docs.stripe.com/payments/checkout):

1. `POST /api/payments/stripe/sessions` (auth): valida el carrito con precios de la DB, crea la orden `PENDING` (`paymentMethod: "Stripe"`) y una Checkout Session con `metadata.orderId`. Devuelve `{ url }` y el navegador redirige.
2. Stripe vuelve a `STRIPE_SUCCESS_URL?session_id=…` → `checkout/return` llama `POST /api/payments/stripe/sessions/:id/confirm`, que consulta la sesión y marca la orden `PROCESSING` si `payment_status === "paid"`.
3. `POST /api/payments/stripe/webhook` recibe `checkout.session.completed` / `async_payment_succeeded` (firma verificada con `STRIPE_WEBHOOK_SECRET`, body raw) y completa la orden aunque el comprador cierre la pestaña.

El paso a `PROCESSING` es un `UPDATE … WHERE status = 'PENDING'`: retorno y webhook pueden llegar a la vez y solo uno envía el email. Si la pasarela falla al crear la sesión, la orden se descarta.

`GET /api/payments/methods` → `{ stripe, paypal }` indica qué pasarelas tienen credenciales; el checkout solo muestra esas.

## Flujo de uploads

Los archivos se suben **a través del backend** (no con presigned URLs) para evitar CORS del bucket:

```
Browser                                  API server             DO Spaces
  │  <ImageUpload/> / avatar             │                        │
  │  POST /api/uploads                   │                        │
  │  FormData(file, folder)  + cookie    │                        │
  │ ────────────────────────────────────▶│ multer + Zod(folder)   │
  │                                      │ PutObjectCommand       │
  │                                      │ (ACL public-read)      │
  │                                      │ ──────────────────────▶│
  │                                      │ 200                    │
  │                                      │ ◀──────────────────────│
  │  201 { key, publicUrl }              │                        │
  │ ◀────────────────────────────────────│                        │
```

`POST /uploads` requiere sesión. `folder` es `products`, `categories` o `avatars`; un USER solo puede subir a `avatars`. El contenido se valida por `Content-Type` (solo `image/*`) y tamaño (5 MB → 413).

## Módulos del backend

`api/src/modules/` — cada módulo sigue `schema / controller / service / routes / index`. `*.schema.ts` define con Zod el body, la query y los params de cada ruta.

| Módulo | Endpoints | Notas |
|---|---|---|
| `auth` | `POST /register`, `/login`, `/logout`, `/forgot-password`, `/reset-password` | Emite/borra la cookie; forgot-password nunca revela si el email existe |
| `me` | `GET /me`, `PATCH /me`, `PUT /me/password`, `GET /me/orders` | Perfil del usuario en sesión; cambiar el email exige `currentPassword` |
| `users` | CRUD admin-only · filtro `role` | Auto-guard: admin no puede eliminarse ni cambiar su rol |
| `products` | CRUD · filtros `categoryId`, `stock=in\|low\|out` | GET público; escritura admin. Variantes + galería |
| `categories` | CRUD · filtro `isVisible` | GET público; escritura admin |
| `customers` | CRUD admin-only · filtro `segment` | Segmento derivado (new/returning/vip) |
| `orders` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id` (`{ status }`), `DELETE /:id` · filtro `status` | Admin-only |
| `discounts` | CRUD admin-only · filtros `type`, `status` | Porcentaje (≤ 100) / fijo / envío |
| `analytics` | `GET /summary` | Métricas + topProducts + sales series |
| `payments` | `GET /methods` · PayPal: `POST /paypal/orders`, `POST /paypal/orders/:id/capture` · Stripe: `POST /stripe/sessions`, `POST /stripe/sessions/:id/confirm`, `POST /stripe/webhook` | Cada pasarela se activa si su clave está configurada |
| `email` | — (service interno) | Resend; fail-safe siempre |
| `storage` | `POST /uploads` | multipart → multer → S3 SDK → Spaces |

## Convenciones de la API

- **REST**: recursos en plural, `PATCH` para actualizaciones parciales, `204` sin cuerpo en `DELETE`.
- **Listados** (`GET /<recurso>`): aceptan `page`, `pageSize` (1–100, default 10), `search` y los filtros del recurso, y responden:
  ```json
  { "data": [...], "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }
  ```
- **Validación**: middleware `validate({ params, query, body })` con Zod (`src/lib/validate.ts`). Un error responde `400`:
  ```json
  { "error": "Datos inválidos", "code": "VALIDATION_ERROR", "details": [{ "path": "email", "message": "Email inválido" }] }
  ```
  El cliente web (`ApiError.fieldErrors`) pinta esos mensajes junto a cada campo.

## Guards y permisos

```
requireAuth      → token válido (Bearer o cookie auth-token) → req.user = { id, email, role }
requireAdmin     → requireAuth + role === 'ADMIN'
```

Se aplican al montar cada router en `src/routes.ts` (`/me`, `/customers`, `/orders`, `/discounts`, `/analytics`, `/users`) o por ruta cuando la lectura es pública (`/products`, `/categories`).

En el frontend:
- `src/proxy.ts` chequea cookie `auth-token` para `/dashboard/**` (Edge middleware de Next 16).
- `requireAdminPage()` de `src/lib/session.ts` redirige `/dashboard/my-orders` si el usuario no es admin (llamada en `(admin)/layout.tsx`).

## Dashboard

- **Tablas CRUD**: `components/dashboard/data-table.tsx` pagina, busca y filtra por columna contra la API. Las columnas de email usan `CopyEmail` (icono para copiar al portapapeles).
- **Formularios**: un único componente por recurso para crear y editar (`<recurso>-form.tsx`), validado con Zod (`src/lib/schemas/`) vía `useApiForm`.
- **Command palette**: `⌘K` / `Ctrl+K` (`components/dashboard/command-palette.tsx`) navega a todas las páginas del rol, crea recursos, cambia el tema y cierra sesión. Comparte la navegación con el sidebar (`nav-config.ts`).
- **Perfil** (`/dashboard/profile`): datos personales, cambio de contraseña y avatar.

## Estructura del storefront

Route groups para aislar estilos y layouts:

```
app/
├── (store)/      layout propio, fuentes Archivo Black + Manrope, cart provider
├── (auth)/       layout centrado, card, flujo signup/login/forgot/reset
└── dashboard/
    ├── (admin)/  layout con sidebar admin, requireAdminPage guard
    ├── my-orders/     accesible a cualquier rol autenticado
    └── layout.tsx     shell compartido (sidebar + header)
```

## Persistencia del carrito

- `CartProvider` (Context + useReducer) en `(store)/layout.tsx`.
- Storage key `atelier:cart:v2` (migrado desde v1).
- Items incluyen `variantId` opcional → la UI agrupa por `(productId, variantId)`.

## Fuentes y temas

- `(store)/editorial.css` → scope `.shop-theme` (SHOP.CO look).
- `dashboard/analytics.css` → scope `.analytics` (Figma analytics dashboard look).
- `(auth)` usa los tokens shadcn por defecto.
- Todas las fuentes se cargan vía `next/font/google` con `variable` para no colisionar.

## CI/CD

- GitHub repo `fazt/ecommerce-clothes` (monorepo).
- Railway auto-deploy en push a `main`.
- `api` corre `prisma migrate deploy` en cada start (idempotente).
- `nixpacks.toml` en cada sub-app fija Node 20 y el comando de build.

## Entornos y URLs

| Ambiente | Web | API |
|---|---|---|
| Producción | `https://ecommerce-clothes.lat` | `https://api.ecommerce-clothes.lat` |
| Railway (fallback) | `https://web-production-49ad9.up.railway.app` | `https://api-production-089d.up.railway.app` |
| Local | `http://localhost:3000` | `http://localhost:4000` |

Variables que dependen del entorno (Railway):

| Servicio | Variable | Producción |
|---|---|---|
| `api` | `CORS_ORIGINS` | `https://ecommerce-clothes.lat` |
| `api` | `COOKIE_DOMAIN` | `ecommerce-clothes.lat` |
| `web` | `NEXT_PUBLIC_API_URL` | `https://api.ecommerce-clothes.lat/api` (se incrusta en **build**) |
| `web` | `API_URL` | URL interna o pública de la API |
