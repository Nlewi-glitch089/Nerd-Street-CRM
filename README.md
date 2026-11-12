# Nerd Street Donor CRM

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

- Node.js and npm
- A PostgreSQL database
- A valid `DATABASE_URL` connection string

## Run locally

The Prisma setup runs during package installation. Make sure `DATABASE_URL` is available in your environment before installing dependencies.

**macOS / Linux / Git Bash**

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
npm install
npm run dev
```

**Windows PowerShell**

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Do not commit database credentials or other secrets. Use your local environment for private configuration.

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

## Project layout

- `pages/` — application pages and API routes
- `lib/` — shared server and database utilities
- `prisma/` — database schema and seed script
- `styles/` — application styles
- `assets/` — static assets
- `test/` — automated tests

## Current scope

The repository contains an evolving application. Check the implementation before relying on a feature in a production workflow. In particular, the AI insights endpoint is currently a mock, and database setup depends on a PostgreSQL connection supplied through `DATABASE_URL`.
