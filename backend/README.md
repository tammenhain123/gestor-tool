Backend (NestJS) for GestorTool

Quick start:

1. Install dependencies

```bash
cd backend
npm install
```


2. Start app

```bash
npm run start:dev
```

Environment variables: see `.env.example`.

Testing /me via Postman:

- GET http://localhost:4000/me
- Authorization: Bearer <access_token_from_keycloak>

If the user does not exist in DB, it will be created on first request.
