# syntax=docker/dockerfile:1.7
# API de Atelier. Se construye desde la raíz del monorepo:
#   docker build -f api/Dockerfile -t atelier-api .

FROM node:22-slim AS base
# openssl: lo necesita el motor de migraciones de Prisma.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* && corepack enable
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
WORKDIR /app

# ---- build: dependencias completas, cliente Prisma y compilación ----
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json api/prisma.config.ts api/
COPY api/prisma api/prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter ecommerce-api...
COPY api api
RUN pnpm --filter ecommerce-api db:generate && pnpm --filter ecommerce-api build

# ---- deps: solo producción (incluye el CLI de prisma para `migrate deploy`) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json api/prisma.config.ts api/
COPY api/prisma api/prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter ecommerce-api...

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production PORT=4057
COPY --from=deps --chown=node:node /app /app
COPY --from=build --chown=node:node /app/api/dist /app/api/dist
COPY --chown=node:node api/docker-entrypoint.sh /app/api/docker-entrypoint.sh
RUN chmod +x /app/api/docker-entrypoint.sh && mkdir -p /app/api/uploads && chown node:node /app/api/uploads
USER node
WORKDIR /app/api
EXPOSE 4057
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4057)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
