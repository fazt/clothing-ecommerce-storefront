#!/bin/sh
# Aplica las migraciones pendientes y arranca la API.
set -e

./node_modules/.bin/prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "SEED_ON_START=true: cargando datos de demo"
  ./node_modules/.bin/tsx prisma/seed.ts
fi

exec node dist/index.js
