# Curatta

Marketplace de ropa entre usuarios: cada usuario publica prendas (foto, nombre, precio) y puede
buscar prendas parecidas subiendo una foto — el matching lo hace Azure OpenAI Vision comparando
contra las publicaciones disponibles de otros usuarios.

## Estructura

```
backend/    API (Next.js, solo app/api/*) — la única pieza que toca la base de datos
frontend/   Páginas (Next.js) — le pasa /api/* al backend por dentro (ver next.config.mjs)
```

Cada carpeta es su propio proyecto Node con su propio `package.json`, `Dockerfile` y `.env`.

## Correr todo con Docker (recomendado)

Requiere Docker.

```bash
cp .env.example .env   # completar JWT_SECRET y, si se quiere probar el matching real, las 4 variables de Azure OpenAI
docker compose up --build
```

Esto levanta los 3 servicios (`db`, `backend`, `frontend`) y corre las migraciones de Prisma
solas al arrancar — no hace falta ningún paso manual aparte. La app queda en
[http://localhost:3000](http://localhost:3000).

Sin las variables de Azure OpenAI la app funciona igual (publicar, editar, borrar, marcar como
vendida) — solo `/buscar` no va a poder analizar fotos.

## Correr sin Docker (desarrollo)

Necesita un Postgres corriendo aparte.

```bash
# backend
cd backend
cp .env.example .env   # completar DATABASE_URL, JWT_SECRET y (opcional) Azure OpenAI
npm install
npx prisma migrate deploy
npm run dev             # http://localhost:4000

# frontend (en otra terminal)
cd frontend
cp .env.example .env    # el mismo JWT_SECRET que puso el backend
npm install
npm run dev              # http://localhost:3000
```

## Cuenta de prueba rápida

Para no tener que pasar por el formulario de registro:

```bash
cd backend
npm run seed:demo
```

Crea `demo@curatta.test` / `curatta123` (y `demo2@curatta.test` con la misma contraseña, útil
para probar el matching entre dos cuentas distintas).
