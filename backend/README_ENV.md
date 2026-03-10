Local dev / prod env setup

1) Files created:
- `.env.dev` — values for local development
- `.env.prod` — template for production
- `docker-compose.dev.yml` — Postgres for local dev

2) Run Postgres locally (backend folder):

```bash
docker-compose -f docker-compose.dev.yml up -d
```

3) Install and run locally:

```bash
npm install
npm run start:local   # runs with NODE_ENV=dev and loads .env.dev
```

4) Build for production (local):

```bash
npm run build
npm run start:prod-local
```

5) Notes:
- The app loads `.env.dev` by default unless `NODE_ENV=production` is set.
- You can set `MASTER_PASSWORD` in `.env.dev`/`.env.prod` and it will be used by the startup seed.
- For local dev Keycloak is disabled by default (`USE_KEYCLOAK=false`).
