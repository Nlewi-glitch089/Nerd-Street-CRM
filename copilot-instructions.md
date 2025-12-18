## Core Application Structure

The application is organized around a small set of workflows that reflect how nonprofit teams actually manage donors.

```markdown
/app (or /pages depending on setup)
  /dashboard
    page.js
  /donors
    page.js
    /[id]
      page.js
  /campaigns
    page.js
  /tasks
    page.js
  layout.js
  page.js

```

```markdown
/components
  DonorList.js
  DonorProfile.js
  DonorForm.js
  DonationForm.js
  TaskList.js
  CampaignProgress.js
  DashboardStats.js

```

```markdown
/lib
  db.js
  donors.js
  donations.js
  tasks.js
  campaigns.js
  users.js

```

```markdown
/tests
  donors.test.js
  donations.test.js
  tasks.test.js
  campaigns.test.js
  users.test.js

```

```markdown
/styles
  globals.css
  dashboard.module.css
  donors.module.css

```

## Donor List & Search

The donor list serves as the primary day-to-day working screen for staff.

It provides an overview of all donors, supports search and basic filtering, and displays quick reference information such as last donation date, total lifetime giving, and donor status (active or lapsed).

## Donor Profile

The donor profile is the central record for each donor relationship.

It includes contact information, notes, a complete donation history, and follow-up or thank-you status. From this view, users can log donations and create follow-up tasks, keeping all donor-related actions centralized and contextual.

## Add / Edit Donor

Donor creation and editing is intentionally simple to encourage accurate data entry.

Only essential fields are required, including name, email, phone, notes, and communication preferences. Forms should remain lightweight and non-overwhelming.

## Log a Donation

Donations are logged with amount, date, method, optional campaign, and recurring status.

Logging a donation updates donor totals, last-gift information, and flags the donor for a follow-up or thank-you workflow.

## Tasks & Follow-Ups

Tasks help ensure donors do not fall through the cracks.

Users can view open follow-ups, sort by urgency or due date, link tasks to specific donors, and mark tasks as complete. This feature directly supports donor retention.

## Bonus / Stretch Features

The following features enhance the system but are not required for core functionality.

### Dashboard

A read-only analytics view providing high-level insight, such as total raised this month, new donors, lapsed donors, and campaign progress.

### Campaigns

Campaigns allow organizations to group donations under fundraising initiatives. Each campaign includes a goal, progress tracking, and associated donations, adding structure without unnecessary complexity.

## User Roles & Permissions

The system supports role-based access aligned with real nonprofit workflows.

### Team Member

Team members can view donors, log donations, add notes and follow-up tasks, and view assigned follow-ups. They cannot delete donors, manage users, or access administrative settings.

### Admin

Admins can perform all team member actions, manage donors and campaigns, view dashboards, and control users and permissions.

## Tech Stack

```markdown
Framework: Next.js
Language: JavaScript (no TypeScript)
Styling: CSS Modules and/or Global CSS
Database: Neon (PostgreSQL)

```

### Database

Neon is used as the relational database for donors, donations, tasks, campaigns, and users. It provides reliable PostgreSQL storage while remaining accessible for small teams and educational projects.

## Getting Started

Install dependencies:

```bash
npm install

```

Configure environment variables for Neon.

Start the development server:

```bash
npm run dev

```

## Future Improvements

Planned enhancements may include authentication, automated thank-you workflows, donor segmentation, campaign-level permissions, and integrations with external fundraising tools.