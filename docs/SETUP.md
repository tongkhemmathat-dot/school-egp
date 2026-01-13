# Setup

## Prerequisites
- Docker + Docker Compose

## Quick start
```bash
docker compose up --build
```

## Seed data
```bash
cd apps/api
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

Default admin: `admin@example.com` / `Admin@1234`.

## Auth/session settings
- `JWT_SECRET` must be the same for the API and web middleware.
- For local Docker, the default `JWT_SECRET` is `dev-secret`.
- The web uses cookie-based auth. Ensure your browser accepts same-site cookies.

## Services
- Web: http://localhost:3000
- API: http://localhost:4000/api
- Converter: http://localhost:5000

## Data storage
Generated documents are stored under `/data/{orgId}/{caseId}/documents`.
