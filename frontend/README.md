# Frontend Runtime Notes

## API base path contract

Use a stable browser-facing API base path:

- `NEXT_PUBLIC_API_URL=/api`
- `BACKEND_INTERNAL_URL=http://localhost:4000` (local)
- `BACKEND_INTERNAL_URL=http://backend:4000` (docker compose)

The frontend must call only `/api/*`. Runtime forwarding is defined in `next.config.mjs` and proxies to `BACKEND_INTERNAL_URL`.

Chat screens use `/api/chat/ask` with a role flag (`client`, `employee`, or `admin`) and the request is forwarded to the backend restaurant copilot.

## Local verification

```bash
# from repository root
npm --prefix backend run dev
npm --prefix frontend run dev
curl http://localhost:3000/api/health
```

Expected result: JSON from backend health endpoint.

## Docker verification

```bash
docker compose up -d --build
curl http://localhost:3000/api/health
docker compose exec frontend printenv NEXT_PUBLIC_API_URL BACKEND_INTERNAL_URL
```

Expected environment values:

- `NEXT_PUBLIC_API_URL=/api`
- `BACKEND_INTERNAL_URL=http://backend:4000`
