# Base de datos

PostgreSQL accedido por Prisma 6. Fuente de verdad: [`api/prisma/schema.prisma`](../api/prisma/schema.prisma). Este documento resume las tablas y relaciones.

## Diagrama ER

```
  ┌────────────────────┐        ┌────────────────────┐
  │        User          │ 1    n │  PasswordResetToken  │
  │ id (uuid) PK         │───────▶│ userId FK (cascade)  │
  │ email unique         │        │ token unique         │
  │ passwordHash?        │        │ expiresAt            │
  │ googleId? unique     │        └────────────────────┘
  │ githubId? unique     │
  │ name? avatarUrl?     │
  │ role USER|ADMIN      │
  └──────────┬───────────┘
             │ 1 (userId?, SetNull)
             ▼ n
  ┌────────────────────────┐  n    1 ┌──────────────┐
  │         Order            │────────▶│   Customer   │
  │ status OrderStatus       │          │ email unique │
  │ total, paymentMethod     │          │ name         │
  │ paypalOrderId? unique    │          └──────────────┘
  │ paypalCaptureId?         │
  │ stripeSessionId? unique  │
  │ stripePaymentIntentId?   │
  └────────────┬─────────────┘
               │ 1 (cascade)
               ▼ n
  ┌────────────────────────┐  n    1 ┌──────────────────┐  n    1 ┌──────────────┐
  │       OrderItem          │────────▶│     Product      │────────▶│   Category   │
  │ quantity, unitPrice      │          │ price, stock     │ SetNull  │ slug unique  │
  │ sizeLabel? colorLabel?   │          │ imageUrl? images │          │ name, image? │
  │ variantId? (SetNull)     │          │ isNew/Sale/Feat. │          │ isVisible    │
  └────────────┬─────────────┘          └────────┬─────────┘          └──────────────┘
               │ n                              │ 1 (cascade)
               │                                ▼ n
               │                 1  ┌───────────────────────┐
               └────────────────────▶│    ProductVariant     │
                                    │ size? color? sku?     │
                                    │ stock, price?         │
                                    └───────────────────────┘

  Sin relaciones:  Discount (code unique, type, value, status, expiresAt?)
                   NewsletterSubscriber (email unique)
```

## Tablas

Los modelos sin `@@map` usan el nombre del modelo como tabla (`"Product"`, `"Order"`, …). Todos los `id` son `uuid` generados por Prisma.

### `users` (model `User`)

Cuentas con acceso a la plataforma (compradores + admins), con contraseña, con un proveedor OAuth o con ambos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` unique | lowercased al grabar |
| `passwordHash` | `text?` | bcrypt, 10 rounds. `null` en cuentas creadas con Google o GitHub (pueden crearla con «¿Olvidaste tu contraseña?») |
| `googleId` | `text?` unique | `sub` de Google; se vincula por email verificado |
| `githubId` | `text?` unique | id de GitHub; se vincula por email primario verificado |
| `name` | `text?` | display name |
| `avatarUrl` | `text?` | URL del avatar (subido a Spaces o del proveedor OAuth) |
| `role` | enum `Role` | `USER` \| `ADMIN`, default `USER` |
| `createdAt` / `updatedAt` | timestamp | |

Relaciones: `orders` (1‑n), `passwordResetTokens` (1‑n).

### `password_reset_tokens` (model `PasswordResetToken`)

Tokens de reset de contraseña, single-use, 1 hora de vida.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `userId` | `uuid` FK → `users.id` | `onDelete: Cascade` |
| `token` | `text` unique | 32 bytes hex |
| `expiresAt` | timestamp | |
| `createdAt` | timestamp | |

Índice: `(userId)`.

### `Product`

Producto del catálogo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text` | |
| `description` | `text?` | |
| `price` | `decimal(10,2)` | precio base |
| `stock` | `int` | default 0; fallback cuando no hay variantes |
| `imageUrl` | `text?` | imagen principal |
| `images` | `text[]` | galería adicional, default `[]` |
| `isNew` / `isSale` / `isFeatured` | `boolean` | flags de catálogo, default `false` |
| `categoryId` | `uuid?` FK → `Category.id` | `onDelete: SetNull` |
| `createdAt` / `updatedAt` | timestamp | |

Relaciones: `variants` (1‑n), `orderItems` (1‑n), `category` (n‑1).

### `ProductVariant`

Combinación talla + color de un producto. Opcional: si el producto no tiene variantes, se usa `Product.stock`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `productId` | `uuid` FK → `Product.id` | `onDelete: Cascade` |
| `size` | `text?` | |
| `color` | `text?` | hex o nombre |
| `sku` | `text?` unique | |
| `stock` | `int` | default 0 |
| `price` | `decimal(10,2)?` | override del precio base |
| `createdAt` / `updatedAt` | timestamp | |

Constraints: `@@unique([productId, size, color])` · Índice: `(productId)`.

### `Category`

Categorías del catálogo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` unique | URL-friendly |
| `name` | `text` | |
| `image` | `text?` | hero de categoría |
| `isVisible` | `boolean` | default `true` |
| `createdAt` / `updatedAt` | timestamp | |

### `Customer`

Registro de cliente (separado de `User` para poder registrar compras de invitados en el futuro). El checkout hace upsert por email usando el del `User` logueado. El segmento (`new` / `returning` / `vip`) no se guarda: la API lo calcula a partir de sus pedidos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` unique | |
| `name` | `text` | |
| `createdAt` / `updatedAt` | timestamp | |

### `Order`

Pedido realizado. Relacionado al `User` que pagó (nullable para pedidos de seed/invitado) y obligatoriamente a un `Customer`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `customerId` | `uuid` FK → `Customer.id` | sin `onDelete` (restrict) |
| `userId` | `uuid?` FK → `users.id` | `onDelete: SetNull` |
| `status` | enum `OrderStatus` | default `PENDING` |
| `total` | `decimal(10,2)` | calculado server-side |
| `paymentMethod` | `text` | el checkout graba `"PayPal"` o `"Stripe"`; texto libre en pedidos creados por un admin |
| `paypalOrderId` | `text?` unique | id devuelto por Orders API v2 |
| `paypalCaptureId` | `text?` | id del capture exitoso |
| `stripeSessionId` | `text?` unique | id de la Checkout Session |
| `stripePaymentIntentId` | `text?` | PaymentIntent del pago completado |
| `createdAt` / `updatedAt` | timestamp | |

### `OrderItem`

Línea de pedido. Snapshotea `unitPrice` y etiquetas (`sizeLabel` / `colorLabel`) para mantener histórico aunque el producto/variante cambie después.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `orderId` | `uuid` FK → `Order.id` | `onDelete: Cascade` |
| `productId` | `uuid` FK → `Product.id` | sin `onDelete` (restrict) |
| `variantId` | `uuid?` FK → `ProductVariant.id` | `onDelete: SetNull` |
| `sizeLabel` / `colorLabel` | `text?` | snapshot |
| `quantity` | `int` | |
| `unitPrice` | `decimal(10,2)` | snapshot |

### `newsletter_subscribers` (model `NewsletterSubscriber`)

Altas del formulario de newsletter del storefront (`POST /api/newsletter`, upsert por email).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` unique | lowercased |
| `createdAt` / `updatedAt` | timestamp | |

### `Discount`

Códigos promocionales. Se gestionan desde el dashboard, la CLI y el MCP, pero el checkout todavía no los aplica.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `code` | `text` unique | en mayúsculas |
| `description` | `text?` | |
| `type` | enum `DiscountType` | `PERCENT` \| `FIXED` \| `SHIPPING` |
| `value` | `decimal(10,2)` | |
| `usesCount` | `int` | default 0 |
| `limit` | `int?` | máximo de usos |
| `status` | enum `DiscountStatus` | default `ACTIVE` |
| `expiresAt` | `timestamp?` | |
| `createdAt` / `updatedAt` | timestamp | |

## Enums

- **`Role`** · `USER`, `ADMIN`
- **`OrderStatus`** · `PENDING` → `PROCESSING` → `SHIPPED` → `DELIVERED` \| `CANCELLED`
- **`DiscountType`** · `PERCENT`, `FIXED`, `SHIPPING`
- **`DiscountStatus`** · `ACTIVE`, `SCHEDULED`, `EXPIRED`

## Reglas de integridad notables

- Borrar un **Category** deja sus productos con `categoryId = null` (no los elimina).
- Borrar un **User** deja sus órdenes con `userId = null` (histórico preservado) y borra sus tokens de reset.
- Borrar un **Product** hace cascade a sus `ProductVariant`. Si tiene `OrderItem`, la FK lo impide y la API responde `409` («No se puede eliminar un producto con pedidos»).
- Borrar un **Customer** con pedidos también falla por FK y la API responde `409`.
- Borrar una **Order** hace cascade a sus `OrderItem`.
- Borrar una **ProductVariant** deja `OrderItem.variantId = null` pero los snapshots de talla/color sobreviven.
- El paso de `PENDING` a `PROCESSING` en el checkout es un `UPDATE … WHERE status = 'PENDING'`, así que retorno y webhook no confirman dos veces la misma orden.

## Migraciones

Historial en `api/prisma/migrations/`:

| Migración | Cambio |
|---|---|
| `20260421034219_init` | Tabla `Product` |
| `20260421045134_add_commerce_models` | `Category`, `Customer`, `Order`, `OrderItem`, `Discount` y sus enums |
| `20260421153832_add_user_auth` | `users` y enum `Role` |
| `20260421170000_add_paypal_fields` | `paypalOrderId` / `paypalCaptureId` y FK `userId` en `Order` |
| `20260421180000_add_password_reset_tokens` | `password_reset_tokens` |
| `20260421223723_add_product_variants_and_flags` | `ProductVariant`, galería y flags de producto |
| `20260619095052_add_newsletter_subscribers` | `newsletter_subscribers` |
| `20260927013814_add_user_avatar` | `users.avatarUrl` |
| `20260929030619_add_stripe_fields` | `stripeSessionId` / `stripePaymentIntentId` en `Order` |
| `20261001150000_add_user_google_id` | `users.googleId` y `passwordHash` opcional |
| `20261001195632_add_user_github_id` | `users.githubId` |

Se aplican automáticamente en cada deploy de Railway (`npm start` corre `prisma migrate deploy` antes de levantar el servicio `api`).

Para desarrollo local, usar `npx prisma migrate dev --name <descripcion>` (o `npm run prisma:migrate`) cuando cambies el schema.

## Seed

`api/prisma/seed.ts` crea:

- 2 usuarios: `admin@admin.com` (ADMIN) y `user@user.com` (USER) — password `admin123` / `user123`
- 4 categorías (Mujer, Hombre, Accesorios, Calzado)
- 7 productos con imágenes Unsplash
- 7 clientes demo
- 12 órdenes de los últimos 20 días (para el dashboard Analytics)
- 5 descuentos de ejemplo (`WELCOME10`, `SUMMER25`, `FREESHIP80`, `BLACKFRIDAY`, `EASTER20`)

Invocar con: `npx prisma db seed` o `npm run prisma:seed` (requiere `DATABASE_URL` válido en el entorno).
