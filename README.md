## Project Overview

The Nerd Street Donor CRM is a lightweight donor management system designed for small nonprofits that struggle with donor retention, fragmented data, and inconsistent follow-up workflows.

Many organizations rely on spreadsheets or disconnected tools, making it difficult to understand donor relationships or maintain long-term engagement. This project prioritizes clarity and usability, helping teams track donors, log donations, and manage follow-ups that support stronger donor relationships without unnecessary complexity.

## Problem Statement

Small nonprofits often lose donors due to disorganized data, limited staffing, and lack of visibility into donor history. Without a centralized system for donations, follow-ups, and donor status, opportunities to build meaningful relationships are missed.

This CRM addresses those challenges by centralizing donor information and emphasizing follow-up awareness over feature bloat.

## Core Screens (MVP)

These screens are required and form the foundation of the application.

## 1. Donor List / Search

Purpose:

Provide staff with a clear overview of all donors and their current status.

Responsibilities:

Display a list of donors

Support search and basic filtering

Show quick reference data:

Last donation date

Total lifetime giving

Donor status (active / lapsed)

Notes for Implementation:

Data is sourced from Neon (PostgreSQL)

This is the primary “daily use” screen

Performance and clarity matter more than visual complexity


## 2. Donor Profile

Purpose:
Serve as the central record for an individual donor relationship.

Responsibilities:

Display donor information and notes

Show full donation history (timeline format)

Display follow-up or thank-you status

Provide actions:

Log a donation

Add a follow-up task or note

Notes for Implementation:

All donor-related actions should originate or be accessible here

Avoid splitting donor context across multiple pages unnecessarily

## 3. Add / Edit Donor Form

Purpose:

Allow quick, low-friction donor data entry.

Responsibilities:

Create new donor records

Edit existing donor records

Use only essential fields:

Name

Email

Phone

Notes

## Communication preferences

Notes for Implementation:

Keep forms simple and non-overwhelming

Validation should prioritize usability over strictness

## 4. Log a Donation

Purpose:
Ensure donations are recorded accurately and consistently.

Responsibilities:

Record donation details:

Amount

Date

Method

Campaign (optional)

Recurring (yes/no)

Link donation to a donor

Update donor totals and last-gift date

Important Behavior:

Logging a donation should trigger a “thank-you needed” or follow-up status, even if automated messaging is not implemented yet.

## 5. Tasks / Follow-Ups View

Purpose:
Prevent donors from being forgotten after their initial gift.

Responsibilities:

Display a list of open follow-up tasks

Sort by urgency or due date

Link tasks to specific donors

Allow tasks to be marked complete

Notes for Implementation:

This feature directly supports donor retention

Keep task logic straightforward and transparent

Bonus / Phase 2 Screens (Stretch Features)

These features are optional enhancements and should not block MVP completion.

## 6. Dashboard

Purpose:
Provide high-level insight into fundraising health.

Metrics May Include:

Total raised this month

Number of new donors

Number of lapsed donors

Campaign progress

Notes:

Read-only analytics

No data entry on this screen

## 7. Campaign Page

Purpose:
Track fundraising campaigns without adding unnecessary complexity.

Responsibilities:

Display campaign goals

Show progress toward goals

Associate donations with campaigns

User Roles & Permissions

The application supports role-based access, not separate apps.

## Team Member Role

Team members can:

View donors and donor profiles

Log donations

Add notes and follow-up tasks

View assigned follow-ups

Team members cannot:

Delete donors

Manage users or roles

Access system-wide settings or admin panels

## Admin Role

Admins can:

Perform all team member actions

Create, edit, and delete donors

Create and manage campaigns

View all analytics and dashboards

Manage user accounts and permissions

Guiding Principle for Copilot

Every feature, screen, and database interaction should support:

- Donor retention

- Relationship tracking

- Clear follow-up workflows

Avoid adding features that do not clearly support these goals.

## Project 2.0 - Changes for Nerd Street CRM v2

This workspace was refactored so first-time visitors see clear informational pages before signing in. Authenticated users use the full CRM dashboard and admin pages.

### Features
- Public landing pages: Home, The Problem, Why This CRM, AI Policy, Evidence, Reflection
- Authentication: sign up and sign in (public), role-based access (admin vs team member)
- Dashboard: summary stats pulled via API from app data
- Donors & Donations: list, add, edit, link donations to donors, confirmations
- AI insights: server-side AI route that analyzes aggregated data and returns suggestions

### Tech Stack
- Next.js (pages directory)
- Server-side API routes (Next.js)
- Prisma (schema in `prisma/schema.prisma`)

### How to run locally
1. Install dependencies:
```bash
npm install
```
2. Start dev server:
```bash
npm run dev
```
3. Open http://localhost:3000

### Notes
- Public pages are available without authentication. To access the CRM, click "Access Dashboard" and sign in.
- The AI API (`/api/ai`) is a scaffolded endpoint returning mock insights. Replace with real model calls and proper sanitization in production.
 
### AI Decision Summary (Admin)

- The admin dashboard includes an "AI Decision Summary" feature that aggregates recent donors, donations, campaigns, and users and produces a decision-support summary.
- The AI panel is a floating, draggable, minimizable dialog that displays the model's `summary`, `trends`, `insights`, `concerns`, and `actions` when available.
- You can export the AI result as JSON using the "Download JSON" button in the panel header. The download filename is `decision-summary-YYYYMMDD-HHMMSS.json`.
- If your deployment sets the `OPENAI_API_KEY` environment variable, the server will call the external model for richer suggestions. When the key is not present, a local summarizer fallback is used.

### Troubleshooting AI output

- The server attempts to parse strict JSON from the model. If the model reply is not valid JSON, the API retries once and then falls back to a deterministic local summarizer. When parsing fails the API will return `rawModelReplies` in the response for debugging.
- If you see "No suggested actions found", verify `OPENAI_API_KEY` is set in your environment and check server logs or the API response to inspect `rawModelReplies`.

### Deployment

- This project can be deployed to Vercel. If your Git repo is connected to Vercel, pushing to the main branch will trigger an automatic deploy.
- To deploy manually from this machine using the Vercel CLI:

```bash
# install the Vercel CLI if you don't have it
npx vercel login
npx vercel --prod --confirm
```

- Remember to set production environment variables in the Vercel dashboard (not in source control):
	- `DATABASE_URL` — your PostgreSQL connection string
	- `OPENAI_API_KEY` — your OpenAI API key (optional; set to enable external AI)

If you want, I can push this README update and trigger a Vercel redeploy for you now.