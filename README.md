# GoCentralScores

This is a frontend client which displays data from
[GoCentral](https://github.com/ihatecompvir/GoCentral), a master server reimplementation for Rock Band 3. It aims to
use GoCentral's API to display leaderboards and statistics of song information using a modern Next.js client.

Inspired by former, similar websites such as RockBandStats.com, RockBandScores.com, or rb4scores.com.

## Getting Started

First, clone this repo.

Then, set up a PostgreSQL database. You can set one up locally or use a remotely-hosted one (see Database section
below).

Then, copy `.env.example` to `.env` and configure the environment variables accordingly.

Then, install the packages.

```bash
pnpm install
```

Then, you can run the app. This repository defaults to PORT 3412.

```bash
pnpm dev
```

Open [http://localhost:3412](http://localhost:3412) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database

GoCentral does not actually store information for songs, only numeric song IDs. As a result, we are on our own. To solve
for this, GoCentralScores uses a PostgreSQL database containing a `songs` table which contains basic song information.

In order to load songs into the database, there exists some scripts in
[GoCentralUtils](https://github.com/elcanadiano/go-central-utils) which allow you to load songs into your PostgreSQL
database.

This repository supports connecting to PostgreSQL using two ways:

1. `DATABASE_URL` (recommended for Neon / hosted) — a single connection string; takes precedence when set.
2. `PGHOST` **/** `PGPORT` **/** `PGUSER` **/** `PGPASSWORD` **/** `PGDATABASE` — typical for local Postgres.

You can run the migration and status using the following commands.

```bash
pnpm db:migrate   # apply pending migrations
pnpm db:status    # show applied / pending
```

Both this project and GoCentralUtils contain migration data. This is so that we can ensure a GoCentralScores deployment
correctly updates the database. As a result, both GoCentralScores and GoCentralUtils must ensure that the migration
files are in lockstep.

## Testing

This repository uses [Jest](https://github.com/jestjs/jest) for testing purposes.

```bash
pnpm test         # run Jest once with coverage
pnpm test:watch   # watch mode (no coverage)
```

## Acknowledgements

This project itself is not affiliated with GoCentral but I would like to acknowledge @ihatecompvir, @jnackmclain, and
bookreader52 for their help with this project or information about songs as a whole.
