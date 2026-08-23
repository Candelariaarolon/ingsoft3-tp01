# Frontend: páginas + estáticos. output: "standalone" en next.config.mjs
# deja una carpeta autocontenida con solo lo que el server realmente usa —
# no necesita ningún CLI en runtime, así que no hace falta el node_modules
# completo como en el backend.
FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# El destino de rewrites() en next.config.mjs se resuelve una sola vez, acá
# en el build (queda "horneado" en el manifest de rutas de .next/) — no se
# vuelve a leer de env en runtime. Por eso BACKEND_URL entra como build arg,
# no alcanza con pasarlo en `environment:` del docker-compose.
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
