This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3412](http://localhost:3412) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database

Copy `.env.example` to `.env`, then configure Postgres in one of two ways:

1. **`DATABASE_URL`** (recommended for Neon / hosted) — a single connection string; takes precedence when set.
2. **`PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`** — typical for local Postgres.

Remote hosts use SSL automatically. Then:

```bash
pnpm db:migrate   # apply pending migrations
pnpm db:status    # show applied / pending
```

This project can share the same Postgres schema/data patterns as `gocentral-utils` (including song import from that repo). Set `GOCENTRAL_API_BASE_URL` to your GoCentral REST API base (no trailing slash) so the song leaderboard proxy can reach `/leaderboards/song`.

Song leaderboard UI: [http://localhost:3412/leaderboards/song](http://localhost:3412/leaderboards/song)

## Testing

```bash
pnpm test         # run Jest once with coverage
pnpm test:watch   # watch mode (no coverage)
```

Jest uses `next/jest` with jsdom and Testing Library matchers (`jest.setup.ts`). Tests live in co-located `__tests__` directories. Coverage reports go to `coverage/` (text summary in the terminal; open `coverage/lcov-report/index.html` for the HTML report).

## Deploy on Vercel

1. Create a Neon database and copy its connection string.
2. In the Vercel project, set:
   - `DATABASE_URL` — Neon URL (include `sslmode=require`; pooled URL is fine for the app)
   - `GOCENTRAL_API_BASE_URL` — production GoCentral API base
3. Build command (optional migrate-on-deploy):

   ```bash
   pnpm db:migrate && pnpm build
   ```

   Or keep `pnpm build` and run `pnpm db:migrate` separately against Neon when schema changes.
4. Load song catalog with the import script from `gocentral-utils` (not during `next build`).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)
