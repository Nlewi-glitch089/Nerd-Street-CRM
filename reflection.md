# Project Reflection

Summary of recent work:

- Public-first routing and onboarding improvements so first-time visitors see informational pages before signing in.
- Implemented Admin Settings with autosave and a password-protected Developer Information tab.
- Added AI Decision Summary: server-side summarizer with external model integration (`OPENAI_API_KEY`) and a `localSummarize` fallback.
- Admin UI improvements: floating, draggable, minimizable AI panel with a Download JSON button and parsing/formatting logic for readable output.
- Fixed build/runtime issues encountered during iteration: replaced `node-fetch` usage with the global `fetch`, fixed missing React hooks imports, and resolved hooks-ordering problems by moving global listeners to top-level effects.

Lessons learned:

- When integrating third-party LLMs, require strict output schema and a retry strategy — implemented in `lib/ai.js`.
- Keep developer-facing debugging information accessible but opt-in to avoid exposing raw model replies in production.
- UI polish (e.g., minimized panel behavior) matters for perceived stability; small CSS tweaks can prevent layout breakage across screen sizes.

Next steps / suggestions:

- Persist AI panel position in `localStorage` so the panel remains where admins place it.
- Add a "Download JSON" history or cache to avoid repeated costly regenerations.
- Surface `rawModelReplies` behind a debug toggle in the Admin UI for troubleshooting when parsing fails.
- Expand AI prompts to request explicit, prioritized, and time-bound actions (e.g., "Within 30 days, do X") to increase usefulness.

