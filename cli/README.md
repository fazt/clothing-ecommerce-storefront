# ecommerce-cli (`ecom`)

CLI para operar la API (`api/`) desde la terminal: catálogo, pedidos, clientes, descuentos, usuarios, analytics, uploads y tu propia cuenta. Node 22.12+, TypeScript y [Commander](https://github.com/tj/commander.js).

## Instalación

```bash
cd cli
npm install
npm run build
npm link            # deja disponible el comando `ecom`
```

Sin `npm link`: `node dist/index.js <comando>`, o en desarrollo `npm run dev -- <comando>`.

## Primeros pasos

```bash
ecom health                                   # ¿responde la API?
ecom login -e admin@admin.com                 # pide la contraseña sin eco
ecom whoami
ecom products list --stock low
```

Por defecto apunta a `http://localhost:4000`. Para staging o producción:

```bash
ecom config set-url https://api.staging.example.com   # se guarda
ecom --api https://api.example.com products ls        # solo esta vez
ECOM_API_URL=https://api.example.com ecom health      # por variable de entorno
```

Cada URL guarda su propia sesión, así que un login en staging nunca se envía a producción. `ecom config show` muestra la API en uso y las sesiones guardadas en `~/.ecom/config.json`.

## Comandos

| Comando | Qué hace |
|---|---|
| `login` · `register` · `logout` · `whoami` | Sesión. `login` acepta `-e/--email`, `-p/--password` o `ECOM_PASSWORD` |
| `forgot-password <email>` · `reset-password <token>` | Recuperación de contraseña |
| `me` · `me update` · `me password` · `me orders` | Tu perfil, contraseña y pedidos |
| `products` · `categories` · `customers` · `discounts` · `users` | `list` · `get <id>` · `create` · `update <id>` · `delete <id>` |
| `orders` | `list` · `get <id>` · `status <id> <estado>` · `create` · `delete <id>` |
| `analytics` | Métricas de los últimos 30 días, ventas diarias y top productos |
| `payments methods` · `payments checkout <stripe\|paypal> --item <id>:<cant>` | Pasarelas y enlace de pago |
| `newsletter subscribe <email>` | Alta en el newsletter |
| `upload <archivo> [--folder products\|categories\|avatars]` | Sube una imagen y devuelve su URL |
| `request <método> <ruta> [-d json] [-q k=v]` | Petición cruda a la API con la sesión actual |
| `health` · `config show` · `config set-url <url>` | Diagnóstico y configuración |

`ecom <comando> --help` lista todas las opciones. Los comandos de admin requieren una sesión con rol `ADMIN`.

### Listados

```bash
ecom orders ls --status pending -n 50      # -n/--page-size, -p/--page
ecom customers ls --segment vip --all      # --all recorre todas las páginas
ecom products ls -s camisa --category <id>
```

### Crear y editar

Las opciones se convierten en el cuerpo de la petición; `update` solo envía los campos que indiques. Los booleanos tienen su forma negativa (`--featured` / `--no-featured`) y `""` borra un campo opcional.

```bash
ecom categories create --slug gorras --name Gorras
ecom products create --name "Gorra" --price 24.5 --stock 10 --category <id> --new
ecom products update <id> --no-new --sale --price 19.99
ecom discounts create --code OTONO15 --type percent --value 15 --expires 2026-12-31
ecom orders status <id> shipped
ecom orders create --customer <id> --payment manual --item <productId>:2 --item <productId>:1:<variantId>
```

Para campos complejos (por ejemplo `variants`) usa `-d/--data` con JSON o `@archivo.json`. Las opciones tienen prioridad sobre `--data`:

```bash
ecom products update <id> -d '{"variants":[{"size":"M","color":"Negro","stock":5}]}'
ecom products create -d @producto.json
```

`delete` pide confirmación; en scripts usa `--yes`.

### Scripts y CI

- `--json` imprime la respuesta de la API tal cual; los errores de la API salen por stderr como JSON. Cualquier fallo termina con código de salida `1`.
- `ECOM_TOKEN` usa ese token en lugar de la sesión guardada; `ECOM_CONFIG` cambia la ruta del archivo de configuración.

```bash
ecom --json products ls --all | jq '.data[] | select(.stock == 0) | .name'
```

## Cómo se autentica

La API devuelve el JWT solo como cookie HttpOnly (`auth-token`). `ecom login` lo lee de la cabecera `Set-Cookie`, lo guarda y lo envía después como `Authorization: Bearer`, que la API también acepta. `logout` borra el token local; como el JWT no tiene estado en el servidor, sigue siendo válido hasta que caduca (`JWT_EXPIRES_IN`).

## Estructura

```
src/
├── index.ts          # programa raíz, opciones globales y manejo de errores
├── client.ts         # cliente HTTP (fetch), login por cookie, paginación, uploads
├── config.ts         # ~/.ecom/config.json: URL de la API y sesiones por URL
├── context.ts        # cliente según --api / ECOM_API_URL / ECOM_TOKEN
├── output.ts         # tablas, colores, --json
├── parsers.ts        # parsers de opciones y --data
├── prompt.ts         # preguntas, contraseña sin eco, confirmación
└── commands/
    ├── resource.ts   # fábrica CRUD (list/get/create/update/delete)
    └── *.ts          # un archivo por módulo de la API
```

Para añadir un recurso nuevo, define sus columnas, filtros y campos en `commands/<recurso>.ts` con `resourceCommand()` y regístralo en `src/index.ts`.
