# Referencia de la API

Endpoints de `api/` derivados del código (`api/src/routes.ts` y `api/src/modules/*/*.routes.ts`). La validación de cada ruta está en el `*.schema.ts` de su módulo. Para los flujos completos (auth, OAuth, pagos, uploads) ver [`architecture.md`](./architecture.md).

## Convenciones

- **Base:** todas las rutas cuelgan de `/api` (ej. `http://localhost:4000/api/products`). `GET /` (fuera de `/api`) responde `{ "message": "Ecommerce API running" }`.
- **Auth:** JWT en la cookie HttpOnly `auth-token` (la emite la API) o en `Authorization: Bearer <token>`.
  - **Público:** sin sesión.
  - **Sesión:** `requireAuth`, cualquier rol. `401` si falta o no es válido el token.
  - **ADMIN:** `requireAuth` + `requireAdmin`. `403` si el rol no es `ADMIN`.
- **Listados** (`GET /<recurso>`): query `page` (≥ 1, default 1), `pageSize` (1–100, default 10), `search` (≤ 100) y los filtros de cada recurso. Respuesta:
  ```json
  { "data": [...], "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }
  ```
- **Validación:** un body, query o params inválido responde `400` con `{ "error": "Datos inválidos", "code": "VALIDATION_ERROR", "details": [{ "path", "message" }] }`.
- **`DELETE`** responde `204` sin cuerpo. Duplicados en campos únicos (email, slug, código, SKU) responden `409`.
- Los booleanos de query solo aceptan los literales `true` / `false`.

## Auth — `/api/auth`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `POST` | `/auth/register` | Público | `{ email, password (≥ 6), name? }` | `201 { user }` + cookie. `409` si el email existe. Envía email de bienvenida |
| `POST` | `/auth/login` | Público | `{ email, password }` | `{ user }` + cookie. `401` credenciales incorrectas o cuenta sin contraseña (`code: PASSWORD_NOT_SET`, creada con OAuth) |
| `POST` | `/auth/logout` | Público | — | Borra la cookie. `204` |
| `POST` | `/auth/forgot-password` | Público | `{ email }` | Siempre `{ ok: true }` (no revela si el email existe). Token de 1 h por email |
| `POST` | `/auth/reset-password` | Público | `{ token, password (≥ 6) }` | `{ ok: true }`. `400` token inválido o expirado |
| `GET` | `/auth/providers` | Público | — | `{ google: boolean, github: boolean }`: qué proveedores OAuth tienen credenciales |
| `GET` | `/auth/google` | Público | query `redirect?` (ruta interna de la web) | Navegación del navegador: redirige a Google (PKCE + nonce) |
| `GET` | `/auth/google/callback` | Público | query `code`, `state`, `error?` | Emite la cookie y redirige a la web (`WEB_URL` + `redirect`, o `/dashboard` para ADMIN y `/` para USER). Errores → `/login?error=google_<motivo>` |
| `GET` | `/auth/github` | Público | query `redirect?` | Igual que Google, con la OAuth App de GitHub (PKCE, scopes `read:user user:email`) |
| `GET` | `/auth/github/callback` | Público | query `code`, `state`, `error?` | Errores → `/login?error=github_<motivo>` |

Motivos de error OAuth: `unavailable`, `cancelled`, `state`, `email_unverified`, `account_conflict`, `failed`.

## Cuenta — `/api/me`

Todo el router va detrás de `requireAuth` y actúa sobre el usuario en sesión.

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/me` | Sesión | — | Perfil del usuario |
| `PATCH` | `/me` | Sesión | `{ name?, email?, avatarUrl?, currentPassword? }` (estricto) | Cambiar `email` exige `currentPassword`. `409` si el email está en uso |
| `PUT` | `/me/password` | Sesión | `{ currentPassword, newPassword (≥ 6) }` | `204`. `400` contraseña actual incorrecta o cuenta sin contraseña |
| `GET` | `/me/orders` | Sesión | query de paginación | Pedidos del usuario |

## Productos — `/api/products`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/products` | Público | query: paginación, `categoryId`, `stock=in\|low\|out` | `in`: stock ≥ 15 · `low`: 1–14 · `out`: ≤ 0 |
| `GET` | `/products/:id` | Público | — | Incluye categoría y variantes. `404` si no existe |
| `POST` | `/products` | ADMIN | `{ name, price, description?, stock?, imageUrl?, images?[] (≤ 20 URLs), isNew?, isSale?, isFeatured?, categoryId?, variants?[] }` | `201`. `400` si la categoría no existe, `409` SKU duplicado |
| `PATCH` | `/products/:id` | ADMIN | Los mismos campos, todos opcionales | Si se envía `variants`, reemplaza todas las variantes |
| `DELETE` | `/products/:id` | ADMIN | — | `204`. `409` si el producto tiene pedidos |

Variante: `{ size?, color?, sku?, stock (default 0), price? }`; las filas sin `size` ni `color` se descartan.

## Categorías — `/api/categories`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/categories` | Público | query: paginación, `isVisible` | |
| `GET` | `/categories/:id` | Público | — | `404` si no existe |
| `POST` | `/categories` | ADMIN | `{ slug, name, image?, isVisible? (default true) }` | `slug`: minúsculas, números y guiones. `409` slug duplicado |
| `PATCH` | `/categories/:id` | ADMIN | Los mismos campos, opcionales | |
| `DELETE` | `/categories/:id` | ADMIN | — | Sus productos quedan sin categoría |

## Clientes — `/api/customers`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/customers` | ADMIN | query: paginación, `segment=new\|returning\|vip` | Segmento derivado: `vip` con ≥ 5 pedidos o ≥ 1000 gastado, `returning` con ≥ 1 pedido |
| `GET` | `/customers/:id` | ADMIN | — | |
| `POST` | `/customers` | ADMIN | `{ email, name }` | `409` email duplicado |
| `PATCH` | `/customers/:id` | ADMIN | `{ email?, name? }` | |
| `DELETE` | `/customers/:id` | ADMIN | — | `409` si el cliente tiene pedidos |

## Pedidos — `/api/orders`

Los pedidos propios de un cliente están en `GET /me/orders`.

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/orders` | ADMIN | query: paginación, `status` | |
| `GET` | `/orders/:id` | ADMIN | — | Con cliente y líneas |
| `POST` | `/orders` | ADMIN | `{ customerId, paymentMethod, status?, items: [{ productId, quantity, unitPrice?, variantId?, sizeLabel?, colorLabel? }] }` | Sin `unitPrice` se usa el precio del producto |
| `PATCH` | `/orders/:id` | ADMIN | `{ status }` | `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `DELETE` | `/orders/:id` | ADMIN | — | |

## Descuentos — `/api/discounts`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/discounts` | ADMIN | query: paginación, `type`, `status` | |
| `GET` | `/discounts/:id` | ADMIN | — | |
| `POST` | `/discounts` | ADMIN | `{ code, type, value, description?, limit?, status? (default ACTIVE), expiresAt? }` | `code` se guarda en mayúsculas (`A-Z0-9_-`). `PERCENT` ≤ 100. `409` código duplicado |
| `PATCH` | `/discounts/:id` | ADMIN | Los mismos campos, opcionales | |
| `DELETE` | `/discounts/:id` | ADMIN | — | |

## Usuarios — `/api/users`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/users` | ADMIN | query: paginación, `role=USER\|ADMIN` | |
| `GET` | `/users/:id` | ADMIN | — | |
| `POST` | `/users` | ADMIN | `{ email, password (≥ 6), name?, role? (default USER) }` | `409` email duplicado |
| `PATCH` | `/users/:id` | ADMIN | `{ name?, role?, password? }` | `400` si un admin intenta cambiar su propio rol |
| `DELETE` | `/users/:id` | ADMIN | — | `400` si un admin intenta eliminarse |

## Analytics — `/api/analytics`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/analytics/summary` | ADMIN | — | `{ metrics: { revenue, orders, newCustomers, conversionRate }, salesSeries, topProducts }`; cada métrica con `current`, `previous` y `change` |

## Pagos — `/api/payments`

El carrito (`checkoutBody`) es `{ items: [{ productId, quantity (1–99), variantId?, sizeLabel?, colorLabel? }] }` (al menos un item); los precios se resuelven en el servidor.

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `GET` | `/payments/methods` | Público | — | `{ paypal: boolean, stripe: boolean }` |
| `POST` | `/payments/paypal/orders` | Sesión | carrito | `201 { orderId, paypalOrderId, approveUrl }` |
| `POST` | `/payments/paypal/orders/:paypalOrderId/capture` | Sesión | — | Captura y devuelve la orden (`PROCESSING`). Idempotente |
| `POST` | `/payments/stripe/sessions` | Sesión | carrito | `201 { orderId, sessionId, url }` |
| `POST` | `/payments/stripe/sessions/:sessionId/confirm` | Sesión | — | Marca la orden `PROCESSING` si la sesión está pagada |
| `POST` | `/payments/stripe/webhook` | Firma Stripe | body raw + cabecera `stripe-signature` | Procesa `checkout.session.completed` y `checkout.session.async_payment_succeeded`. `{ received: true }` |

Errores: `503` pasarela sin configurar, `502` error de PayPal/Stripe, `404` producto/variante/orden inexistente, `403` orden de otro usuario, `409` pago no completado.

## Uploads — `/api/uploads`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `POST` | `/uploads` | Sesión | `multipart/form-data`: `file`, `folder=products\|categories\|avatars` (default `products`) | `201 { key, publicUrl }`. Un USER solo puede subir a `avatars` (`403`). Tipos: JPEG, PNG, WebP, AVIF, GIF. Máx. 5 MB (`413`). `503` si Spaces no está configurado |

## Newsletter — `/api/newsletter`

| Método | Ruta | Auth | Body / params | Notas |
|---|---|---|---|---|
| `POST` | `/newsletter` | Público | `{ email }` | `201 { ok: true, email }`. Idempotente (upsert). `400` email inválido |
