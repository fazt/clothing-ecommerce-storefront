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
| `ECOM_READONLY=1` | Registra solo las herramientas de lectura (úsalo contra producción) |

## Herramientas

- **Lectura:** `whoami`, `list_products`, `get_product`, `list_categories`, `list_orders`, `get_order`, `list_customers`, `get_customer`, `list_discounts`, `list_users`, `analytics_summary`. Los `list_*` aceptan `search`, `page`, `pageSize` (máx. 100) y los filtros del API.
- **Escritura:** `update_order_status`, `update_product` (no toca variantes), `create_discount`.

No hay herramientas de borrado a propósito; para eso usa la CLI o el dashboard.
