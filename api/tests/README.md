# Tests de la API

Suite de [Vitest](https://vitest.dev) que prueba el inventario (stock de productos y variantes, checkout, pagos y cancelaciones) contra una base de datos PostgreSQL real. Solo se simulan PayPal, Stripe y el correo; pedidos y stock pasan por los servicios de verdad.

## Cómo correrlos

1. Levanta PostgreSQL con el `docker-compose.yml` de `api/`:

   ```bash
   docker compose up -d
   ```

2. Instala dependencias y ejecuta los tests:

   ```bash
   npm install
   npm test            # una pasada
   npm run test:watch  # modo watch
   ```

Por defecto se usa `postgresql://postgres:postgres@localhost:5434/ecommerce_test`. Antes de empezar se ejecuta `prisma migrate deploy`, que crea la base de datos `ecommerce_test` si no existe. Para usar otra, define `TEST_DATABASE_URL`:

```bash
TEST_DATABASE_URL="postgresql://usuario:clave@localhost:5432/mi_db_test" npm test
```

> Las tablas se vacían antes de cada test. Por seguridad, el nombre de la base de datos tiene que contener `test`; si no, la suite no arranca. Nunca apuntes `TEST_DATABASE_URL` a la base de datos de desarrollo o de producción.

## Estructura

- `setup/`: URL de la base de datos de tests y migraciones (`globalSetup`).
- `helpers/db.ts`: limpieza de tablas y factories (`createProduct`, `createUser`...).
- `inventory/product-stock.test.ts`: validación zod del stock, alta y edición de productos y variantes, filtro de stock.
- `inventory/checkout-stock.test.ts`: checkout con PayPal y Stripe, descuento de stock, webhook, concurrencia, cancelaciones y pedidos del panel.

## Tests marcados con `it.fails`

Cada `it.fails` documenta un bug de inventario conocido (el comentario encima explica cuál y dónde está). El test describe el comportamiento correcto y hoy falla, por eso Vitest lo da por bueno. Cuando se arregle el bug, ese test empezará a fallar: cámbialo a `it(...)` para que quede como test normal.
