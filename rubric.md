# Project Rubric

This rubric documents how the Nerd Street CRM project meets evaluation criteria used during development and review.

- Functionality: Core donor management features are implemented (donor list, donor profile, log donations, campaign tracking).
- Reliability: Server-side routes include basic error handling and fallbacks; seeding utilities are available for development.
- Usability: Simple, focused UI components and in-place confirmations; role-based access (admin vs team member).
- Maintainability: Code organized by pages, API routes, and `lib/` helpers; Prisma schema under `prisma/`.
- Security & Privacy: JWT-based auth; secrets kept out of source via environment variables; reminders in `README.md` to set `OPENAI_API_KEY` and `DATABASE_URL` in deployment.
- Extensibility: AI scaffold (`lib/ai.js`) included with local fallback and retry parsing; admin UI integrates a decision-support panel.

Notes:
- The AI feature is admin-only and attempts strict JSON parsing. When external AI output cannot be parsed the system falls back to a deterministic local summarizer and returns `rawModelReplies` in the API response for debugging.
- Key files to inspect during review: `lib/ai.js`, `pages/api/admin/decision-summary.js`, `pages/admin.js`, `prisma/schema.prisma`.
