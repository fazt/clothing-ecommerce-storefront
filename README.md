# Atelier — e-commerce de ropa

Tienda online de ropa lista para producción: storefront con catálogo por tallas y colores, checkout con
**Stripe, PayPal y Mercado Pago** (más una pasarela simulada para demos), cupones, envíos, wishlist,
reseñas y un panel de administración con métricas. Pensada para marcas de moda y agencias que necesitan
una base real —stock por variante sin sobreventa, webhooks firmados, emails transaccionales— en vez de
una plantilla de maqueta.

![Storefront](docs/screenshots/home.png)

> **Estado:** la versión 3 (checkout multi-pasarela, envíos, reseñas, wishlist, Docker) se escribió en
> modo «solo escritura» y está **pendiente de comprobación**: ver [`docs/VERIFICACION.md`](docs/VERIFICACION.md).
> Las capturas de abajo son reales pero de la versión anterior.

## Capturas

### Storefront

| Catálogo con filtros | Detalle de producto |
|---|---|
| ![Catálogo](docs/screenshots/products-grid.png) | ![Detalle de producto](docs/screenshots/product-detail.png) |

| Carrito | Home (tema oscuro) |
|---|---|
| ![Carrito](docs/screenshots/cart.png) | ![Home tema oscuro](docs/screenshots/home-dark.png) |

| Mobile: home | Mobile: producto |
|---|---|
| <img src="docs/screenshots/mobile-home.png" width="250" alt="Home en mobile"> | <img src="docs/screenshots/mobile-product.png" width="250" alt="Producto en mobile"> |

### Panel de administración

| Resumen | Analíticas |
|---|---|
| ![Resumen](docs/screenshots/dashboard.png) | ![Analíticas](docs/screenshots/dashboard-analytics.png) |

| Productos | Nuevo producto (upload drag & drop) |
|---|---|
| ![Productos](docs/screenshots/dashboard-products.png) | ![Nuevo producto](docs/screenshots/dashboard-product-form.png) |

| Pedidos | Cupones |
|---|---|
| ![Pedidos](docs/screenshots/dashboard-orders.png) | ![Cupones](docs/screenshots/dashboard-discounts.png) |

| Clientes | Command palette (`Ctrl+K`) |
|---|---|
| ![Clientes](docs/screenshots/dashboard-customers.png) | ![Command palette](docs/screenshots/command-palette.png) |

### Capturas pendientes (se generan en la fase de comprobación)

Checkout con dirección, envío, cupón y selector de pasarela · pantalla de pago simulado · confirmación ·
reseñas en el detalle de producto · favoritos · panel de reseñas · métodos de envío · ajustes de pasarelas.

## Funcionalidades

**Tienda**
- Catálogo con categorías, galería por producto y **variantes talla + color con stock propio**.
- Carrito persistente (localStorage) y checkout con **dirección de envío, método de envío, cupón y pasarela**.
- **Totales calculados siempre en el servidor** (en centavos): el navegador nunca fija precios.
- **Wishlist** (favoritos) y **reseñas** con estrellas, distribución, «compra verificada» y moderación.
- SEO: metadata por producto, Open Graph, JSON-LD `Product`, `sitemap.xml`, `robots.txt`, páginas 404 y de error.

**Pagos** (`api/src/modules/payments`)
- Interfaz común `PaymentProvider` (crear checkout, confirmar a la vuelta, webhook firmado, reembolso) con
  **Stripe Checkout**, **PayPal Orders v2**, **Mercado Pago Checkout Pro** y **simulada**.
- Cada pasarela se activa solo si sus variables de entorno existen; la simulada está **apagada en producción**.
- Webhooks verificados (Stripe HMAC con tolerancia, PayPal `verify-webhook-signature`, Mercado Pago `x-signature`)
  e **idempotentes** (`payment_events` único por proveedor + evento). Se valida monto y moneda cobrados.
- **Reserva atómica de stock y cupón** al crear la orden (UPDATE condicional → sin sobreventa ni cupones
  sobre-usados, con test de concurrencia). Si el pago falla, se cancela o vence (job cada minuto), se devuelven.
- Reembolso total desde el panel por la misma pasarela; pago tardío sobre orden vencida → se re-reserva o se reembolsa solo.

**Panel** (`/dashboard`)
- Resumen y analíticas con **solo ventas cobradas** (ingresos 30 días, ticket medio, tasa de pago, top productos).
- CRUD de productos (variantes sincronizadas sin perder ids), categorías, cupones (porcentaje, monto fijo,
  envío gratis, mínimo de compra, vigencia, límite de usos), clientes y usuarios.
- Pedidos con número legible, dirección, transiciones válidas (pendiente → cancelado, preparación → enviado
  con número de seguimiento → entregado) y botón **Reembolsar**.
- Métodos de envío, moderación de reseñas y ajustes con el estado real de cada pasarela.

**Cuenta del cliente**: perfil, contraseña, avatar, mis pedidos (con seguimiento) y favoritos.

**Emails transaccionales** (Resend): bienvenida, restablecer contraseña, confirmación de compra con desglose,
pedido enviado con seguimiento y reembolso. Sin clave, se registran en el log.

**Seguridad y operación**: helmet, CORS con orígenes explícitos, cookie HttpOnly `SameSite=Lax` (`Secure` en
producción), rate limit global + login (solo fallidos) + registro/olvidé/newsletter/reseñas (todas las
peticiones) + checkout, tokens de reset guardados como SHA-256, `tokenVersion` que cierra sesiones al cambiar la
contraseña, logs JSON con pino sin query strings ni cabeceras sensibles, validación de entorno al arrancar,
`/api/health` con chequeo de base de datos, apagado ordenado y subidas validadas por magic bytes.

Incluye además una **CLI** (`cli/`, comando `ecom`) y un **servidor MCP** (`mcp/`) que operan la API.

## Stack

| Capa | Tecnología |
|---|---|
| Web | Next.js 16 (App Router, standalone) · React 19 · Tailwind CSS 4 · shadcn/ui · base-ui · lucide |
| API | Node 22 · Express 5 · TypeScript · Zod 4 · pino · helmet · express-rate-limit |
| Datos | PostgreSQL 16 · Prisma 7 (`prisma-client` + `@prisma/adapter-pg`) |
| Pagos | Stripe, PayPal y Mercado Pago por REST (sin SDK), pasarela simulada |
| Otros | Resend (email) · DigitalOcean Spaces o disco local (imágenes) · Google/GitHub OAuth con PKCE |
| Infra | Monorepo pnpm · Docker multi-stage · nginx · Vitest + Supertest |

## Puesta en marcha (desarrollo)

Requisitos: Node 22+, pnpm 9 (`corepack enable`) y Docker.

```bash
pnpm install                         # genera también el cliente Prisma
cp api/.env.example api/.env         # valores de desarrollo listos (pasarela simulada encendida)
cp web/.env.example web/.env.local
pnpm db:up                           # Postgres en 127.0.0.1:5486
pnpm db:deploy                       # aplica las migraciones
pnpm db:seed                         # catálogo con variantes, cupones, envíos, pedidos y reseñas
pnpm dev                             # API http://127.0.0.1:4057 · web http://127.0.0.1:5226
```

Tests (usan la base `atelier_test` del mismo Postgres, que se crea sola):

```bash
pnpm --filter ecommerce-api test
pnpm typecheck && pnpm lint && pnpm build
```

### Credenciales demo

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@admin.com` | `admin123` |
| Cliente (con pedidos, reseñas y favoritos) | `user@user.com` | `user123` |

Cupones de demo: `BIENVENIDA10` (10 %), `VERANO25` (25 % desde $60), `ENVIOGRATIS`, `AHORRA20` ($20 desde $100, 3 usos).

## Producción (Docker)

```bash
cp .env.prod.example .env.prod       # cambia POSTGRES_PASSWORD y JWT_SECRET; agrega las claves de pago
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
# opcional: datos de demo
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api ./node_modules/.bin/tsx prisma/seed.ts
```

Queda en `PUBLIC_URL` (por defecto `http://127.0.0.1:8126`): nginx sirve la web y enruta `/api` y `/uploads`
a la API en el mismo origen, así que la cookie de sesión no necesita `COOKIE_DOMAIN`. La API aplica las
migraciones al arrancar. Detrás de HTTPS deja `COOKIE_SECURE=true`.

### Webhooks a configurar en cada pasarela

| Pasarela | URL | Eventos |
|---|---|---|
| Stripe | `{PUBLIC_URL}/api/webhooks/stripe` | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` |
| PayPal | `{PUBLIC_URL}/api/webhooks/paypal` | `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED` (su id va en `PAYPAL_WEBHOOK_ID`) |
| Mercado Pago | `{PUBLIC_URL}/api/webhooks/mercadopago` | Pagos (la clave secreta va en `MP_WEBHOOK_SECRET`) |

Moneda: `CURRENCY` (por defecto USD). PayPal no acepta PEN/COP/CLP/ARS y Mercado Pago cobra en la moneda de su
cuenta, así que para Mercado Pago en Perú usa `CURRENCY=PEN` (o la de tu país).

## Variables de entorno

Todas están documentadas en [`api/.env.example`](api/.env.example), [`web/.env.example`](web/.env.example) y
[`.env.prod.example`](.env.prod.example). Las más importantes:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres |
| `JWT_SECRET` | Firma de sesiones (mínimo 32 caracteres; la API no arranca sin él) |
| `API_URL` · `WEB_URL` | URLs públicas (webhooks, emails, vuelta de pasarelas, OAuth) |
| `PAYMENTS_SIMULATED_ENABLED` | Pasarela de demo (vacío = solo fuera de producción) |
| `STRIPE_*` · `PAYPAL_*` · `MP_*` | Credenciales de cada pasarela (modo test/sandbox) |
| `RESEND_API_KEY` · `RESEND_FROM` | Emails transaccionales |
| `STORAGE_DRIVER` · `DO_SPACES_*` | Imágenes en disco local o en Spaces |
| `GOOGLE_*` · `GITHUB_*` | Login social (cada botón aparece solo con credenciales) |
| `NEXT_PUBLIC_API_URL` · `API_URL` (web) | API para el navegador y para los Server Components |

## Estructura

```
.
├── api/                      # Express 5 + Prisma 7
│   ├── prisma/               # schema, migraciones versionadas y seed
│   ├── src/
│   │   ├── config/env.ts     # validación de variables al arrancar
│   │   ├── app.ts · index.ts # app Express (helmet, CORS, logs, errores) y arranque/apagado
│   │   ├── jobs.ts           # vencimiento de órdenes pendientes
│   │   ├── lib/              # prisma, logger, rate limit, validate, money, uploads
│   │   └── modules/          # auth, me, products, categories, customers, orders, discounts,
│   │       │                 # analytics, users, storage, newsletter, shipping, wishlist, reviews
│   │       └── payments/     # PaymentProvider + stripe · paypal · mercadopago · simulated,
│   │                         # pricing (cotización y cupones), checkout.service, webhooks
│   ├── test/                 # Vitest + Supertest (auth, checkout, concurrencia, webhooks)
│   └── Dockerfile
├── web/                      # Next.js 16: (store), (auth), dashboard
├── cli/                      # CLI `ecom`
├── mcp/                      # servidor MCP sobre la API
├── deploy/nginx.conf         # proxy de producción (un solo origen)
├── docker-compose.yml        # Postgres de desarrollo
├── docker-compose.prod.yml   # db + api + web + nginx
└── docs/                     # arquitectura, base de datos, verificación y capturas
```

Más detalle: [`docs/architecture.md`](docs/architecture.md), [`docs/database.md`](docs/database.md) y
[`docs/VERIFICACION.md`](docs/VERIFICACION.md).

## En qué se diferencia de otras plantillas de tienda

- **Atelier** (este repo): tienda de **una marca** de ropa, con variantes talla/color y stock por variante,
  Next.js para SEO y checkout multi-pasarela.
- `multivendor-marketplace`: marketplace de **varios vendedores** con sub-órdenes, comisiones y retiros.
- `ecommerce-tienda-online` / `nextjs-ecommerce-stripe-dashboard` / `maison-noire-ecommerce-template`: otras bases
  más simples o centradas en una sola pasarela o en el diseño.

## Licencia

MIT
