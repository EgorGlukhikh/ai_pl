# AI PL - Story Generator MVP

Functional-first monorepo for real estate story generation.

## Stack
- `apps/web`: Next.js 15, React 19
- `apps/api`: NestJS 11, BullMQ
- `packages/shared`: shared types and Zod schemas
- PostgreSQL + Redis + MinIO via Docker Compose
- Prisma ORM

## Implemented
- Monorepo bootstrap (`apps/web`, `apps/api`, `packages/shared`)
- Docker Compose for `postgres`, `redis`, `minio`
- Prisma schema + initial migration + seed
- JWT auth skeleton + mock login endpoint
- Admin CRUD for complexes / room types / assets / user subscription override
- Generation flow:
  - `POST /generations`
  - daily limit (`FREE=5/day`, `PRO=unlimited`)
  - BullMQ queue + processor
  - 6 variants (`T1..T6`)
  - PNG render (1080x1920) and storage in local `uploads/`
- Story endpoints:
  - line editing with strict `linesJson` validation
  - rerender
  - download URL
  - Telegram send endpoint
- Billing endpoints:
  - `POST /billing/create-payment`
  - `POST /billing/yookassa-webhook`
- Web UI:
  - login (mock)
  - select complex + room type
  - enter offer
  - generate stories
  - loading/empty/result states
  - line editor
  - download
  - telegram send
  - recent history (20)
  - upgrade action
- CI workflow for `lint/test/build`

## Quick Start
1. Copy env:
```bash
cp .env.example .env
```

2. Start infrastructure:
```bash
docker compose up -d
```

3. Install deps:
```bash
npm install
```

4. Generate Prisma client and apply migration:
```bash
npm run db:generate
npx prisma migrate deploy
```

5. Seed demo data:
```bash
npm run db:seed
```

6. Run API + Web:
```bash
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Key API routes
- Auth: `POST /auth/mock-login`, `POST /auth/sber/callback`, `POST /auth/telegram/callback`, `GET /auth/me`
- Directory: `GET /complexes`, `GET /complexes/:id/room-types`
- Limits: `GET /limits/today`
- Generation: `POST /generations`, `GET /generations/:id`, `GET /stories`
- Story actions: `PATCH /stories/:id/lines`, `POST /stories/:id/render`, `GET /stories/:id/download`, `POST /stories/:id/send-telegram`
- Billing: `POST /billing/create-payment`, `POST /billing/yookassa-webhook`
- Telegram health: `GET /telegram/me`
- Admin: `/admin/*`

## Notes
- GigaChat/Telegram/YooKassa are wired as integration-ready stubs for MVP bootstrap.
- Replace mock logic in integration services with production credentials and provider payload validation.

## Free Deploy from Git (Render)
Repository already contains `render.yaml` for Blueprint deploy of:
- `ai-pl-api` (Nest API)
- `ai-pl-web` (Next.js web)
- `ai-pl-db` (Postgres)
- `ai-pl-redis` (Key Value / Redis)

### Steps
1. Push current branch to GitHub.
2. In Render dashboard: **New +** -> **Blueprint**.
3. Connect repo `EgorGlukhikh/ai_pl` and deploy.
4. After first deploy, open service env vars and fill secrets:
- `GIGACHAT_AUTH_KEY` (or `GIGACHAT_CLIENT_ID` + `GIGACHAT_CLIENT_SECRET`)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
5. Trigger **Manual Deploy** for `ai-pl-api` and `ai-pl-web`.

### Important free-tier limits
- Free web services can spin down on inactivity.
- Free Postgres is limited to 1 GB and expires after 30 days.
