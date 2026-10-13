# ecommerce-clothes

Monorepo de un e-commerce de ropa con storefront público, checkout con Stripe o PayPal, inicio de sesión con Google o GitHub y panel de administración. Dos sub-apps TypeScript (`api` y `web`) conectadas por una API REST y desplegadas en Railway, más una CLI (`cli`) y un servidor MCP (`mcp`) que operan la misma API desde la terminal o desde un agente.

![Storefront](docs/screenshots/home.png)

## Capturas

### Storefront

| Catálogo con filtros | Detalle de producto |
|---|---|
| ![Catálogo](docs/screenshots/products-grid.png) | ![Detalle de producto](docs/screenshots/product-detail.png) |

| Carrito | Checkout con PayPal |
|---|---|
| ![Carrito](docs/screenshots/cart.png) | ![Checkout](docs/screenshots/checkout.png) |

| Home (tema oscuro) |
|---|
| ![Home tema oscuro](docs/screenshots/home-dark.png) |

| Mobile: home | Mobile: producto | Mobile: checkout |
|---|---|---|
| <img src="docs/screenshots/mobile-home.png" width="250" alt="Home en mobile"> | <img src="docs/screenshots/mobile-product.png" width="250" alt="Producto en mobile"> | <img src="docs/screenshots/mobile-checkout.png" width="250" alt="Checkout en mobile"> |

### Dashboard admin

| Reports | Reports (tema oscuro) |
|---|---|
| ![Reports](docs/screenshots/dashboard.png) | ![Reports tema oscuro](docs/screenshots/dashboard-dark.png) |

| Analíticas | Clientes |
|---|---|
| ![Analíticas](docs/screenshots/dashboard-analytics.png) | ![Clientes](docs/screenshots/dashboard-customers.png) |

| Productos | Nuevo producto (upload drag & drop) |
|---|---|
| ![Productos](docs/screenshots/dashboard-products.png) | ![Nuevo producto](docs/screenshots/dashboard-product-form.png) |

| Órdenes | Descuentos |
|---|---|
| ![Órdenes](docs/screenshots/dashboard-orders.png) | ![Descuentos](docs/screenshots/dashboard-discounts.png) |

| Categorías | Usuarios |
|---|---|
| ![Categorías](docs/screenshots/dashboard-categories.png) | ![Usuarios](docs/screenshots/dashboard-users.png) |

| Perfil | Chat |
|---|---|
| ![Perfil](docs/screenshots/dashboard-profile.png) | ![Chat](docs/screenshots/dashboard-chat.png) |

| Ajustes | Command palette (`⌘K` / `Ctrl+K`) |
|---|---|
| ![Ajustes](docs/screenshots/dashboard-settings.png) | ![Command palette](docs/screenshots/command-palette.png) |

### Auth y panel del cliente

| Login | Mis pedidos (rol USER) |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Mis pedidos](docs/screenshots/my-orders.png) |

> Capturas tomadas en local con los datos de `prisma db seed`.

## Arquitectura

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ web            │◀───▶│ api            │◀───▶│   Postgres     │
│  Next.js 16    │     │ Express + TS   │     │   (Railway)    │
│  React 19      │     │ Prisma 6       │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │
        │                      ├──▶ Stripe Checkout (tarjeta)
        │                      ├──▶ PayPal (sandbox/prod)
        │                      ├──▶ Resend (emails)
        │                      ├──▶ Google / GitHub (OAuth)
        │                      └──▶ DigitalOcean Spaces (imágenes)
        │
        └─▶ LocalStorage (carrito) · cookie HttpOnly emitida por la API

  cli (`ecom`) · mcp (stdio) ──▶ api   (REST + Bearer)
```

Tres servicios en Railway en un único proyecto (auto-deploy en push a `main`):

| Servicio | Tipo | Root | Dominio |
|---|---|---|---|
| `web` | Next.js | `web/` | `tu-dominio.com` |
| `api` | Node/Express | `api/` | `api.tu-dominio.com` |
| `Postgres` | Managed DB | — | interno |

## Funcionalidades

- **Storefront** (`/`, `/products`, `/products/[slug]`, `/checkout`): catálogo con categorías, galería de imágenes por producto, variantes (talla + color), carrito con localStorage.
- **Auth** (`/login`, `/register`, `/forgot-password`, `/reset-password`): JWT + bcrypt, cookie HttpOnly emitida por la API, flujo completo de reset con email e inicio de sesión con Google (OpenID Connect) y GitHub (OAuth App), ambos con PKCE. Cada botón solo aparece si la API tiene las credenciales de ese proveedor.
- **Validación con Zod** en la API (body, query y params) y en todos los formularios de la web.
- **Checkout Stripe / PayPal**: flujo redirect (Stripe Checkout o PayPal), orden persistida en DB, email de confirmación al completar. Cada pasarela aparece en el checkout solo si su clave está configurada en la API; Stripe además confirma el pago por webhook firmado.
- **Dashboard admin** (`/dashboard`): Reports con KPIs, gráficos, stock bajo, top productos y leaderboards. CRUD de productos, categorías, órdenes, clientes, descuentos y usuarios con búsqueda, filtros por columna, paginación en servidor y copiar email al portapapeles.
- **Command palette** (`⌘K` / `Ctrl+K`): navega entre todas las páginas, crea recursos, cambia el tema y cierra sesión.
- **Perfil** (`/dashboard/profile`): editar datos, cambiar contraseña y avatar.
- **Dashboard USER** (`/dashboard/my-orders`): historial de compras del cliente logueado.
- **Chat y Ajustes** (`/dashboard/chat`, `/dashboard/settings`): pantallas de interfaz; el chat guarda sus conversaciones en `localStorage` y Ajustes no persiste datos.
- **Newsletter**: formulario del storefront (Server Action) que guarda el email en la API.
- **Upload de imágenes**: drag & drop + paste clipboard → backend proxy → DigitalOcean Spaces.
- **Emails transaccionales**: bienvenida al registrar (también con Google o GitHub), reset password, confirmación de compra (vía Resend).
- **CLI `ecom` y servidor MCP**: operan catálogo, pedidos, clientes, descuentos, usuarios y analytics contra la API (ver [`cli/README.md`](./cli/README.md) y [`mcp/README.md`](./mcp/README.md)).

## Estructura

```
ecommerce-clothes/
├── api/                     # Node + Express + Prisma
│   ├── src/
│   │   ├── index.ts         # entry point
│   │   ├── routes.ts        # router raíz
│   │   ├── lib/             # prisma, validate (Zod), pagination, auth-cookie
│   │   ├── middleware/      # requireAuth, requireAdmin
│   │   ├── modules/         # auth, me, users, products, categories,
│   │   │                    # customers, orders, discounts,
│   │   │                    # analytics, payments, email, storage,
│   │   │                    # newsletter (auth incluye Google y GitHub)
│   │   │                    # (cada uno con *.schema.ts de Zod)
│   │   └── types/express.d.ts
│   ├── prisma/
│   │   ├── schema.prisma    # modelos (ver docs/database.md)
│   │   ├── migrations/      # historial de migraciones
│   │   └── seed.ts          # usuarios + catálogo demo
│   ├── scripts/
│   │   └── create-admin.ts  # promueve un admin directo en DB
│   ├── docker-compose.yml   # Postgres 16 local en el puerto 5434
│   ├── .env.example         # variables de la API
│   └── nixpacks.toml        # config Railway (Node 20)
│
├── web/                     # Next.js 16 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── (store)/     # storefront público
│   │   │   ├── (auth)/      # login/register/forgot/reset + botones OAuth
│   │   │   └── dashboard/   # admin (/) + cliente (/my-orders, /profile)
│   │   ├── components/      # UI compartida
│   │   │   ├── dashboard/   # sidebar, nav, header del admin
│   │   │   └── ui/          # shadcn primitives
│   │   ├── lib/
│   │   │   ├── api-client.ts # cliente REST del navegador (mutaciones, tablas)
│   │   │   ├── api.ts       # lecturas desde Server Components
│   │   │   ├── api-types.ts # tipos compartidos
│   │   │   ├── schemas/     # esquemas Zod de formularios
│   │   │   ├── products.ts  # fetch + mapping al dominio
│   │   │   └── session.ts   # lee la cookie + getSessionUser
│   │   └── proxy.ts         # middleware Next 16 (auth gate)
│   ├── .env.example         # variables de la web
│   └── nixpacks.toml
│
├── cli/                     # CLI `ecom` (Commander) que consume la API
│   └── src/commands/        # un archivo por módulo de la API
│
├── mcp/                     # servidor MCP (stdio) que expone la API como herramientas
│   └── src/index.ts         # registro de herramientas
│
├── .mcp.json                # registra el servidor MCP `ecommerce` para Claude Code
│
├── docs/                    # documentación adicional
│   ├── architecture.md      # detalles de arquitectura y flujos
│   ├── architecture-diagram.md # diagrama Mermaid de toda la arquitectura
│   ├── api.md               # referencia de endpoints de la API
│   ├── database.md          # schema de base de datos
│   └── screenshots/         # capturas usadas en este README
│
└── README.md                # este archivo
```

Más detalles: [`docs/architecture-diagram.md`](./docs/architecture-diagram.md) (diagrama), [`docs/architecture.md`](./docs/architecture.md), [`docs/api.md`](./docs/api.md) (endpoints) y [`docs/database.md`](./docs/database.md).

## Stack

**Backend (`api`)**
- Node.js 20 · TypeScript 5 · Express 4
- Prisma 6 · PostgreSQL · Zod 4
- bcrypt · jsonwebtoken · cookie-parser · cors · morgan · multer
- stripe · @aws-sdk/client-s3 · resend · google-auth-library · dotenv

**Frontend (`web`)**
- Next.js 16 (App Router, Turbopack) · React 19
- Tailwind CSS 4 · shadcn/ui · base-ui · lucide-react
- next-themes · tailwind-merge · class-variance-authority · cmdk · Zod 4

**CLI (`cli`) y MCP (`mcp`)**
- Node.js 22.12+ · TypeScript 5
- Commander (CLI) · `@modelcontextprotocol/server` v2 + Zod (MCP)

**Infra**
- Railway (hosting + Postgres)
- DigitalOcean Spaces (object storage, S3-compatible)
- Stripe (Checkout Sessions + webhook)
- PayPal (Orders API v2, sandbox)
- Google Cloud (OAuth / OpenID Connect) y GitHub (OAuth App)
- Resend (email)

## Desarrollo local

### 1. Requisitos

- Node.js 20+ (22.12+ para `cli/` y `mcp/`)
- Docker (para Postgres local) o una instancia Postgres accesible
- Cuentas opcionales: Stripe (modo test), PayPal sandbox, Google Cloud / GitHub (OAuth), Resend, DigitalOcean Spaces. El proyecto degrada si faltan: la pasarela o el botón de login no aparece, los emails se omiten y el upload responde `503`.

### 2. Postgres local

```bash
cd api && docker compose up -d   # usa api/docker-compose.yml (postgres:16-alpine en el puerto 5434)
```

O sin Compose:

```bash
docker run -d --name pg-ecommerce -p 5434:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce postgres:16
```

### 3. Backend

```bash
cd api
cp .env.example .env          # completa las variables
npm install
npx prisma migrate dev         # crea tablas + aplica migraciones
npx prisma db seed             # admin@admin.com / user@user.com + catálogo
npm run dev                    # http://localhost:4000
```

### 4. Frontend

```bash
cd web
cp .env.example .env.local     # API_URL y NEXT_PUBLIC_API_URL
npm install
npm run dev                    # http://localhost:3000
```

### 5. Credenciales seed

| Rol | Email | Password |
|---|---|---|
| ADMIN | `admin@admin.com` | `admin123` |
| USER | `user@user.com` | `user123` |

## Variables de entorno

Ver `api/.env.example` y `web/.env.example` (solo placeholders; nunca subas secretos reales). Las claves que contienen `placeholder` cuentan como no configuradas: la pasarela, el botón de login o el email correspondiente se desactiva.

**API** (`api/.env`)
| Variable | Propósito |
|---|---|
| `DATABASE_URL` | Conexión Postgres (la lee Prisma) |
| `PORT` | Puerto HTTP. `.env.example` usa `4000`; si no se define, el código usa `3000` (choca con la web en local) |
| `NODE_ENV` | En `production` las cookies (`auth-token`, estado OAuth) se marcan `Secure` |
| `JWT_SECRET` · `JWT_EXPIRES_IN` | Firma y duración del JWT (default `7d`); `JWT_SECRET` también firma el estado OAuth |
| `CORS_ORIGINS` | Orígenes de la web que pueden llamar a la API con credenciales (separados por coma) |
| `COOKIE_DOMAIN` | Dominio padre compartido por web y API en producción (ej. `tu-dominio.com`); vacío en local |
| `WEB_URL` | Origen de la web al que vuelve el navegador tras iniciar sesión con un proveedor OAuth (ej. `https://tu-dominio.com`); si está vacío, se usa el primer valor de `CORS_ORIGINS` |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | Cliente OAuth de Google Cloud; con ellos aparece el botón «Continuar con Google» |
| `GOOGLE_CALLBACK_URL` | URL de vuelta `…/api/auth/google/callback`; debe figurar tal cual en los URI de redireccionamiento autorizados del cliente OAuth |
| `GITHUB_CLIENT_ID` · `GITHUB_CLIENT_SECRET` | OAuth App de GitHub; con ellos aparece el botón «Continuar con GitHub» |
| `GITHUB_CALLBACK_URL` | URL de vuelta `…/api/auth/github/callback`; debe coincidir exactamente con una de las «Authorization callback URL» de la OAuth App |
| `APP_NAME` | Nombre mostrado en emails (default `Atelier`) y `User-Agent` hacia la API de GitHub |
| `PAYPAL_CLIENT_ID` · `PAYPAL_CLIENT_SECRET` | Credenciales de PayPal; con ellas aparece PayPal en el checkout |
| `PAYPAL_API_BASE` | `https://api-m.sandbox.paypal.com` (sandbox, default) o la URL live |
| `PAYPAL_RETURN_URL` · `PAYPAL_CANCEL_URL` | URLs de redirect post-approval (`/checkout/return`, `/checkout/cancel`). `PAYPAL_RETURN_URL` sin `/checkout/return` es también la URL de la tienda en los emails |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe; con ella se activa el pago con tarjeta |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma del webhook `POST /api/payments/stripe/webhook` (eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded`) |
| `STRIPE_SUCCESS_URL` · `STRIPE_CANCEL_URL` | URLs de vuelta desde Stripe Checkout |
| `RESEND_API_KEY` · `RESEND_FROM` | Emails transaccionales (sin clave, los envíos se omiten) |
| `RESET_PASSWORD_URL` | Página de la web a la que apunta el enlace de reset (`?token=…`) |
| `DO_SPACES_ENDPOINT` · `DO_SPACES_REGION` · `DO_SPACES_BUCKET` · `DO_SPACES_KEY` · `DO_SPACES_SECRET` | Upload de imágenes a DigitalOcean Spaces |
| `DO_SPACES_CDN_ENDPOINT` | Opcional: base de las URLs públicas (CDN); vacío, se usa el endpoint del bucket |

**Web** (`web/.env.local`)
| Variable | Propósito |
|---|---|
| `API_URL` | URL de la API para lecturas desde el servidor (ej. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_API_URL` | URL de la API accesible desde el navegador; se incrusta en el build |
| `ALLOWED_DEV_ORIGINS` | Solo dev: hosts extra (ej. Tailscale) que pueden usar el dev server; sin esto la app no hidrata en esos hosts |

**CLI y MCP** (opcionales, en el entorno de la terminal o en `.mcp.json`)
| Variable | Propósito |
|---|---|
| `ECOM_API_URL` | URL de la API (default: la guardada con `ecom config set-url` o `http://localhost:4000`) |
| `ECOM_TOKEN` | JWT que sustituye la sesión guardada |
| `ECOM_CONFIG` | Ruta alternativa a `~/.ecom/config.json` |
| `ECOM_PASSWORD` | Solo CLI: contraseña para `ecom login` sin prompt |
| `ECOM_READONLY` | Solo MCP: `1` o `true` registra únicamente las herramientas de lectura |

## Scripts útiles

### Backend (`api/`)
```bash
npm run dev                                        # modo watch (tsx)
npm run build && npm start                         # compila; start aplica migraciones y arranca dist/
npm run prisma:migrate                             # prisma migrate dev
npm run prisma:generate                            # regenera el cliente de Prisma
npm run prisma:studio                              # explorador de la DB
npm run prisma:seed                                # poblar DB con datos demo
npm run create-admin -- --email <x> --password <y> [--name <n>] [--force]  # crear o promover admin
```

### Frontend (`web/`)
```bash
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

### CLI
```bash
cd cli && npm install && npm run build && npm link
ecom login -e admin@admin.com          # pide la contraseña
ecom products ls --stock low
ecom orders status <id> shipped
ecom --api https://<api-staging> analytics
```

Comandos, opciones y uso en scripts: [`cli/README.md`](./cli/README.md).

### MCP
```bash
cd mcp && npm install && npm run build
```

Registrado en `.mcp.json` como `ecommerce` (API local). Reutiliza la sesión de `ecom login`. Herramientas y variables: [`mcp/README.md`](./mcp/README.md).

## Flujo de ramas

| Rama | Entorno |
|---|---|
| `main` | Producción |
| `dev` | Staging |

Todo cambio sale de `dev` en una rama propia y vuelve a `dev` por pull request. Cuando se prueba y aprueba en staging, `dev` se mergea a `main`. Nunca se hace push ni PR directo contra `main`.

## Deploy

Cada push a `main` dispara auto-deploy en Railway:

- Cambios en `api/**` → redeploy del servicio `api`
- Cambios en `web/**` → redeploy del servicio `web`

El servicio `api` corre `prisma migrate deploy` automáticamente en cada start, así que las migraciones se aplican sin intervención manual.

Como el navegador llama directo a la API, en Railway hacen falta: `CORS_ORIGINS=https://tu-dominio.com` y `COOKIE_DOMAIN=tu-dominio.com` en `api`, y `NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api` en `web` (disponible en build).

Para el login social, define en `api` las variables `GOOGLE_*`, `GITHUB_*` y `WEB_URL` de cada entorno, y registra la URL `https://<api>/api/auth/{google,github}/callback` en Google Cloud Console y en la OAuth App de GitHub.

Para Stripe, crea en el dashboard de Stripe un endpoint de webhook hacia `https://<api>/api/payments/stripe/webhook` con los eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded`, y copia su secreto de firma en `STRIPE_WEBHOOK_SECRET`. Ajusta también `PAYPAL_RETURN_URL` / `STRIPE_SUCCESS_URL` (`/checkout/return`) y `PAYPAL_CANCEL_URL` / `STRIPE_CANCEL_URL` (`/checkout/cancel`) al dominio de la web.

Seed inicial (manual, una sola vez):
```bash
cd api
DATABASE_URL='postgresql://...@shinkansen.proxy.rlwy.net:.../railway' \
  npx prisma db seed
```

## Licencia

MIT
