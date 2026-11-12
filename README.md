# Nerd Street Donor CRM

## Deployment link

GitHub currently lists this as the repository's homepage:

[Open the configured project URL](https://nerd-street-crm.vercel.app)

Confirm the current production deployment in Vercel before sharing this link as a working live demo.


A donor-management application for nonprofit teams. It brings donor records, donations, campaigns, follow-up tasks, and team access into one place.

## What it includes

- **Donors:** create and manage donor records, review giving history, and track donor status.
- **Donations:** record gifts and associate them with donors and campaigns.
- **Follow-ups:** manage tasks connected to donor relationships.
- **Campaigns and events:** maintain fundraising campaigns and event information.
- **Team access:** distinguish administrator and team-member roles.
- **Analytics:** review donor, donation, revenue, and campaign information.
- **AI-style insights demo:** the current `/api/ai` endpoint returns sample, rule-based insights. It is a mock endpoint, not a live AI integration.

## Technology

- Next.js 16 (Pages Router) and React 19
- JavaScript
- PostgreSQL
- Prisma ORM
- Vitest

## Requirements

- Node.js 22 or newer
- npm
- PostgreSQL database

## Run locally

The project uses Prisma with `DATABASE_URL`. The package currently has automatic Prisma preinstall/postinstall scripts, so the steps below use `--ignore-scripts` to make database setup explicit and predictable.

1. Create a PostgreSQL database and set its connection string.

   **macOS / Linux / Git Bash**
   ```bash
   export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   ```

   **Windows PowerShell**
   ```powershell
   $env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   ```

2. Install dependencies without automatically running Prisma commands:

   ```bash
   npm install --ignore-scripts
   ```

3. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. For a new database, create the tables from the checked-in Prisma schema:

   ```bash
   npm run db:push
   ```

   Only use `db:push` when setting up a new database or after reviewing schema changes. Do not use it casually against a production database.

5. (Optional) Add the project's seed data to a development database:

   ```bash
   npm run db:seed
   ```

6. Set a unique `JWT_SECRET` in your environment, then start the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

The login code currently has a built-in `dev-secret` fallback for `JWT_SECRET`; set a strong unique value for local and production environments rather than relying on that fallback. Never commit credentials.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm test` | Run the Vitest suite |
| `npm run db:push` | Push the Prisma schema to the configured database |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run db:seed` | Run the database seed script |

## Deploying to Vercel

The app uses Next.js and can be deployed to Vercel.

1. Make sure the PostgreSQL database is provisioned and its schema is ready.
2. Import this GitHub repository in [Vercel](https://vercel.com/new).
3. Keep the detected Next.js framework settings and the default build command, `npm run build`.
4. Add these environment variables in the Vercel project's Settings → Environment Variables:
   - `DATABASE_URL` — production PostgreSQL connection string.
   - `JWT_SECRET` — a strong, unique secret used to sign login tokens.
5. Deploy and check the build and runtime logs before sharing the application URL.

The repository does not currently document a verified public production URL. Add the stable Vercel production domain here after confirming it in the Vercel project dashboard.

## Project layout

- `pages/` — application pages and API routes
- `lib/` — shared server and database utilities
- `prisma/` — database schema and seed script
- `styles/` — application styles
- `assets/` — static assets
- `test/` — automated tests

## Current scope

The repository contains an evolving application. Check the implementation before relying on a feature in a production workflow. In particular, the AI insights endpoint is currently a mock, and database setup depends on a PostgreSQL connection supplied through `DATABASE_URL`.
