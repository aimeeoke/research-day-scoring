# Research Day Conference Platform - Architecture Plan

> **Goal:** A complete, reusable conference management system that eliminates MS Forms, manual data cleanup, and code-based data changes.

---

## Table of Contents

1. [Overview](#overview)
2. [Lessons from V1](#lessons-from-v1)
3. [Core Principles](#core-principles)
4. [Annual Conference Cycle](#annual-conference-cycle)
5. [Site Structure](#site-structure)
6. [Database Schema](#database-schema)
7. [Authentication & Roles](#authentication--roles)
8. [Submission System](#submission-system)
9. [Judge Registration](#judge-registration)
10. [Withdrawal Handling](#withdrawal-handling)
11. [Scoring System](#scoring-system)
12. [Admin Dashboard](#admin-dashboard)
13. [Engagement Features](#engagement-features)
14. [Year-Over-Year Reuse](#year-over-year-reuse)
15. [File Storage](#file-storage)
16. [API Routes](#api-routes)
17. [Development Phases](#development-phases)
18. [Cost Estimates](#cost-estimates)

---

## Overview

### Current State (V1)
- Scoring app: `research-day-scoring.vercel.app`
- Conference site: `researchday.vercel.app`
- Data collection: MS Forms
- Data storage: Hardcoded TypeScript + Supabase (added last-minute)
- Changes require: Code edits → Git push → Deploy

### Future State (V2)
- Unified platform: `researchday.vercel.app`
- Data collection: Built-in submission & registration forms
- Data storage: Supabase (database + auth + storage)
- Changes require: Admin UI clicks

### Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (magic links)
- **Storage:** Supabase Storage (photos, files)
- **Repo:** GitHub

---

## Lessons from V1

### What Went Wrong

| Issue | What Happened | Impact |
|-------|---------------|--------|
| **localStorage-only storage** | Scores saved to judge's browser only | Emergency day-of scramble to add Supabase |
| **Hardcoded data** | Presenters/judges in TypeScript file | Every change needed code deploy |
| **No authentication** | Judges picked name from dropdown | Anyone could score as anyone |
| **No soft delete** | Removing presenter = delete from code | Lost historical record |
| **No admin tools** | Clearing scores required SQL | Dependent on developer |
| **MS Forms pipeline** | Forms → Excel → cleanup → code | Hours of manual work |

### What V2 Fixes

| Issue | V2 Solution |
|-------|-------------|
| Storage | Cloud-first from day one |
| Data management | All data in database, managed via UI |
| Authentication | Magic link login, verified identity |
| Soft delete | Status flags, full history preserved |
| Admin tools | Complete admin dashboard |
| Data collection | Built-in forms, no external tools |

---

## Core Principles

1. **Database is the source of truth** - No data in code files
2. **Authentication from day one** - Know who everyone is
3. **Admin UI for everything** - No code changes for data updates
4. **Soft delete, not hard delete** - Preserve history, enable recovery
5. **Year-over-year reusability** - Copy config, start fresh with data
6. **Self-service where possible** - Reduce admin email burden

---

## Annual Conference Cycle

```
PHASE 1: Setup (Admin, ~December)
├── Create new event year
├── Set dates (submission deadline, event date)
├── Configure categories, session times
├── Copy settings from previous year
└── Open registration

PHASE 2: Submissions (Presenters, Dec-Feb)
├── Presenter creates account (magic link)
├── Fills out submission form
├── Can save draft, edit until deadline
├── Submits for review
└── Receives confirmation

PHASE 3: Review (Admin, Feb-Mar)
├── Review submissions
├── Request changes if needed
├── Accept/reject submissions
├── Assign presentation IDs, times, locations
└── Notify accepted presenters

PHASE 4: Judge Recruitment (Feb-Mar)
├── Judges create account / sign up
├── Indicate availability, expertise
├── Declare conflicts of interest
├── Admin assigns judges to presenters
└── Judges notified of assignments

PHASE 5: Event Day
├── Judges score presentations
├── Admin monitors progress in real-time
├── Handle no-shows, withdrawals
├── Calculate winners
└── Announce results

PHASE 6: Archive (Post-event)
├── Export results, certificates
├── Archive event data
├── Event becomes read-only
└── Data available for reporting
```

---

## Site Structure

```
researchday.vercel.app/
│
├── PUBLIC PAGES (no auth required)
│   ├── /                        → Home/landing page
│   ├── /schedule                → Event schedule
│   ├── /abstracts               → Searchable abstracts (accepted only)
│   ├── /sponsors                → Sponsor listings
│   ├── /about                   → About the event
│   ├── /submit                  → Abstract submission (redirects to auth)
│   └── /judge-signup            → Judge registration (redirects to auth)
│
├── AUTHENTICATED PAGES (any logged-in user)
│   ├── /dashboard               → Role-based home (see your stuff)
│   ├── /profile                 → Edit your profile
│   └── /withdraw                → Request withdrawal
│
├── PRESENTER PAGES (presenter role)
│   ├── /my-submission           → View/edit your submission
│   └── /my-feedback             → View feedback after event (optional)
│
├── JUDGE PAGES (judge role)
│   ├── /my-assignments          → See who you're judging
│   ├── /scoring                 → Score your assigned presenters
│   └── /scoring/[id]            → Score specific presenter
│
├── ADMIN PAGES (admin role)
│   ├── /admin                   → Admin dashboard overview
│   ├── /admin/events            → Manage event years
│   ├── /admin/submissions       → Review all submissions
│   ├── /admin/judges            → Manage judge registrations
│   ├── /admin/assignments       → Assign judges to presenters
│   ├── /admin/withdrawals       → Process withdrawal requests
│   ├── /admin/monitor           → Real-time scoring progress
│   ├── /admin/results           → View/export winners
│   └── /admin/settings          → Configure categories, criteria, etc.
│
├── ENGAGEMENT PAGES (Phase 2+)
│   ├── /photos                  → Photo feed
│   ├── /leaderboard             → Gamification leaderboard
│   ├── /scavenger-hunt          → Scavenger hunt (if implemented)
│   └── /attendees               → Attendee directory (networking)
│
└── API ROUTES
    └── /api/...                 → See API Routes section
```

---

## Database Schema

### Multi-Year Support

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,                      -- "Research Day 2026"

  -- Key dates
  event_date DATE,
  submission_opens_at TIMESTAMPTZ,
  submission_closes_at TIMESTAMPTZ,
  judge_signup_opens_at TIMESTAMPTZ,
  judge_signup_closes_at TIMESTAMPTZ,

  -- Event status
  status TEXT DEFAULT 'setup',             -- setup, accepting_submissions,
                                           -- reviewing, assignments, live, archived

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Profiles

```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  department TEXT,
  affiliation TEXT,                        -- "CSU", "External Institution"
  phone TEXT,
  avatar_url TEXT,

  -- Role flags (user can have multiple roles)
  is_admin BOOLEAN DEFAULT FALSE,
  is_presenter BOOLEAN DEFAULT FALSE,
  is_judge BOOLEAN DEFAULT FALSE,

  -- Gamification (Phase 2)
  points INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Submissions (Replaces MS Forms)

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),

  -- Assigned after acceptance
  presentation_id TEXT,                    -- "U04", "145", etc.

  -- Presenter info (captured at submission)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  classification TEXT,                     -- "PhD Student", "Undergrad", etc.
  department TEXT,

  -- Research info
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  research_type TEXT,                      -- "Foundational", "Translational", etc.
  research_stage TEXT,                     -- "Early", "Advanced"

  -- Preferences
  preferred_presentation_type TEXT,        -- "Oral", "Poster", "No preference"

  -- Assigned by admin
  presentation_type TEXT,                  -- Actual assigned type
  presentation_time TEXT,                  -- "10:15 - 11:15"
  presentation_location TEXT,              -- "Ballroom A", "Poster #42"

  -- Status workflow
  status TEXT DEFAULT 'draft',             -- See status workflow below
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES profiles(id),

  -- Withdrawal tracking (soft delete)
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,
  withdrawn_by UUID REFERENCES profiles(id),

  -- Admin notes
  admin_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)                -- One submission per person per event
);

-- Status history for audit trail
CREATE TABLE submission_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Submission Status Workflow:**
```
draft ──────────────► submitted ──────────────► under_review
                          │                          │
                          │                          ├──► changes_requested ──► submitted
                          │                          │
                          │                          ├──► accepted
                          │                          │
                          │                          └──► rejected
                          │
                          └──────────────────────────► withdrawn (at any point)
```

### Judge Registrations

```sql
CREATE TABLE judge_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),

  -- Contact (may differ from profile)
  preferred_email TEXT,
  phone TEXT,

  -- Availability
  available_sessions TEXT[],               -- Array: ["10:15 - 11:15", "11:30 - 1:30"]

  -- Expertise for matching
  expertise_areas TEXT[],                  -- Array: ["Foundational", "Translational"]

  -- Preferences
  max_presentations INTEGER DEFAULT 5,
  prefers_oral BOOLEAN DEFAULT TRUE,
  prefers_poster BOOLEAN DEFAULT TRUE,

  -- Conflicts of interest
  conflict_emails TEXT[],                  -- Emails of people they can't judge
  conflict_notes TEXT,                     -- Explanation if needed

  -- Status
  status TEXT DEFAULT 'registered',        -- registered, confirmed, withdrawn
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,

  -- Admin
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);
```

### Judge Assignments

```sql
CREATE TABLE judge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id),

  assignment_order INTEGER,                -- 1, 2, or 3

  -- Status tracking
  status TEXT DEFAULT 'assigned',          -- assigned, notified, scoring, completed
  notified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, judge_id)          -- One assignment per judge per submission
);
```

### Scores

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES profiles(id),
  assignment_id UUID REFERENCES judge_assignments(id),

  -- Criteria stored as JSONB for flexibility
  criteria JSONB NOT NULL,
  /*
  Example:
  {
    "content_why": 4,
    "content_what_how": 5,
    "content_next_steps": 3,
    "presentation_flow": 4,
    "preparedness": 5,
    "verbal_comm": 4,
    "visual_aids": 4
  }
  */

  weighted_total INTEGER,
  is_no_show BOOLEAN DEFAULT FALSE,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, judge_id)          -- One score per judge per submission
);
```

### Withdrawal Requests

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Who's withdrawing
  request_type TEXT NOT NULL,              -- 'presenter' or 'judge'
  submission_id UUID REFERENCES submissions(id),
  judge_registration_id UUID REFERENCES judge_registrations(id),
  user_id UUID REFERENCES profiles(id),

  -- Request details
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_via TEXT,                      -- 'self_service', 'email', 'phone'

  -- Processing
  status TEXT DEFAULT 'pending',           -- pending, approved, denied
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Configuration (Reusable Settings)

```sql
CREATE TABLE event_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, config_key)
);

-- Example configs to store:
-- 'scoring_criteria': weights and labels for each criterion
-- 'award_categories': list of award categories
-- 'session_times': available session times
-- 'classifications': list of presenter classifications
-- 'departments': list of departments
-- 'research_types': list of research types
```

### Email Templates

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Available variables for each template documented here
  variables TEXT[],                        -- ['{{name}}', '{{event_date}}', etc.]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates to create:
-- 'submission_confirmation'
-- 'submission_accepted'
-- 'submission_rejected'
-- 'changes_requested'
-- 'judge_assignment_notification'
-- 'withdrawal_confirmation'
-- 'reminder_scoring_incomplete'
```

---

## Authentication & Roles

### Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User clicks "Sign In" or protected action                  │
│              │                                               │
│              ▼                                               │
│  ┌─────────────────────────────────────┐                    │
│  │  Enter your email address           │                    │
│  │  ┌─────────────────────────────┐    │                    │
│  │  │ researcher@colostate.edu    │    │                    │
│  │  └─────────────────────────────┘    │                    │
│  │           [Send Magic Link]          │                    │
│  └─────────────────────────────────────┘                    │
│              │                                               │
│              ▼                                               │
│  Email sent: "Click here to sign in to Research Day"        │
│              │                                               │
│              ▼                                               │
│  User clicks link → Authenticated                           │
│              │                                               │
│              ▼                                               │
│  First time? → Complete profile (name, department)          │
│              │                                               │
│              ▼                                               │
│  Redirected to appropriate dashboard based on role          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Role System

| Role | How Assigned | Access |
|------|--------------|--------|
| **Attendee** | Default for all users | Public pages, photos, networking |
| **Presenter** | Auto when submission accepted | Above + view own submission, feedback |
| **Judge** | Auto when judge registration confirmed | Above + scoring interface |
| **Admin** | Manual assignment | Everything |

Users can have multiple roles (e.g., a faculty member could be both presenter and judge).

---

## Submission System

### Presenter Experience

```
┌─────────────────────────────────────────────────────────────┐
│  MY SUBMISSION                              Research Day 2026│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: ✅ ACCEPTED                                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ PRESENTATION DETAILS                                    │ │
│  │                                                         │ │
│  │ ID:       145                                           │ │
│  │ Type:     Poster                                        │ │
│  │ Time:     11:30 AM - 1:30 PM                           │ │
│  │ Location: Poster Board #42                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ YOUR ABSTRACT                                           │ │
│  │                                                         │ │
│  │ Title: Save the Pangolins! Radioactive Deterrents...   │ │
│  │                                                         │ │
│  │ Pangolins are the world's most trafficked mammal...    │ │
│  │ [View Full Abstract]                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NEED TO WITHDRAW?                                       │ │
│  │                                                         │ │
│  │ If you can no longer present, please let us know.      │ │
│  │ [Request Withdrawal]                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Admin Review Interface

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN > SUBMISSIONS                                [2026]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter: [All Statuses ▼] [All Types ▼] [Search...    🔍]  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📊 Overview                                             │ │
│  │ Total: 156  │  Pending: 12  │  Accepted: 142  │  Withdrawn: 2  │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ○ Pending Review                                        │ │
│  │                                                         │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ Sarah Chen - PhD Student                           │ │ │
│  │ │ "Novel approaches to CRISPR delivery in vivo"      │ │ │
│  │ │ Foundational • Early • Prefers: Oral               │ │ │
│  │ │ Submitted: Jan 15, 2026                            │ │ │
│  │ │                                                    │ │ │
│  │ │ [View Full] [Accept] [Request Changes] [Reject]   │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ ...more submissions...                             │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Export All] [Bulk Actions ▼] [Import from CSV]           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Judge Registration

### Judge Sign-Up Form

```
┌─────────────────────────────────────────────────────────────┐
│  JUDGE REGISTRATION                         Research Day 2026│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Thank you for volunteering! Please complete this form      │
│  so we can match you with appropriate presentations.        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  AVAILABILITY *                                              │
│  Check all sessions you can attend:                         │
│                                                              │
│  ☑ 10:15 - 11:15 AM  Undergraduate Posters                  │
│  ☑ 11:30 AM - 1:30 PM  Posters & Oral Presentations         │
│  ☐ 1:45 - 3:45 PM  Posters & Oral Presentations             │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  EXPERTISE *                                                 │
│  Check areas you're comfortable judging:                    │
│                                                              │
│  ☑ Foundational Research                                    │
│  ☑ Translational Research                                   │
│  ☐ Veterinary Clinical Research                             │
│  ☐ Social Sciences / Pedagogy                               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  PREFERENCES                                                 │
│                                                              │
│  Maximum presentations to judge: [5 ▼]                      │
│                                                              │
│  ☑ I can judge oral presentations                           │
│  ☑ I can judge poster presentations                         │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  CONFLICTS OF INTEREST *                                    │
│                                                              │
│  List anyone you CANNOT judge (students, collaborators,     │
│  family). Enter their email addresses, one per line:        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ my.student@colostate.edu                            │   │
│  │ collaborator@university.edu                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ☐ I have no conflicts of interest                          │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│                    [Register as Judge]                       │
│                                                              │
│  You'll receive your assignments one week before the event. │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Admin Assignment Interface

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN > JUDGE ASSIGNMENTS                          [2026]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📊 Status                                               │ │
│  │ Judges: 87 registered                                   │ │
│  │ Presenters needing judges: 8                            │ │
│  │ Conflicts detected: 3 (review needed)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Auto-Assign All]  [Check Conflicts]  [Notify Judges]      │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  NEEDS ASSIGNMENT (8)                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #145 Kristina Yepez                                     │ │
│  │ Foundational • Poster • 11:30 - 1:30                   │ │
│  │                                                         │ │
│  │ Assigned: Julie Moreno ✓, [Select Judge 2 ▼]           │ │
│  │                                                         │ │
│  │ Suggested: Mark Zabel (Foundational, available)        │ │
│  │            Alan Chen (Foundational, 3/5 slots used)    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  CONFLICTS DETECTED (3)                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Dr. Smith assigned to Sarah Chen                     │ │
│  │    Sarah is listed in Dr. Smith's conflicts            │ │
│  │    [Reassign] [Override - Not a Conflict]              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Withdrawal Handling

### Self-Service Withdrawal

```
┌─────────────────────────────────────────────────────────────┐
│  REQUEST WITHDRAWAL                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  We're sorry you can't participate this year.               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Withdrawing from: Presenter - Abstract Submission          │
│                                                              │
│  Reason for withdrawal: *                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Schedule conflict - dissertation defense moved to   │   │
│  │ the same day.                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️ This action requires admin approval. You'll receive     │
│     confirmation within 24 hours.                           │
│                                                              │
│              [Submit Withdrawal Request]                     │
│                                                              │
│  Changed your mind? Contact researchday@colostate.edu       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Admin Withdrawal Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN > WITHDRAWALS                                [2026]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⚠️ 3 Pending    ✓ 12 Processed    📊 Total: 15        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  PENDING REQUESTS                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🎤 PRESENTER: Kristina Yepez                            │ │
│  │    Requested: Jan 24, 2026 via Self-Service            │ │
│  │    Reason: "Schedule conflict - dissertation defense"   │ │
│  │                                                         │ │
│  │    Impact:                                              │ │
│  │    • Judges affected: Julie Moreno, Mark Zabel         │ │
│  │    • Session: 11:30 - 1:30 PM, Poster                  │ │
│  │                                                         │ │
│  │    [✓ Approve]  [✗ Deny]  [📧 Contact]                 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ⚖️ JUDGE: Dr. Rosa Quiroz                               │ │
│  │    Requested: Jan 23, 2026 via Email (logged by admin) │ │
│  │    Reason: "Family emergency"                          │ │
│  │                                                         │ │
│  │    Impact:                                              │ │
│  │    • 6 presenters need reassignment                    │ │
│  │    • Sessions: All three                                │ │
│  │                                                         │ │
│  │    [✓ Approve & Show Reassignment]  [✗ Deny]           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Log Withdrawal from Email/Phone]                        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  NEEDS ATTENTION                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 6 presenters need new judges after Dr. Quiroz withdrew │ │
│  │                                                         │ │
│  │ • U27 Sophia Jaskolka-Brown (needs 1 judge)            │ │
│  │ • 31 Julia Cook (needs 1 judge)                        │ │
│  │ • ...4 more                                            │ │
│  │                                                         │ │
│  │ [Auto-Assign Available Judges]  [Manual Assignment]    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Scoring System

(Same as current, but with proper auth and database-backed)

### Judge Experience

```
┌─────────────────────────────────────────────────────────────┐
│  MY ASSIGNMENTS                             Research Day 2026│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Welcome, Dr. Madison Johnson                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Your Progress: 3 of 5 complete                          │ │
│  │ ████████████████░░░░░░░░░░ 60%                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  SESSION: 11:30 AM - 1:30 PM                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✓ #42 Sarah Chen - Scored                               │ │
│  │ ✓ #67 Michael Park - Scored                             │ │
│  │ ○ #89 Lisa Wang - [Score Now]                          │ │
│  │ ○ #103 James Miller - [Score Now]                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  SESSION: 1:45 - 3:45 PM                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✓ #121 Emma Davis - Scored                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Need to withdraw from judging? [Request Withdrawal]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Admin Dashboard

### Main Overview

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                            Research Day 2026│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Event Status: 🟢 LIVE - Scoring in Progress                │
│  Event Date: March 15, 2026                                 │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 142          │ │ 87           │ │ 68%          │        │
│  │ Presenters   │ │ Judges       │ │ Scored       │        │
│  │ (3 withdrawn)│ │ (2 withdrawn)│ │              │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ⚠️ NEEDS ATTENTION                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • 3 withdrawal requests pending                        │ │
│  │ • 4 presenters need judge reassignment                 │ │
│  │ • 2 judges haven't started scoring                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  QUICK ACTIONS                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ 📊 Monitor │ │ 🏆 Results │ │ 📤 Export  │ │ ⚙️ Config │ │
│  │ Scores     │ │ & Winners  │ │ Data       │ │ Settings │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  SESSION PROGRESS                                            │
│  10:15 - 11:15  ████████████████████ 100%  ✓ Complete       │
│  11:30 - 1:30   ████████████░░░░░░░░  62%  In Progress      │
│  1:45 - 3:45    ░░░░░░░░░░░░░░░░░░░░   0%  Not Started      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Engagement Features (Phase 2)

### Photo Feed

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  location TEXT,                           -- "Poster Session", "Keynote"
  is_approved BOOLEAN DEFAULT TRUE,        -- Set FALSE if moderation needed
  is_contest_entry BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photo_likes (
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (photo_id, user_id)
);
```

### Gamification

```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,                    -- "Uploaded photo", "Visited sponsor booth"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points are summed in profiles.points via trigger
```

| Action | Points |
|--------|--------|
| Complete profile | 10 |
| Upload photo | 5 |
| Photo gets 5+ likes | 10 |
| Complete survey | 15 |
| Visit sponsor booth | 5 |
| Scavenger hunt item | 10-25 |
| Check in to event | 20 |

### Scavenger Hunt

```sql
CREATE TABLE scavenger_hunt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 10,
  qr_code_secret TEXT UNIQUE,              -- Secret in QR code
  location_hint TEXT,
  sort_order INTEGER
);

CREATE TABLE scavenger_hunt_completions (
  item_id UUID REFERENCES scavenger_hunt_items(id),
  user_id UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);
```

---

## Year-Over-Year Reuse

### Event Management

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN > EVENTS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟢 Research Day 2026                    LIVE            │ │
│  │    March 15, 2026 • 142 presenters • 87 judges         │ │
│  │    [Open Dashboard]                                     │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ 📁 Research Day 2025                    ARCHIVED        │ │
│  │    March 12, 2025 • 138 presenters • 82 judges         │ │
│  │    [View Archive]  [Export]  [Copy Settings to 2027]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Create New Event Year]                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Copied to New Year

| Copied | Not Copied |
|--------|------------|
| Award categories | Submissions |
| Scoring criteria | Judge registrations |
| Session times | Scores |
| Email templates | Photos |
| Department list | Point transactions |
| Classification list | Withdrawal requests |

---

## File Storage

```
Supabase Storage Buckets:

/avatars
  /{user_id}.jpg                    Profile photos

/photos
  /{event_year}/{uuid}.jpg          User-uploaded event photos

/abstracts (optional)
  /{event_year}/{submission_id}.pdf PDF abstracts if needed

/sponsors
  /{sponsor_id}/logo.png            Sponsor logos
  /{sponsor_id}/booth/...           Booth images
```

**Policies:**
- Avatars: Users can upload/update their own
- Photos: Authenticated users can upload; admins can delete
- Size limits: 5MB for photos, 2MB for avatars

---

## API Routes

```
/api
├── /auth
│   └── /callback                  Supabase auth callback
│
├── /events
│   ├── GET /                      List events (admin)
│   ├── POST /                     Create event (admin)
│   ├── GET /[id]                  Get event details
│   └── PUT /[id]                  Update event (admin)
│
├── /submissions
│   ├── GET /                      List submissions (filtered by role)
│   ├── POST /                     Create submission
│   ├── GET /[id]                  Get submission
│   ├── PUT /[id]                  Update submission
│   └── PUT /[id]/status           Change status (admin)
│
├── /judges
│   ├── GET /                      List judge registrations
│   ├── POST /                     Register as judge
│   ├── GET /[id]                  Get registration
│   └── PUT /[id]                  Update registration
│
├── /assignments
│   ├── GET /                      List assignments
│   ├── POST /                     Create assignment (admin)
│   ├── POST /auto-assign          Auto-assign judges (admin)
│   └── DELETE /[id]               Remove assignment (admin)
│
├── /scores
│   ├── GET /                      List scores (filtered)
│   ├── POST /                     Submit score
│   ├── GET /[id]                  Get score
│   └── PUT /[id]                  Update score
│
├── /withdrawals
│   ├── GET /                      List requests (admin)
│   ├── POST /                     Create request
│   └── PUT /[id]                  Process request (admin)
│
├── /photos (Phase 2)
│   ├── GET /                      Get photo feed
│   ├── POST /                     Upload photo
│   ├── DELETE /[id]               Delete photo
│   └── POST /[id]/like            Like photo
│
└── /admin
    ├── /stats                     Dashboard statistics
    ├── /export                    Export data
    └── /config                    Get/set configuration
```

---

## Development Phases

### Phase 1: Foundation (Months 1-3)

**Month 1: Project Setup**
- [ ] Create new repo with clean structure
- [ ] Set up Supabase project
- [ ] Configure auth (magic links)
- [ ] Create profiles table + trigger
- [ ] Basic layout components
- [ ] Landing page

**Month 2: Core Auth & Admin**
- [ ] Sign in / sign out flow
- [ ] Profile creation & editing
- [ ] Role system implementation
- [ ] Admin user management
- [ ] Event creation (multi-year support)

**Month 3: Submission System**
- [ ] Submission form
- [ ] Draft save / submit flow
- [ ] Admin review interface
- [ ] Status workflow
- [ ] Email notifications (basic)

### Phase 2: Judge System (Months 4-5)

**Month 4: Judge Registration**
- [ ] Judge sign-up form
- [ ] Availability & expertise capture
- [ ] Conflict of interest declaration
- [ ] Admin judge management

**Month 5: Assignments & Scoring**
- [ ] Assignment interface
- [ ] Auto-assignment algorithm
- [ ] Conflict detection
- [ ] Scoring interface (migrate from v1)
- [ ] Real-time monitor

### Phase 3: Operations (Month 6)

- [ ] Withdrawal request system
- [ ] Admin withdrawal dashboard
- [ ] Reassignment workflow
- [ ] Results & winners page
- [ ] Export functionality

### Phase 4: Engagement (Months 7-8)

- [ ] Photo uploads & feed
- [ ] Points system
- [ ] Leaderboard
- [ ] Surveys
- [ ] Sponsor booths

### Phase 5: Polish (Months 9-10)

- [ ] Attendee directory
- [ ] Connection requests
- [ ] Email template system
- [ ] Performance optimization
- [ ] Mobile responsiveness

### Phase 6: Launch Prep (Months 11-12)

- [ ] Beta testing with committee
- [ ] Load testing
- [ ] Documentation
- [ ] Admin training
- [ ] Dry run with test data
- [ ] Go live!

---

## Cost Estimates

### Supabase Free Tier (Should Cover Everything)

| Resource | Free Limit | Expected Usage |
|----------|------------|----------------|
| Database | 500 MB | ~50 MB |
| Storage | 1 GB | ~500 MB (photos) |
| Auth Users | 50K MAU | ~500 users |
| Realtime | 200 concurrent | ~100 max |
| Edge Functions | 500K/month | Minimal |

### If You Outgrow Free Tier

Supabase Pro: $25/month
- 8 GB database
- 100 GB storage
- Unlimited auth users

### Vercel

Free tier should suffice. Pro ($20/month) if you need:
- More build minutes
- Password protection for preview deployments
- Advanced analytics

---

## Questions to Resolve

1. **Pre-registration vs day-of accounts?**
   - Do attendees need accounts before event day?
   - Or only presenters/judges pre-register?

2. **Abstract editing after submission?**
   - Can presenters edit until deadline?
   - Or locked after submission (request changes via admin)?

3. **Photo moderation?**
   - Auto-approve all photos?
   - Or require admin approval?

4. **Presenter feedback visibility?**
   - Can presenters see their scores after event?
   - Just written feedback, or numerical scores too?

5. **Historical data migration?**
   - Import past years for reporting?
   - Or start fresh with 2026?

---

## Next Steps

1. **Review this architecture** - Does it cover everything?
2. **Answer the open questions** - Helps finalize design
3. **Set up new repo** - Clean slate for v2
4. **Create Supabase project** - For development
5. **Start Phase 1** - Foundation work

---

*Last updated: January 2026*
*Document version: 1.0*
