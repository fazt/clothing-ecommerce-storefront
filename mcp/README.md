# ecommerce-mcp

Servidor MCP (stdio) que expone la API como herramientas para Claude Code, Codex u otro cliente MCP. Node 22.12+, `@modelcontextprotocol/server` v2.

## Instalación

```bash
cd mcp && npm install && npm run build
```

En este repo ya está registrado en `.mcp.json` (servidor `ecommerce`, apuntando a `http://localhost:4000`). Claude Code lo detecta al abrir el proyecto desde la raíz. Para Codex:

```bash
codex mcp add ecommerce --env ECOM_API_URL=http://localhost:4000 -- node /ruta/al/repo/mcp/dist/index.js
```

## Autenticación

Reutiliza la sesión de la CLI: haz `ecom login --api <url>` con la misma URL y el MCP usa ese token (lo relee en cada llamada). Las herramientas marcadas como ADMIN necesitan un usuario ADMIN.

| Variable | Uso |
|---|---|
| `ECOM_API_URL` | URL de la API (por defecto, la guardada por la CLI o `http://localhost:4000`) |
| `ECOM_TOKEN` | Token JWT; tiene prioridad sobre la sesión de la CLI |
| `ECOM_CONFIG` | Ruta alternativa al archivo de config de la CLI |
| `ECOM_READONLY` | `1` o `true` registra solo las herramientas de lectura (úsalo contra producción) |

## Herramientas

Los `list_*` aceptan `search`, `page` y `pageSize` (máx. 100, por defecto 10) además de sus filtros. Todas devuelven la respuesta JSON de la API.

| Herramienta | Tipo | Llama a | Parámetros | Rol |
|---|---|---|---|---|
| `whoami` | Lectura | `GET /me` | — (devuelve también la URL de la API) | Sesión |
| `list_products` | Lectura | `GET /products` | `categoryId`, `stock` (`in` \| `low` \| `out`) | Público |
| `get_product` | Lectura | `GET /products/:id` | `id` | Público |
| `list_categories` | Lectura | `GET /categories` | `isVisible` | Público |
| `list_orders` | Lectura | `GET /orders` | `status` | ADMIN |
| `get_order` | Lectura | `GET /orders/:id` | `id` | ADMIN |
| `list_customers` | Lectura | `GET /customers` | `segment` (`new` \| `returning` \| `vip`) | ADMIN |
| `get_customer` | Lectura | `GET /customers/:id` | `id` | ADMIN |
| `list_discounts` | Lectura | `GET /discounts` | `type`, `status` | ADMIN |
| `list_users` | Lectura | `GET /users` | `role` | ADMIN |
| `analytics_summary` | Lectura | `GET /analytics/summary` | — | ADMIN |
| `update_order_status` | Escritura | `PATCH /orders/:id` | `id`, `status` | ADMIN |
| `update_product` | Escritura | `PATCH /products/:id` | `id` + `name`, `description`, `price`, `stock`, `categoryId`, `isNew`, `isSale`, `isFeatured` (todos opcionales; no toca variantes ni imágenes) | ADMIN |
| `create_discount` | Escritura | `POST /discounts` | `code`, `type`, `value` + `description`, `limit`, `expiresAt`, `status` | ADMIN |

Con `ECOM_READONLY` activo no se registran las tres de escritura. No hay herramientas de borrado a propósito; para eso usa la CLI o el dashboard.

## Desarrollo

`npm run dev` (tsx), `npm run build`, `npm start` (`node dist/index.js`, también expuesto como binario `ecom-mcp`) y `npm run typecheck`. Todo está en `src/index.ts` (registro de herramientas) y `src/client.ts` (URL, token y `fetch` a la API).
