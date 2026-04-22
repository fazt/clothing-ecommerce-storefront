# Base de datos

PostgreSQL accedido por Prisma 6. Fuente de verdad: [`ecommerce-api/prisma/schema.prisma`](../ecommerce-api/prisma/schema.prisma). Este documento resume las tablas y relaciones.

## Diagrama ER

```
           ┌──────────────────┐
           │      User        │
           │ id (uuid) PK     │
           │ email unique     │
           │ passwordHash     │
           │ name?            │
           │ role USER|ADMIN  │
           └────────┬─────────┘
                    │ 1
                    │
     ┌──────────────┼─────────────────────────┐
     │              │                         │
     ▼ n            ▼ n                       │
┌─────────┐   ┌──────────────────┐            │
│  Order  │   │PasswordResetToken│            │
└────┬────┘   │ userId FK        │            │
     │        │ token unique     │            │
     │        │ expiresAt        │            │
     │        └──────────────────┘            │
     │                                        │
     │ n                                      │
     │                                        │
┌────▼────┐                                   │
│Customer │ 1                                 │
│ email   │◀──────────────── Order.customerId │
│ name    │                                   │
└─────────┘                                   │
                                              │
┌────────────┐   ┌──────────────┐             │
│ Category   │ 1 │   Product    │n            │
│ slug uniq  │◀──│ categoryId   │─┐           │
│ name       │   │ price        │ │           │
│ image?     │   │ stock        │ │ 1         │
│ isVisible  │   │ images String[]│            │
└────────────┘   │ isNew/Sale/..│ │           │
                 └───────┬──────┘ │           │
                         │ 1      │           │
                         │        │           │
                         ▼ n      │           │
                 ┌──────────────┐ │           │
                 │ProductVariant│ │           │
                 │ productId FK │ │           │
                 │ size? color? │ │           │
                 │ sku uniq?    │ │           │
                 │ stock        │ │           │
                 │ price?       │ │           │
                 └───────┬──────┘ │           │
                         │ 1      │           │
                         │        │           │
                         ▼ n      ▼ n         │
                 ┌────────────────────┐       │
                 │    OrderItem       │n      │
                 │ orderId FK         │───────┤
                 │ productId FK       │       │
                 │ variantId? FK      │       │
                 │ quantity, unitPrice│       │
                 └────────────────────┘       │
                                              │
                 ┌────────────────────┐       │
                 │     Discount       │       │
                 │ code uniq          │       │
                 │ type PERCENT|FIXED │       │
                 │    |SHIPPING       │       │
                 │ value              │       │
                 │ status ACTIVE|..   │       │
                 │ expiresAt?         │       │
                 └────────────────────┘       │
```

## Tablas

### `users` (model `User`)

Cuentas con acceso a la plataforma (compradores + admins).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` unique | lowercased al grabar |
| `passwordHash` | `text` | bcrypt, 10 rounds |
| `name` | `text?` | display name |
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
| `stock` | `int` | fallback cuando no hay variantes |
| `imageUrl` | `text?` | imagen principal |
| `images` | `text[]` | galería adicional |
| `isNew` / `isSale` / `isFeatured` | `boolean` | flags de catálogo |
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
| `stock` | `int` | |
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

Registro de cliente (separado de `User` para poder registrar compras de invitados en el futuro). El checkout hace upsert por email usando el del `User` logueado.

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
| `customerId` | `uuid` FK → `Customer.id` | |
| `userId` | `uuid?` FK → `User.id` | `onDelete: SetNull` |
| `status` | enum `OrderStatus` | default `PENDING` |
| `total` | `decimal(10,2)` | calculado server-side |
| `paymentMethod` | `text` | ej. `"PayPal"` |
| `paypalOrderId` | `text?` unique | id devuelto por Orders API v2 |
| `paypalCaptureId` | `text?` | id del capture exitoso |
| `createdAt` / `updatedAt` | timestamp | |

### `OrderItem`

Línea de pedido. Snapshotea `unitPrice` y etiquetas (`sizeLabel` / `colorLabel`) para mantener histórico aunque el producto/variante cambie después.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `orderId` | `uuid` FK → `Order.id` | `onDelete: Cascade` |
| `productId` | `uuid` FK → `Product.id` | |
| `variantId` | `uuid?` FK → `ProductVariant.id` | `onDelete: SetNull` |
| `sizeLabel` / `colorLabel` | `text?` | snapshot |
| `quantity` | `int` | |
| `unitPrice` | `decimal(10,2)` | snapshot |

### `Discount`

Códigos promocionales (no implementados en checkout aún, estructura lista).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `code` | `text` unique | |
| `description` | `text?` | |
| `type` | enum `DiscountType` | `PERCENT` \| `FIXED` \| `SHIPPING` |
| `value` | `decimal(10,2)` | |
| `usesCount` | `int` | default 0 |
| `limit` | `int?` | máximo de usos |
| `status` | enum `DiscountStatus` | `ACTIVE` \| `SCHEDULED` \| `EXPIRED` |
| `expiresAt` | `timestamp?` | |
| `createdAt` / `updatedAt` | timestamp | |

## Enums

- **`Role`** · `USER`, `ADMIN`
- **`OrderStatus`** · `PENDING` → `PROCESSING` → `SHIPPED` → `DELIVERED` \| `CANCELLED`
- **`DiscountType`** · `PERCENT`, `FIXED`, `SHIPPING`
- **`DiscountStatus`** · `ACTIVE`, `SCHEDULED`, `EXPIRED`

## Reglas de integridad notables

- Borrar un **Category** deja sus productos con `categoryId = null` (no los elimina).
- Borrar un **User** deja sus órdenes con `userId = null` (histórico preservado).
- Borrar un **Product** hace cascade a sus `ProductVariant`; los `OrderItem` quedan intactos con `productId` apuntando a la fila huérfana (mantiene histórico de línea).
- Borrar una **Order** hace cascade a sus `OrderItem`.
- Borrar una **ProductVariant** deja `OrderItem.variantId = null` pero los snapshots de talla/color sobreviven.

## Migraciones

Historial en `ecommerce-api/prisma/migrations/`:

1. `20260421034219_init` — tablas iniciales
2. `20260421045134_add_commerce_models` — categorías + customers + orders base
3. `20260421153832_add_user_auth` — User + Role
4. `20260421170000_add_paypal_fields` — userId, paypalOrderId, paypalCaptureId en Order
5. `20260421180000_add_password_reset_tokens` — tabla de reset
6. `20260421223723_add_product_variants_and_flags` — ProductVariant, flags isNew/isSale/isFeatured, OrderItem.sizeLabel/colorLabel

Se aplican automáticamente en cada deploy de Railway (`prisma migrate deploy` corre al start del servicio `api`).

Para desarrollo local, usar `npx prisma migrate dev --name <descripcion>` cuando cambies el schema.

## Seed

`ecommerce-api/prisma/seed.ts` crea:

- 2 usuarios: `admin@admin.com` (ADMIN) y `user@user.com` (USER) — password `admin123` / `user123`
- 4 categorías (Mujer, Hombre, Accesorios, Calzado)
- ~8 productos con imágenes Unsplash
- ~7 clientes demo
- ~12 órdenes de los últimos 30 días (para el dashboard Analytics)
- 5 descuentos de ejemplo

Invocar con: `npx prisma db seed` (requiere `DATABASE_URL` válido en el entorno).
