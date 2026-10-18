# Verificación pendiente (v3)

La versión 3 se escribió en **modo solo escritura** (2026-10-17): no se instalaron dependencias ni se
ejecutó nada (ni typecheck, ni build, ni tests, ni Docker, ni navegador). Esta lista es lo que hay que
comprobar al levantarla por primera vez, en este orden.

## 0. Lockfile y dependencias

El repo pasó de `npm` (un `package-lock.json` por sub-app, borrados) a un **workspace pnpm** en la raíz.
No hay `pnpm-lock.yaml` todavía: los Dockerfiles usan `--frozen-lockfile` y fallarán hasta generarlo.

```bash
pnpm install                 # genera pnpm-lock.yaml y el cliente Prisma (postinstall)
git add pnpm-lock.yaml && git commit -m "chore: lockfile de pnpm"
```

Cambios de versión mayores escritos sin instalar (revisar que resuelvan):
- API: Express 4 → **5**, Prisma 6 → **7** (`prisma-client` con `moduleFormat = "cjs"`, `@prisma/adapter-pg`, `pg`),
  `bcrypt` → **bcryptjs** (hashes compatibles), dotenv 17, SDK `stripe` eliminado (ahora REST),
  nuevos: helmet, express-rate-limit 8, pino, pino-http, vitest 4, supertest. `tsx` pasó a `dependencies`
  (el seed y `create-admin` corren dentro de la imagen).
- Web: se quitó el paquete `cn` (importaban `cn` desde un paquete npm ajeno en vez de `@/lib/utils`);
  `shadcn` pasó a devDependencies (solo lo usa `globals.css` al compilar).
- `api/tsconfig.json` usa `module/moduleResolution: node16`. Si el cliente generado de Prisma 7 da
  errores de resolución, probar `moduleResolution: "bundler"` + `module: "preserve"` o cambiar el generador.

## 1. Tipos, lint y build

```bash
pnpm typecheck     # api (tsc), web (tsc), cli, mcp
pnpm lint          # web (eslint-config-next 16)
pnpm build
```

Puntos con más riesgo de error de tipos:
- `api/src/generated/prisma/client` debe exportar `Prisma`, `PrismaClient`, enums (`PaymentProviderId`,
  `OrderStatus`…) y tipos de modelo (`Discount`). Ajustar los imports si cambia el nombre del archivo.
- `Prisma.TransactionClient` como parámetro de `computeQuote` (se le pasa también el cliente normal).
- `app.ts`: tipos de `pino-http` (`serializers`, `autoLogging.ignore`) y `req.log`.
- `lib/validate.ts` redefine `req.query/params/body` con `Object.defineProperty` (Express 5 hace `req.query` de solo lectura).
- Web: `checkout-view.tsx` (form grande), `product-reviews.tsx`, páginas nuevas del panel y `next.config.ts`
  (`output: "standalone"`, `outputFileTracingRoot`). eslint-plugin-react-hooks 7 puede marcar `setState` en efectos.

## 2. Base de datos y migración escrita a mano

```bash
pnpm db:up
pnpm db:deploy
pnpm --filter ecommerce-api exec prisma migrate diff \
  --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script
```

El `diff` debe salir **vacío**. La migración `20261017230000_checkout_multiprovider_reviews_wishlist`:
- migra `stripeSessionId/paypalOrderId/...` a `provider/providerRef/paymentRef` y borra las columnas viejas;
- agrega `Order.number` (SERIAL, renumerado desde 1001) y ajusta la secuencia;
- **borra** los `password_reset_tokens` existentes (ahora se guardan hasheados);
- agrega `REFUNDED` al enum `OrderStatus` (no se usa dentro de la misma migración).

Después: `pnpm db:seed` y revisar el conteo que imprime (7 productos, ~120 variantes, 13 órdenes, 9 reseñas).

## 3. Tests

```bash
pnpm --filter ecommerce-api test
```

- `test/auth.test.ts`: login, 401/403/404, token de reset hasheado, **cambio de contraseña invalida sesiones**.
- `test/checkout.test.ts`: cotización en servidor, variante obligatoria, **8 compras simultáneas de 3 unidades
  → 3 órdenes** (sin sobreventa), **límite de cupón atómico**, pago simulado aprobado/rechazado (stock y cupón
  devueltos), orden ajena → 404, vencimiento que libera una sola vez, **webhook de Stripe firmado e idempotente**,
  reembolso desde el panel.
- `test/pricing.test.ts`: reglas de cupones y firmas de Stripe / Mercado Pago.

Si el test de concurrencia falla por timeouts, subir el pool del adapter (`PrismaPg({ connectionString, max: 20 })`).

## 4. Flujos en el navegador (dev: http://127.0.0.1:5226)

1. Registro → email de bienvenida en el log (sin Resend) → login.
2. Producto con tallas/colores: las combinaciones agotadas no se pueden elegir; favorito (corazón) → aparece en
   `/dashboard/wishlist`.
3. Reseña: con `user@user.com` debe salir «compra verificada»; el promedio del producto se actualiza.
4. Checkout: dirección, método de envío (gratis desde $80), cupón `BIENVENIDA10` / `VERANO25` / `ENVIOGRATIS`,
   pasarela «Pago simulado» → aprobar → confirmación con número `#10xx` y desglose → email de confirmación en el log.
5. Rechazar un pago simulado → `/checkout/cancel` → el stock vuelve (ver la variante en el panel).
6. Dejar una orden pendiente y esperar `ORDER_RESERVATION_MINUTES` (o bajarlo a 5) → el job la cancela.
7. Panel: Resumen/Analíticas solo cuentan pedidos pagados; pedido → «Enviado» pide el seguimiento y manda el
   email; «Reembolsar» en un pedido pagado; cancelar un pedido pagado debe dar 409.
8. Panel → Envíos (crear/editar/desactivar), Reseñas (ocultar → baja el promedio), Ajustes (estado de pasarelas).
9. Móvil (375 px): checkout en una columna, tablas con scroll horizontal, header sin desbordes.
10. Tema oscuro en checkout, reseñas y páginas nuevas del panel.

Con claves de prueba reales (opcional): Stripe test (`stripe listen --forward-to 127.0.0.1:4057/api/webhooks/stripe`),
PayPal sandbox (necesita `PAYPAL_WEBHOOK_ID`) y Mercado Pago `TEST-...` con `CURRENCY` de la cuenta.

## 5. Docker de producción

```bash
cp .env.prod.example .env.prod   # POSTGRES_PASSWORD, JWT_SECRET (32+), COOKIE_SECURE=false si es HTTP local
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
curl -s http://127.0.0.1:8126/healthz && curl -s http://127.0.0.1:8126/api/health
docker compose -f docker-compose.prod.yml exec proxy nginx -t
```

- Revisar que la imagen de la API tenga `src/generated/prisma` (lo genera el `postinstall` en la etapa `deps`) y que el
  seed corra con `./node_modules/.bin/tsx prisma/seed.ts`.
- Next standalone: el `server.js` debe quedar en `web/server.js` (por `outputFileTracingRoot` en la raíz).
- La pasarela simulada debe aparecer **apagada** (no sale en el checkout) salvo `PAYMENTS_SIMULATED_ENABLED=true`.
- `docker-entrypoint.sh` con LF (`.gitattributes` lo fuerza).
- Al terminar: `docker compose -f docker-compose.prod.yml down -v` y `docker image prune -f`.

## 6. Riesgos conocidos / decisiones

- El detalle de producto busca por slug recorriendo todo el catálogo (`getProductBySlug`); con miles de productos
  conviene un campo `slug` único en la base.
- El formulario de cupones del panel todavía no expone `minSubtotal` ni `startsAt` (la API sí los acepta; el seed los usa).
- El Resumen del panel pide todas las órdenes para sus gráficos (`ordersApi.listAll`): con mucho volumen, mover esos
  agregados a `/api/analytics`.
- Los emails sin `RESEND_API_KEY` solo registran destinatario y asunto (no el enlace de reset, que lleva un token).
- `AGENTS.md` pide trabajar en `develop`; por instrucción del bucle este trabajo se subió directo a `main`.
- Capturas: las de `docs/screenshots` son reales pero de la v2; faltan las de las pantallas nuevas (ver README).
