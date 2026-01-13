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

Default admin: `admin@school.local` / `admin123`.

## Services
- Web: http://localhost:3000
- API: http://localhost:4000/api
- Converter: http://localhost:5000

## Data storage
Generated documents are stored under `/data/{orgId}/{caseId}/documents`.
