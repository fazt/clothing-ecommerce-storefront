---
name: ecom-cli
description: Opera la tienda (productos, categorías, pedidos, clientes, descuentos, usuarios, analytics) con la CLI `ecom` del repo (`cli/`). Usar cuando el usuario diga "usa la cli", "ecom", "lista productos/pedidos desde la terminal", "cambia el estado de un pedido", "crea un descuento" u "operar la tienda desde la terminal".
---

# ecom-cli

CLI `ecom` en `cli/` (Node ≥ 22.12 + Commander) que llama a la API de `api/`. Referencia: `cli/README.md` y `ecom <comando> --help`.

## Arranque
- `cd cli && npm install && npm run build && npm link` → comando `ecom`.
- Sin link: `node dist/index.js <cmd>`; en desarrollo `npx tsx src/index.ts <cmd>` (= `npm run dev -- <cmd>`).

## API y sesión
- URL: `--api <url>` > `ECOM_API_URL` > guardada con `ecom config set-url <url>` > `http://localhost:4000`. Acepta la URL con o sin `/api`.
- Local `http://localhost:4000`; staging (rama `develop`): pide la URL al usuario; producción (rama `main`): pide la URL al usuario y no la uses sin su confirmación explícita.
- Trabaja contra local o staging. Producción solo con confirmación explícita del usuario. Prefiere `--api` por comando a `config set-url` (que cambia el destino de todo lo siguiente).
- Antes de operar: `ecom config show` (API en uso y su origen) y `ecom health` (si responde y con qué sesión).
- Cada URL guarda su propia sesión en `~/.ecom/config.json` (`ECOM_CONFIG` cambia la ruta). `ECOM_TOKEN` sustituye la sesión guardada.
- Sin sesión: que el usuario haga `ecom login -e <email>` (pide la contraseña sin eco). Sin TTY: `-p` o `ECOM_PASSWORD`. `logout` borra el token local; `whoami` = `me show`.
- Requieren `ADMIN`: escritura en products/categories, y todo orders, customers, discounts, users y analytics.

## Comandos
`products`, `categories`, `customers`, `discounts`, `users`: `list|ls`, `get|show <id>`, `create`, `update <id>`, `delete|rm <id> [-y]`.
`orders`: `list|ls`, `get|show <id>`, `status <id> <estado>`, `create`, `delete|rm <id> [-y]` (no tiene `update`).
`list`: `-p/--page`, `-n/--page-size` (def. 20, máx. 100), `-s/--search`, `-a/--all` (todas las páginas), más:

| Recurso | Filtros de `list` | Campos de `create` / `update` |
|---|---|---|
| products | `--category <id>`, `--stock in\|low\|out` | `--name --description --price --stock <n> --image <url> --images a,b --category <id> --[no-]new --[no-]sale --[no-]featured` |
| categories | `--visible true\|false` | `--slug --name --image --[no-]visible` |
| customers | `--segment new\|returning\|vip` | `--name --email` |
| discounts | `--type PERCENT\|FIXED\|SHIPPING`, `--status ACTIVE\|SCHEDULED\|EXPIRED` | `--code --description --type --value --limit --status --expires 2026-12-31` |
| users | `--role USER\|ADMIN` | `--email` (solo create) `--password --name --role` |
| orders | `--status PENDING\|PROCESSING\|SHIPPED\|DELIVERED\|CANCELLED` | `create`: `--customer <id> --payment <método> --item <productId>[:cant[:variantId]]` (repetible) `--status` |

- Enums sin distinción de mayúsculas (`shipped` = `SHIPPED`). `update` solo envía lo indicado; `""` quita un campo opcional (p. ej. `--category ""`).
- JSON complejo (p. ej. `variants`): `-d '{...}'` o `-d @archivo.json`; las opciones tienen prioridad.
- Otros: `analytics` (últimos 30 días), `me [show|update|password|orders]`, `payments methods`, `payments checkout stripe|paypal --item ...` (crea un pedido), `newsletter subscribe <email>`, `upload <imagen> [--folder products|categories|avatars]` (máx. 5 MB), `request <GET|POST|PUT|PATCH|DELETE> <ruta> [-d json] [-q k=v]`, `register`, `forgot-password <email>`, `reset-password <token>`.

## Scripts y JSON
- `--json` (antes o después del subcomando) imprime la respuesta de la API; los listados son `{ data: [...], meta: { page, pageSize, total, totalPages } }`. `request` siempre imprime JSON.
- `ecom --json orders ls --status pending --all | jq -r '.data[].id'`
- Cualquier fallo sale con código `1`. Con `--json`, los errores de la API van a stderr como `{ "status": ..., "error": ..., "details"?: [...] }`; los de la CLI (conexión, confirmación) como texto.
- Sin TTY no hay preguntas: pasa todo por opciones (`login -e -p`, `me password --current --new`, `reset-password <token> -p`, `delete --yes`).

## Errores comunes
- `No se pudo conectar con <url>` → API caída o URL errónea: `ecom config show`, `--api`.
- HTTP 401 → sesión inválida o expirada (`ecom login`). HTTP 403 → el usuario no es `ADMIN`.
- HTTP 400 → validación; se listan los campos (`campo: mensaje`).
- `Falta la confirmación` → `delete` sin TTY: añade `--yes` (después de confirmar con el usuario).
- `Nada que actualizar` → `update` sin campos. `No hay sesión para <url>` → `me`/`whoami` sin login.

## Reglas
- Confirma con el usuario antes de: `delete`, `orders status`, cambios de `--role`, `payments checkout`, `request` con método distinto de `GET`, cambios en lote y cualquier escritura contra producción.
- Antes de modificar, consulta el registro (`get`/`list`) y di qué vas a cambiar.
- Nunca imprimas tokens ni contraseñas: no leas `~/.ecom/config.json` ni hagas `echo` de `ECOM_TOKEN`/`ECOM_PASSWORD`.
