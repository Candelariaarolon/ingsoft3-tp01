# ---- Etapa 1: build (Node completo) ----
FROM node:20-slim AS build
WORKDIR /src
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Node no tiene ".sln" — un solo package.json define el proyecto entero.
# Se copia antes del install: capa cacheable, solo se rehace si cambia
# package.json (equivalente Node de "copiar los .csproj antes del restore").
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run build

# ---- Etapa 2: runtime (imagen mínima) ----
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

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
