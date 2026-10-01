---
name: myreview
description: Revisa código sin usar, código repetido y código mal optimizado. Usar cuando el usuario pida "myreview", "código muerto", "código sin usar", "código repetido", "mal optimizado" o invoque /myreview.
---

# myreview

Revisa lo que indique el usuario (ruta, carpeta, rama o PR). Solo genera un informe: no modifica código salvo que se pida después.

## Qué buscar

- **Sin usar**: exports, archivos, imports, variables, dependencias, componentes, endpoints sin consumidor interno, código comentado, ramas inalcanzables.
- **Repetido**: lógica copiada en 2+ sitios, helpers que ya existen en `src/lib` o `src/hooks`, tipos o validaciones duplicados entre web y api, `fetch` fuera de `src/lib/api.ts`.
- **Mal optimizado**: N+1 o `findMany` sin `take` en Prisma, `await` en loop (→ `Promise.all`), `find` dentro de `map` (→ `Map`/`Set`), `"use client"` innecesario, fetch en `useEffect`, `<img>` en vez de `next/image`, imports de librerías enteras.

## Antes de reportar

- **Sin usar**: haz grep en `api`, `web` y `cli`. No son huérfanos los archivos de convención de Next (`page`, `layout`, `route`, `proxy`, `"use server"`), `src/routes.ts`, `prisma/seed.ts`, el `bin` del CLI ni las configs.
- **Mal optimizado**: solo con un coste concreto (número de queries, tamaño de lista).
- `npx knip` y `npx jscpd src` sirven para encontrar candidatos, no como veredicto.
- Ignora `dist/`, `.next/` y `node_modules/`.

## Informe

Una lista por categoría, ordenada por impacto:

`[ALTO|MEDIO|BAJO] ruta/archivo.ts:línea — qué pasa → qué hacer`

Si una categoría está limpia: "sin hallazgos". Cierra con las 3 acciones que más rinden. En español.
