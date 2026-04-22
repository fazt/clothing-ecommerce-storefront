# Arquitectura

Documento vivo del diseño del proyecto. Para la vista de producto (qué hace la app), ver el [README](../README.md). Este archivo cubre el **cómo** técnico.

## Mapa de servicios

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
              │                      ├──▶ PayPal  (Orders API v2)
              │                      ├──▶ Resend  (emails)
              │                      └──▶ DO Spaces (uploads S3)
              │
          Browser
```

## Flujo de autenticación

```
Browser                 Web (Next server)              API (Express)
   │   POST /login         │                              │
   │ ─────────────────────▶│                              │
   │                       │  POST /api/auth/login        │
   │                       │ ────────────────────────────▶│
   │                       │                              │ verify bcrypt
   │                       │                              │ sign JWT
   │                       │  { token, user }             │
   │                       │ ◀────────────────────────────│
   │  Set-Cookie: auth-token (HttpOnly, sameSite=lax)     │
   │ ◀─────────────────────│                              │
   │                                                      │
   │   GET /dashboard   (cookie auth-token forwarded)     │
   │ ─────────────────────▶│                              │
   │                       │  GET /api/auth/me            │
   │                       │  Authorization: Bearer ...   │
   │                       │ ────────────────────────────▶│
   │                       │  { user }                    │
   │                       │ ◀────────────────────────────│
   │   HTML renderizado   │                               │
   │ ◀─────────────────────│                              │
```

- Cookie `auth-token` se pone en el response de un **server action** (`(auth)/actions.ts`).
- El server action llama al backend con el token y guarda lo recibido.
- El `proxy.ts` de Next.js gatea `/dashboard/**` por presencia de cookie.
- El guard de rol se ejecuta en **layouts server**: `(admin)/layout.tsx` invoca `requireAdminPage()`.

## Flujo de checkout PayPal

```
USER                Web                 API                 PayPal           Postgres
  │  Pagar con PP    │                    │                    │                 │
  │ ────────────────▶│                    │                    │                 │
  │                  │ POST /payments/paypal/create            │                 │
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
  │                  │  capturePaypal    │                    │                 │
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

Endpoints relevantes:
- `POST /api/payments/paypal/create` (requiere auth)
- `POST /api/payments/paypal/capture` (requiere auth)
- `GET /api/orders/mine` (cualquier rol autenticado)
- `GET /api/orders` (admin)

## Flujo de uploads

Los archivos se suben **a través del backend** (no con presigned URLs) para evitar CORS del bucket:

```
Browser                Web server               API server             DO Spaces
  │  <ImageUpload/>      │                        │                        │
  │  FormData(file)      │                        │                        │
  │ ────────────────────▶│  server action         │                        │
  │                      │  POST /storage/upload  │                        │
  │                      │  (multipart + Bearer)  │                        │
  │                      │ ──────────────────────▶│                        │
  │                      │                        │ multer parses file     │
  │                      │                        │ PutObjectCommand       │
  │                      │                        │ (ACL public-read)      │
  │                      │                        │ ──────────────────────▶│
  │                      │                        │ 200                    │
  │                      │                        │ ◀──────────────────────│
  │                      │  { publicUrl }         │                        │
  │                      │ ◀──────────────────────│                        │
  │  setUrl(publicUrl)  │                        │                        │
  │ ◀─────────────────── │                        │                        │
```

Solo admin puede invocar `/storage/upload`. El contenido se valida por `Content-Type` (solo `image/*`) y tamaño (5 MB).

## Módulos del backend

`ecommerce-api/src/modules/` — cada módulo sigue `controller / service / routes / index`:

| Módulo | Endpoints | Notas |
|---|---|---|
| `auth` | `/register`, `/login`, `/me`, `/forgot-password`, `/reset-password` | JWT + bcrypt; forgot-password nunca revela existencia del email |
| `users` | CRUD admin-only de usuarios | Auto-guard: admin no puede eliminarse ni demotarse |
| `products` | `/`, `/:id` CRUD | GET público; CUD admin. Admite variantes + galería |
| `categories` | `/`, `/:id`, `/slug/:slug` | GET público; CUD admin |
| `customers` | CRUD admin-only | Segment derivado (new/returning/vip) |
| `orders` | `/`, `/:id`, `/mine`, `/:id/status` | `/mine` cualquier rol; resto admin |
| `discounts` | CRUD admin-only | Porcentaje / fijo / envío |
| `analytics` | `/summary` | Métricas + topProducts + sales series |
| `payments` | `/paypal/create`, `/paypal/capture` | Singleton PayPal client con token cache |
| `email` | — (service interno) | Resend; fail-safe siempre |
| `storage` | `/upload` | multipart → multer → S3 SDK → Spaces |

## Guards y permisos

```
requireAuth      → Bearer token válido → req.user = { id, email, role }
requireAdmin     → requireAuth + role === 'ADMIN'
```

Aplicados por ruta (no a nivel de router) para permitir casos como `GET /api/orders/mine` (auth pero cualquier rol) junto a `GET /api/orders` (admin).

En el frontend:
- `src/proxy.ts` chequea cookie `auth-token` para `/dashboard/**` (Edge middleware de Next 16).
- `requireAdminPage()` de `src/lib/session.ts` redirige `/dashboard/my-orders` si el usuario no es admin (llamada en `(admin)/layout.tsx`).

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
