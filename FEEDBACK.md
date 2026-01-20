Summary for comment (<=300 words)

Overall this is a great app — clear design and useful features. A few items I encountered while testing:

- Update/Delete UX: I couldn't find UI flows to update or delete campaigns, users, or events. Adding inline edit + delete controls on list/details pages (with confirmation) would improve admin efficiency.
- AI feature discoverability: The AI functionality is useful but not discoverable — document where it lives and add a short help tooltip linking to an AI policy.
- User management: Add a "Deactivate user" action so departing staff can be disabled (set `active=false` and record `deactivatedAt`/`deactivatedBy`). Also show active/inactive filters in the user list.
- AI policy & safeguards: I couldn't find AI policy or safeguards. Add a visible AI Policy page that explains data handling, opt-in/consent, and how outputs should be used (advisory only). Consider rate-limiting and a debug/logging view for AI calls.

Suggested quick fixes:
- Add CRUD controls for campaigns/users/events and an admin audit log for destructive actions.
- Add a user deactivation button with confirmation and role checks.
- Add an "AI" top-level nav item that links to the Policy + a short how-to and the AI console.

Thanks — great work. These changes will improve admin workflows, safety, and adoption.
