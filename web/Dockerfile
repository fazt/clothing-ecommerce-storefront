# syntax=docker/dockerfile:1.7
# Storefront + panel (Next.js standalone). Se construye desde la raíz del monorepo:
#   docker build -f web/Dockerfile -t atelier-web .

FROM node:22-slim AS build
RUN corepack enable
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
RUN pnpm install --frozen-lockfile --filter ecommerce-web...
COPY web web
# NEXT_PUBLIC_* se incrustan en el bundle al compilar.
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:8126/api
ARG NEXT_PUBLIC_SITE_URL=http://127.0.0.1:8126
ARG IMAGE_HOSTS=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL IMAGE_HOSTS=$IMAGE_HOSTS
# Heap acotado: compila en máquinas chicas sin agotar la memoria.
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN pnpm --filter ecommerce-web build

FROM node:22-slim AS runtime
ENV NODE_ENV=production PORT=5226 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/web/.next/standalone ./
COPY --from=build --chown=node:node /app/web/.next/static ./web/.next/static
COPY --from=build --chown=node:node /app/web/public ./web/public
USER node
EXPOSE 5226
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:5226/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "web/server.js"]
