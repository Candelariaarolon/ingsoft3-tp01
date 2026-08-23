# Backend: solo las rutas /api/*. Sin output: "standalone" a propósito —
# necesitamos el CLI de prisma disponible en runtime para correr
# `prisma migrate deploy` al arrancar el contenedor, y ese modo achica
# node_modules a solo lo que el servidor importa en código (no el CLI).
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
