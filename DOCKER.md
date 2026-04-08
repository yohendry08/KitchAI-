# Docker setup

## Levantar todo

```bash
# opcional: crear .env a partir del template
cp .env.example .env

docker compose up -d --build
```

## Servicios

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Backend vía frontend (proxy): http://localhost:3000/api/health
- Adminer: http://localhost:8080
- PostgreSQL: localhost:5432

## Credenciales PostgreSQL (Adminer)

- System: `PostgreSQL`
- Server: `postgres`
- Username: `kitchai`
- Password: `kitchai123`
- Database: `kitchai`

Todas estas variables se pueden sobreescribir en `.env` (raíz del proyecto).

## Variables recomendadas para forwarding y auth

```bash
API_BASE_PATH=/api
NEXT_PUBLIC_API_URL=/api
BACKEND_INTERNAL_URL=http://backend:4000
APP_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=production
```

El frontend debe consumir siempre `/api/*` y Next.js reenvia al backend mediante `BACKEND_INTERNAL_URL`.

## Validacion de modo de persistencia (obligatoria)

En ejecuciones con capacidad de produccion (`NODE_ENV=production`), el backend debe fallar al iniciar si PostgreSQL no esta disponible. No se permite fallback silencioso a `backend/data/db.json`.

Verifica estado canonico en health:

```bash
curl http://localhost:4000/health
```

El campo `persistence.mode` debe reportar `postgres` en compose.

Para validar reglas de fallback/control de entorno en local:

```bash
cd backend
npm run smoke:persistence
```

## Checklist de verificacion de forwarding

### Local (sin Docker)

1. Inicia backend en `http://localhost:4000`.
2. Inicia frontend con `NEXT_PUBLIC_API_URL=/api` y `BACKEND_INTERNAL_URL=http://localhost:4000`.
3. Verifica forwarding:

```bash
curl http://localhost:3000/api/health
```

Esperado: respuesta JSON con `ok: true` del backend.

### Docker Compose

1. Levanta stack con build limpio:

```bash
docker compose up -d --build
```

2. Verifica forwarding desde el host:

```bash
curl http://localhost:3000/api/health
```

3. Verifica variable efectiva en frontend:

```bash
docker compose exec frontend printenv NEXT_PUBLIC_API_URL BACKEND_INTERNAL_URL
```

Esperado:
- `NEXT_PUBLIC_API_URL=/api`
- `BACKEND_INTERNAL_URL=http://backend:4000`

Para el flujo de pedidos del frontend, define también `RESTAURANT_TABLES` en `.env`, por ejemplo:

```bash
RESTAURANT_TABLES=Mesa 1,Mesa 2,Mesa 3,Mesa 4,Mesa 5
```

## Aplicar esquema relacional (roles/users/orders...)

```bash
Get-Content -Raw backend/sql/100_business_schema.sql | docker compose exec -T postgres psql -U kitchai -d kitchai
```

## Migrar datos desde `backend/data/db.json`

1) Estado completo usado por la API (tabla `app_state`)

```bash
node backend/scripts/migrate-dbjson-to-postgres.mjs
Get-Content -Raw backend/sql/001_init.sql | docker compose exec -T postgres psql -U kitchai -d kitchai
Get-Content -Raw backend/sql/002_seed_from_dbjson.sql | docker compose exec -T postgres psql -U kitchai -d kitchai
```

2) Tablas relacionales visibles en Adminer

```bash
node backend/scripts/migrate-dbjson-to-business-schema.mjs
Get-Content -Raw backend/sql/110_seed_business_from_dbjson.sql | docker compose exec -T postgres psql -U kitchai -d kitchai
```

## Detener

```bash
docker compose down
```

## Detener y borrar volúmenes

```bash
docker compose down -v
```
