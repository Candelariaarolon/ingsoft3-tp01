# ---- Etapa 1: build (Node completo) ----
FROM node:20-slim AS build
WORKDIR /src

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# El destino de rewrites() en next.config.mjs se resuelve una sola vez, acá
# en el build (queda "horneado" en el manifest de rutas de .next/) — no se
# vuelve a leer de env en runtime. Por eso BACKEND_URL entra como build arg,
# no alcanza con pasarlo en `environment:` del docker-compose.
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

# ---- Etapa 2: runtime (imagen mínima) ----
# output: "standalone" en next.config.mjs deja una carpeta autocontenida
# con solo lo que el server usa — no necesita node_modules completo, ni
# ningún CLI, a diferencia del backend.
FROM node:20-slim AS final
WORKDIR /app

COPY --from=build /src/public ./public
COPY --from=build /src/.next/standalone ./
COPY --from=build /src/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
