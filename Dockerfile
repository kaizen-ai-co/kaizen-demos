# syntax=docker/dockerfile:1.7
# Imagen portable de UNA plantilla (Next.js standalone). Corre igual en Vercel (si se usa
# contenedor), Cloudflare, AWS o un servidor propio. Toda la configuración por variables.
#
#   docker build --build-arg APP=comercial -t kaizen/comercial .
#   docker run -p 3000:3000 --env-file .env.produccion kaizen/comercial

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS dependencias
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY semillas ./semillas
COPY apps ./apps
RUN npm ci --no-audit --no-fund

FROM dependencias AS construccion
ARG APP=comercial
ENV NEXT_TELEMETRY_DISABLED=1
COPY next.config.base.ts tsconfig.base.json ./
RUN npm run build -w @kaizen/app-${APP}

FROM node:${NODE_VERSION} AS ejecucion
ARG APP=comercial
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S kaizen && adduser -S kaizen -G kaizen
# standalone conserva la estructura del monorepo: apps/<app>/server.js
COPY --from=construccion --chown=kaizen:kaizen /repo/apps/${APP}/.next/standalone ./
COPY --from=construccion --chown=kaizen:kaizen /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=construccion --chown=kaizen:kaizen /repo/apps/${APP}/public ./apps/${APP}/public
ENV APP_DIR=apps/${APP}
USER kaizen
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/salud || exit 1
CMD ["sh", "-c", "node $APP_DIR/server.js"]
