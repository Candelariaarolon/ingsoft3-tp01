# ---- Etapa 1: build (Node completo) ----
FROM node:20-slim AS build
WORKDIR /src

# npm ci (y no install) respeta el package-lock.json al pie de la letra, e
# instala también las devDependencies: ahí viene vitest para la etapa de tests.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa 2: tests (parte del build: ya tiene Node, el código y vitest) ----
# Va EN EL MEDIO: si quedara última, la imagen de producción sería la de
# tests. Sin WORKDIR propio: hereda /src de la etapa build. Si la cobertura
# queda por debajo del umbral, vitest sale con error y el job se pone rojo.
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ---- Etapa 3: runtime (imagen mínima) ----
# output: "standalone" en next.config.mjs deja una carpeta autocontenida
# con solo lo que el server usa — no necesita node_modules completo, ni
# ningún CLI, a diferencia del backend.
FROM node:20-slim AS final
WORKDIR /app

COPY --from=build /src/public ./public
COPY --from=build /src/.next/standalone ./
COPY --from=build /src/.next/static ./.next/static

# BACKEND_URL ya no entra al build: el proxy de app/api la lee al recibir
# cada pedido. Este valor es el de compose; Render lo pisa con la URL de la
# api de su entorno, y así la misma imagen sirve en QA y en PROD.
# HOSTNAME=0.0.0.0 porque server.js escucha en HOSTNAME, y Docker y Render
# ponen ahí el nombre del contenedor: sin esto no atiende desde afuera.
EXPOSE 3000
ENV PORT=3000 \
    HOSTNAME=0.0.0.0 \
    BACKEND_URL=http://backend:4000
CMD ["node", "server.js"]
