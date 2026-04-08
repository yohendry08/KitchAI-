# KitchAI Backend

## Run

1. `cd backend`
2. `npm install`
3. `npm run dev`

Server default: `http://localhost:4000`

## Persistence authority and fallback rules

- Canonical persistence is PostgreSQL whenever `DATABASE_URL` is configured.
- JSON fallback (`backend/data/db.json`) is allowed only when `NODE_ENV=development` and `DATABASE_URL` is not set.
- In production-capable mode (`NODE_ENV` different from `development`), backend startup fails fast if `DATABASE_URL` is missing or PostgreSQL is unreachable.

Quick checks:

```bash
# canonical mode visible in health response
curl http://localhost:4000/health

# deterministic persistence governance checks
npm run smoke:persistence
```

Expected smoke outcomes:
- `dev_without_database_url_allows_json_fallback`: pass
- `production_without_database_url_fails_fast`: pass
- `development_with_unreachable_database_url_fails_fast`: pass

## Demo users

- `admin@kitchai.com` / `123456`
- `empleado@kitchai.com` / `123456`
- `cliente@kitchai.com` / `123456`

## Chat assistant configuration

- `OPENAI_API_KEY`: required for the model-backed assistant.
- `OPENAI_CHAT_MODEL`: optional, defaults to `gpt-4o-mini`.
- `OPENAI_CHAT_TEMPERATURE`: optional, defaults to `0.2`.

If the API key is missing or the provider request fails, `/chat/ask` falls back to the deterministic rule-based assistant so the restaurant chat still works.

## Main endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /menu-items`
- `GET /orders`
- `GET /inventory/items`
- `POST /reservations`
- `GET /reports/kpis`
- `POST /chat/ask`

## Smoke scripts

- `npm run smoke:core`: dashboards + auth/register authority coverage.
- `npm run smoke:orders`: live order flow, validation, and authorization coverage.
- `npm run smoke:persistence`: persistence authority/fallback governance checks.
- `npm run smoke:all`: runs all smoke checks in sequence.

