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

Donor retention

Relationship tracking

Clear follow-up workflows

Avoid adding features that do not clearly support these goals.