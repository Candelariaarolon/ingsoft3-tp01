# ---- Etapa 1: build (Node completo) ----
FROM node:20-slim AS build
WORKDIR /src
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Node no tiene ".sln" — un solo package.json define el proyecto entero.
# Se copia antes del install: capa cacheable, solo se rehace si cambia
# package.json (equivalente Node de "copiar los .csproj antes del restore").
# npm ci (y no install) respeta el package-lock.json al pie de la letra, e
# instala también las devDependencies: ahí viene vitest para la etapa de tests.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa 2: tests (parte del build: ya tiene Node, el código y vitest) ----
# Sin WORKDIR propio: hereda /src de la etapa build. Los tests no corren al
# construir sino en el `docker run` del pipeline, que monta una carpeta para
# que el reporte de cobertura sobreviva al contenedor.
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ---- Etapa 3: runtime (imagen mínima) ----
FROM node:20-slim AS final
WORKDIR /app
# El motor de queries de Prisma necesita openssl en RUNTIME, no solo al
# generar el client en la etapa de build — por eso se instala acá también.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/.next ./.next
COPY --from=build /src/prisma ./prisma
COPY --from=build /src/package.json ./package.json
COPY --from=build /src/next.config.mjs ./next.config.mjs

# Equivalente Node de ENV ASPNETCORE_URLS en .NET: `next start` lee PORT del
# entorno, así el puerto queda declarado acá y no escondido en package.json.
EXPOSE 4000
ENV PORT=4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
