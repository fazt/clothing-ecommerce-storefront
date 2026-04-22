# ecommerce-clothes

Monorepo de un e-commerce de ropa con storefront público, checkout PayPal y panel de administración. Dos sub-apps TypeScript conectadas por una API REST, desplegadas en Railway.

- **Storefront** en vivo: https://ecommerce-clothes.lat
- **API** en vivo: https://api.ecommerce-clothes.lat

## Arquitectura

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ ecommerce-web  │◀───▶│ ecommerce-api  │◀───▶│   Postgres     │
│  Next.js 16    │     │ Express + TS   │     │   (Railway)    │
│  React 19      │     │ Prisma 6       │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │
        │                      ├──▶ PayPal (sandbox/prod)
        │                      ├──▶ Resend (emails)
        │                      └──▶ DigitalOcean Spaces (imágenes)
        │
        └─▶ LocalStorage (carrito, session cookie auth)
```

Tres servicios en Railway en un único proyecto (auto-deploy en push a `main`):

| Servicio | Tipo | Root | Dominio |
|---|---|---|---|
| `web` | Next.js | `ecommerce-web/` | `ecommerce-clothes.lat` |
| `api` | Node/Express | `ecommerce-api/` | `api.ecommerce-clothes.lat` |
| `Postgres` | Managed DB | — | interno |

## Funcionalidades

- **Storefront** (`/`, `/products`, `/products/[slug]`, `/checkout`): catálogo con categorías, galería de imágenes por producto, variantes (talla + color), carrito con localStorage.
- **Auth** (`/login`, `/register`, `/forgot-password`, `/reset-password`): JWT + bcrypt, cookies HttpOnly, flujo completo de reset con email.
- **Checkout PayPal**: flujo redirect clásico, orden persistida en DB, email de confirmación al completar.
- **Dashboard admin** (`/dashboard`): Reports con KPIs, gráficos, stock bajo, top productos y leaderboards. CRUD de productos, categorías, órdenes, clientes, descuentos, usuarios.
- **Dashboard USER** (`/dashboard/my-orders`): historial de compras del cliente logueado.
- **Upload de imágenes**: drag & drop + paste clipboard → backend proxy → DigitalOcean Spaces.
- **Emails transaccionales**: bienvenida al registrar, reset password, confirmación de compra (vía Resend).

## Estructura

```
ecommerce-clothes/
├── ecommerce-api/           # Node + Express + Prisma
│   ├── src/
│   │   ├── index.ts         # entry point
│   │   ├── routes.ts        # router raíz
│   │   ├── lib/prisma.ts    # cliente singleton
│   │   ├── middleware/      # requireAuth, requireAdmin
│   │   ├── modules/         # auth, users, products, categories,
│   │   │                    # customers, orders, discounts,
│   │   │                    # analytics, payments, email, storage
│   │   └── types/express.d.ts
│   ├── prisma/
│   │   ├── schema.prisma    # modelos (ver docs/database.md)
│   │   ├── migrations/      # historial de migraciones
│   │   └── seed.ts          # usuarios + catálogo demo
│   ├── scripts/
│   │   └── create-admin.ts  # promueve un admin directo en DB
│   └── nixpacks.toml        # config Railway (Node 20)
│
├── ecommerce-web/           # Next.js 16 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── (store)/     # storefront público
│   │   │   ├── (auth)/      # login/register/forgot/reset
│   │   │   └── dashboard/   # admin (/) + cliente (/my-orders)
│   │   ├── components/      # UI compartida
│   │   │   ├── dashboard/   # sidebar, nav, header del admin
│   │   │   └── ui/          # shadcn primitives
│   │   └── lib/
│   │       ├── api.ts       # cliente REST tipado
│   │       ├── products.ts  # fetch + mapping al dominio
│   │       └── session.ts   # cookies auth + getSessionUser
│   ├── proxy.ts             # middleware Next 16 (auth gate)
│   └── nixpacks.toml
│
├── docs/                    # documentación adicional
│   ├── architecture.md      # detalles de arquitectura y flujos
│   └── database.md          # schema de base de datos
│
└── README.md                # este archivo
```

Más detalles: [`docs/architecture.md`](./docs/architecture.md) y [`docs/database.md`](./docs/database.md).

## Stack

**Backend (`ecommerce-api`)**
- Node.js 20 · TypeScript 5 · Express 4
- Prisma 6 · PostgreSQL
- bcrypt · jsonwebtoken · multer
- @aws-sdk/client-s3 · resend · dotenv

**Frontend (`ecommerce-web`)**
- Next.js 16 (App Router, Turbopack) · React 19
- Tailwind CSS 4 · shadcn/ui · base-ui · lucide-react
- next-themes · tailwind-merge · class-variance-authority

**Infra**
- Railway (hosting + Postgres)
- DigitalOcean Spaces (object storage, S3-compatible)
- PayPal (Orders API v2, sandbox)
- Resend (email)

## Desarrollo local

### 1. Requisitos

- Node.js 20+
- Docker (para Postgres local) o una instancia Postgres accesible
- Cuentas opcionales: PayPal sandbox, Resend, DigitalOcean Spaces (el proyecto degrada si faltan)

### 2. Postgres local

```bash
docker run -d --name pg-ecommerce -p 5434:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce postgres:16
```

### 3. Backend

```bash
cd ecommerce-api
cp .env.example .env          # completa las variables
npm install
npx prisma migrate dev         # crea tablas + aplica migraciones
npx prisma db seed             # admin@admin.com / user@user.com + catálogo
npm run dev                    # http://localhost:4000
```

### 4. Frontend

```bash
cd ecommerce-web
cp .env.example .env.local     # API_URL=http://localhost:4000/api
npm install
npm run dev                    # http://localhost:3000
```

### 5. Credenciales seed

| Rol | Email | Password |
|---|---|---|
| ADMIN | `admin@admin.com` | `admin123` |
| USER | `user@user.com` | `user123` |

## Variables de entorno

Ver `ecommerce-api/.env.example` y `ecommerce-web/.env.example`. Resumen:

**API**
| Variable | Propósito |
|---|---|
| `DATABASE_URL` | Conexión Postgres |
| `PORT` | Puerto HTTP (default 4000) |
| `JWT_SECRET` · `JWT_EXPIRES_IN` | Auth |
| `APP_NAME` | Nombre mostrado en emails |
| `PAYPAL_CLIENT_ID` · `PAYPAL_CLIENT_SECRET` · `PAYPAL_API_BASE` | PayPal credentials |
| `PAYPAL_RETURN_URL` · `PAYPAL_CANCEL_URL` | URLs de redirect post-approval |
| `RESEND_API_KEY` · `RESEND_FROM` | Emails transaccionales |
| `RESET_PASSWORD_URL` | Enlace que se envía por email |
| `DO_SPACES_ENDPOINT` · `DO_SPACES_REGION` · `DO_SPACES_BUCKET` · `DO_SPACES_KEY` · `DO_SPACES_SECRET` | Upload de imágenes |

**Web**
| Variable | Propósito |
|---|---|
| `API_URL` | URL de la API (ej. `http://localhost:4000/api`) |

## Scripts útiles

### Backend
```bash
npm run dev                                        # modo watch
npm run build && npm start                         # producción local
npm run prisma:seed                                # poblar DB con datos demo
npm run create-admin -- --email <x> --password <y>  # promover admin
```

### Frontend
```bash
npm run dev        # Next.js dev
npm run build
npm start
```

## Deploy

Cada push a `main` dispara auto-deploy en Railway:

- Cambios en `ecommerce-api/**` → redeploy del servicio `api`
- Cambios en `ecommerce-web/**` → redeploy del servicio `web`

El servicio `api` corre `prisma migrate deploy` automáticamente en cada start, así que las migraciones se aplican sin intervención manual.

Seed inicial (manual, una sola vez):
```bash
cd ecommerce-api
DATABASE_URL='postgresql://...@shinkansen.proxy.rlwy.net:.../railway' \
  npx prisma db seed
```

## Licencia

MIT
