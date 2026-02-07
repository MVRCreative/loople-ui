# Loople — Demo Audit Checklist

> **Purpose**: Board-of-directors demo readiness tracker.
> **Generated**: 2026-02-07
> **Last audited against**: current `main` branch

Legend: ✅ Done | ⚠️ Partial | ❌ Not started | 🐛 Bug

---

## 1. Authentication & Session Management

**Goal**: Highly reliable auth system — login, logout, persistent sessions, role-based access, password reset.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1.1 | Login flow (email + password) | ✅ Done | `app/auth/login/page.tsx` — form validation, error handling, redirect |
| 1.2 | Logout flow | ✅ Done | `app/auth/logout/page.tsx` — signs out, redirects to login |
| 1.3 | Session persistence (cookies) | ✅ Done | Supabase SSR + middleware auto-refresh in `middleware.ts` |
| 1.4 | No re-login on page navigation | ✅ Done | Middleware refreshes expired sessions server-side |
| 1.5 | Signup flow | ✅ Done | `app/auth/signup/page.tsx` — multi-step with club creation |
| 1.6 | Email verification | ✅ Done | `app/auth/confirm/page.tsx` — OTP verification |
| 1.7 | Password reset (request) | ✅ Done | `app/auth/forgot/page.tsx` |
| 1.8 | Password reset (new password) | ✅ Done | `app/auth/reset-password/page.tsx` |
| 1.9 | Route protection (authenticated) | ✅ Done | Middleware blocks unauthenticated access to protected routes |
| 1.10 | Role definitions (admin vs basic member) | ⚠️ Partial | DB `roles` table exists; not wired to frontend |
| 1.11 | Role-based route protection (admin routes) | ❌ Not done | Middleware checks auth only, not authorization |
| 1.12 | Remove `isAdmin` hardcoded bypass | 🐛 Bug | `lib/utils/auth.utils.ts` line 29 — `\|\| true` grants all users admin |
| 1.13 | Wire admin check to DB roles | ❌ Not done | `club-context.tsx` hardcodes `isAdmin = false` |
| 1.14 | Prevent path crossing between roles | ❌ Not done | Depends on 1.11 + 1.12 + 1.13 |

### Checklist

- [x] Login / logout
- [x] Session persistence (cookies, no unexpected re-login)
- [x] Password reset flow (request + update)
- [x] Email verification
- [x] Route protection (auth-based)
- [ ] Fix `isAdmin` bypass bug (`auth.utils.ts`)
- [ ] Wire role checks to database `roles` table
- [ ] Add role-based middleware for `/admin/*` routes
- [ ] End-to-end test: basic member cannot access admin routes
- [ ] End-to-end test: admin can access admin routes

---

## 2. Admin Panel — Member Management

**Goal**: Admins can view all members, click into a member detail panel, see family info, activity, payment history, notes, and manage status.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 2.1 | Member directory (list/table) | ✅ Done | `admin/users/page.tsx` + `members-table.tsx` |
| 2.2 | Create member | ✅ Done | `create-member-form.tsx` |
| 2.3 | Edit member | ✅ Done | `edit-member-form.tsx` |
| 2.4 | Invite member | ✅ Done | `invite-member-form.tsx` |
| 2.5 | Member detail / activity panel | ❌ Not done | No `/admin/members/[id]` route or detail page |
| 2.6 | Membership duration / join date | ⚠️ Partial | `membership_start_date` field exists; no display in detail view |
| 2.7 | Family info (spouse, kids, ages) | ❌ Not done | No family relationship model (`family_id`, `parent_id`, etc.) |
| 2.8 | Activity history (events, programs) | ❌ Not done | No per-member activity log |
| 2.9 | Messages between member and admin | ❌ Not done | Messaging is mock-data only |
| 2.10 | Payment history (per member) | ❌ Not done | Payment service exists but not connected; admin page uses mock data |
| 2.11 | Admin notes on member | ❌ Not done | No `notes` field in member schema; no UI |
| 2.12 | Status: active | ✅ Done | Supported in member model |
| 2.13 | Status: inactive | ✅ Done | Supported in member model |
| 2.14 | Status: pending | ✅ Done | Supported in member model |
| 2.15 | Status: suspended | ❌ Not done | Not in member type definition |
| 2.16 | Status: canceled (end-of-season) | ❌ Not done | No cancellation logic or end-date handling |
| 2.17 | Status change workflow + history | ❌ Not done | No audit trail for status changes |
| 2.18 | Status change notifications | ❌ Not done | No notification system |

### Checklist

- [x] Member directory table with search
- [x] Create / edit / invite member forms
- [ ] Build member detail page (`/admin/members/[id]`)
- [ ] Add family data model (family groups, parent-child, spouse relationships)
- [ ] Build family management UI on member detail
- [ ] Add per-member activity timeline (events, programs, registrations)
- [ ] Connect payment history to member detail (real data, not mock)
- [ ] Add admin notes field to member schema + UI
- [ ] Add `suspended` and `canceled` statuses to member model
- [ ] Build cancellation flow (effective end-of-season, record retained)
- [ ] Add status change audit trail
- [ ] Wire messaging to member detail (see Feature 6)

---

## 3. Admin Panel — Waitlist Management

**Goal**: Digital waitlist replaces paper PDF + check process. Public application form, online payment, FIFO ordering, deferral, admin controls.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 3.1 | Waitlist data model | ❌ Not done | Documented in `docs/INVITE_USERS_FEATURE.md` but no DB table |
| 3.2 | Waitlist toggle (on/off) | ❌ Not done | |
| 3.3 | Waitlist settings page (fields, pricing) | ❌ Not done | |
| 3.4 | Public application form | ❌ Not done | No `/waitlist/apply` route |
| 3.5 | Online payment (registration fee) | ❌ Not done | No Stripe integration for waitlist |
| 3.6 | Auto-add to waitlist on payment clearance | ❌ Not done | |
| 3.7 | Finance visibility on transactions | ❌ Not done | |
| 3.8 | FIFO ordering (by application date) | ❌ Not done | |
| 3.9 | Deferral option (drop one spot, not to bottom) | ❌ Not done | |
| 3.10 | First right of refusal for deferred members | ❌ Not done | |
| 3.11 | Admin: manual placement adjustment | ❌ Not done | |
| 3.12 | Placement adjustment warning + confirmation | ❌ Not done | |
| 3.13 | Admin: review individual waitlist entries | ❌ Not done | |
| 3.14 | Convert waitlist entry to active member | ❌ Not done | |

### Checklist

- [ ] Design and create `waitlist_applications` DB table + RLS policies
- [ ] Build waitlist settings page (`/admin/waitlist/settings`)
- [ ] Build admin waitlist toggle (on/off)
- [ ] Build public-facing application form (`/waitlist/apply`)
- [ ] Integrate Stripe for registration fee payment
- [ ] Auto-add applicant to waitlist on payment clearance (webhook)
- [ ] Implement FIFO ordering logic
- [ ] Build deferral mechanism (drop one spot, retain priority)
- [ ] Build admin waitlist management page (`/admin/waitlist`)
- [ ] Build manual placement adjustment with warning dialog
- [ ] Build waitlist-to-active-member conversion flow
- [ ] Add waitlist transactions to finance view

---

## 4. Annual Dues (Stripe Integration)

**Goal**: Admin-initiated annual dues push to all active members. Payment tracking dashboard with paid/unpaid/past-due states. Searchable transaction history with refund capability.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 4.1 | Dues campaign data model | ❌ Not done | No concept of dues/campaigns in codebase |
| 4.2 | Admin: configure amount, due date, messaging | ❌ Not done | |
| 4.3 | Push notification to active members | ❌ Not done | No notification system |
| 4.4 | Email to active members with payment link | ❌ Not done | |
| 4.5 | Member: pay via Stripe | ⚠️ Partial | `payments.service.ts` has `createStripePaymentIntent()`; no checkout UI |
| 4.6 | Auto-update member status on payment | ❌ Not done | |
| 4.7 | Dues dashboard: paid (green, date) | ❌ Not done | |
| 4.8 | Dues dashboard: unpaid (grayed out) | ❌ Not done | |
| 4.9 | Dues dashboard: past due (red flag) | ❌ Not done | |
| 4.10 | Nudge / remind individual members | ❌ Not done | |
| 4.11 | Auto-remind on schedule (e.g. every 2 weeks) | ❌ Not done | |
| 4.12 | Transaction history (searchable) | ⚠️ Partial | `payments-table.tsx` exists with search but uses mock data |
| 4.13 | Full refund | ❌ Not done | Action exists in UI but not wired |
| 4.14 | Partial refund | ❌ Not done | |

### Checklist

- [ ] Design dues campaign data model (campaigns table, member_dues table)
- [ ] Build admin dues setup page (`/admin/dues/create`)
- [ ] Build dues push mechanism (notification + email to active members)
- [ ] Build Stripe checkout flow for dues payment
- [ ] Build dues tracking dashboard (`/admin/dues/[campaignId]`)
- [ ] Implement paid / unpaid / past-due visual states
- [ ] Auto-update member record on successful payment (webhook)
- [ ] Build nudge/remind functionality (manual + scheduled)
- [ ] Connect `payments-table.tsx` to real data
- [ ] Implement full and partial refund via Stripe API
- [ ] Add refund reason field

---

## 5. Program Management (Stripe Integration)

**Goal**: Admins create programs (e.g. swim team). Members register children, pay with family cap logic. Admin sees registrations, exports CSV for coaches.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 5.1 | Programs data model | ⚠️ Partial | Events reference `program_id` but no programs CRUD |
| 5.2 | Admin: create program (name, photo, description) | ❌ Not done | `app/(dashboard)/programs/page.tsx` is empty placeholder |
| 5.3 | Dynamic registration fields | ❌ Not done | |
| 5.4 | Fee per registrant | ❌ Not done | |
| 5.5 | Family cap (e.g. $50/kid, max $200) | ❌ Not done | Requires family model (Feature 2.7) |
| 5.6 | Registration cap (max participants) | ❌ Not done | |
| 5.7 | Schedule builder | ❌ Not done | |
| 5.8 | Member: auto-filled registration from profile | ❌ Not done | Requires family model |
| 5.9 | Select / deselect children for registration | ❌ Not done | Requires family model |
| 5.10 | Review + pay via Stripe | ❌ Not done | |
| 5.11 | Confirmation email | ❌ Not done | |
| 5.12 | Admin: registration dashboard | ❌ Not done | `registrations-table.tsx` exists for events, not programs |
| 5.13 | View by family or by participant | ❌ Not done | |
| 5.14 | Sort / filter / group by age + gender | ❌ Not done | |
| 5.15 | CSV export for coaches | ❌ Not done | Export button in members table is non-functional |
| 5.16 | Full / partial refund with reason | ❌ Not done | |
| 5.17 | Program sub-page (feed, schedule, comments) | ❌ Not done | |
| 5.18 | Program-scoped messaging | ❌ Not done | |

### Checklist

- [ ] **Prerequisite**: Build family data model (Feature 2.7)
- [ ] Design programs table + program_registrations table
- [ ] Build admin program creation page (`/admin/programs/create`)
- [ ] Build dynamic registration field configuration
- [ ] Implement fee-per-registrant + family cap pricing logic
- [ ] Build schedule builder UI
- [ ] Build member-facing program registration flow (auto-fill, child select, review, pay)
- [ ] Integrate Stripe checkout for program fees
- [ ] Build confirmation email on registration
- [ ] Build admin registration dashboard (`/admin/programs/[id]/registrations`)
- [ ] Add sort / filter / group by age + gender
- [ ] Build CSV export for participant lists
- [ ] Implement full / partial refund with reason field
- [ ] Build program sub-page with scoped feed, schedule, and comments

---

## 6. Messaging

**Goal**: Member-to-member DMs and a member-to-admin channel with shared admin inbox.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 6.1 | Messaging data model | ❌ Not done | No real messages table; mock data in `lib/mock-messages.ts` |
| 6.2 | Conversations list UI | ⚠️ Partial | `ConversationsList.tsx` renders but uses mock data |
| 6.3 | Message thread UI | ⚠️ Partial | `MessageThread.tsx` renders but uses mock data |
| 6.4 | Messages routes | ⚠️ Partial | `/messages` and `/messages/[id]` exist, mock data only |
| 6.5 | Member-to-member DMs | ❌ Not done | No backend |
| 6.6 | Name auto-complete when composing | ❌ Not done | |
| 6.7 | Member-to-admin channel | ❌ Not done | |
| 6.8 | Shared admin inbox (all admins see all messages) | ❌ Not done | |
| 6.9 | Real-time message delivery | ❌ Not done | No Supabase Realtime for messages |

### Checklist

- [ ] Design messages / conversations DB tables + RLS policies
- [ ] Build messaging service layer (`messages.service.ts`)
- [ ] Connect `ConversationsList.tsx` to real data
- [ ] Connect `MessageThread.tsx` to real data
- [ ] Implement member-to-member DM creation with name auto-complete
- [ ] Build member-to-admin channel (messages addressed to "Admin")
- [ ] Build shared admin inbox view
- [ ] Add Supabase Realtime subscriptions for live message delivery
- [ ] Remove `lib/mock-messages.ts` dependency

---

## 7. Homepage / News Feed *(lower priority — post core demo)*

**Goal**: Personalized Twitter-style feed with admin announcements, program-scoped items, and comments.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 7.1 | Post creation | ✅ Done | `post-form.tsx` |
| 7.2 | Post display (cards) | ✅ Done | `post-card.tsx` |
| 7.3 | Post editing | ✅ Done | `post-edit-form.tsx` |
| 7.4 | Comments | ✅ Done | `comments-section.tsx`, `comment-form.tsx` |
| 7.5 | Reactions | ✅ Done | Via posts service |
| 7.6 | Polls | ✅ Done | `poll-voting.tsx` |
| 7.7 | Media attachments | ✅ Done | `media-attachment.tsx` + Supabase storage |
| 7.8 | Real-time feed updates | ✅ Done | Supabase Realtime subscriptions |
| 7.9 | Admin announcements (pinned / priority) | ❌ Not done | No pinning or priority logic |
| 7.10 | Program-scoped feed items | ❌ Not done | No program-level feed filtering |
| 7.11 | Event updates in feed | ⚠️ Partial | Events exist but not integrated into newsfeed |

### Checklist

- [x] Post CRUD (create, read, update)
- [x] Comments + reactions
- [x] Polls + media attachments
- [x] Real-time updates
- [ ] Add admin announcement pinning / priority
- [ ] Add program-scoped feed filtering (show only to program members)
- [ ] Integrate event updates into the newsfeed

---

## Priority Order for Demo Readiness

1. **Auth RBAC fix** — unblock everything else (1-2 days)
2. **Member Management** — detail page, family model, notes, payment history, status (1-2 weeks)
3. **Waitlist Management** — entirely net-new (1-2 weeks)
4. **Annual Dues + Stripe** — payment flow, dashboard, refunds (1-2 weeks)
5. **Program Management** — depends on family model from #2 (2-3 weeks)
6. **Messaging** — UI shell exists, needs real backend (1 week)
7. **News Feed polish** — lowest priority, mostly done (2-3 days)

---

## Cross-Cutting Concerns

| Concern | Status | Notes |
|---|---|---|
| Stripe integration (shared) | ⚠️ Skeletal | Payment intent creation exists; no checkout UI, webhooks, or refund processing |
| Email / notification system | ❌ Not done | Needed by dues, waitlist, programs, messaging |
| Family data model | ❌ Not done | Blocks member detail, program registration, billing |
| CSV export | ❌ Not done | Button exists in UI but non-functional |
| Real-time (beyond newsfeed) | ❌ Not done | Only newsfeed has Realtime; messaging and notifications need it |
| RLS policies | ❓ Unknown | May exist in Supabase but not documented in codebase |
| Mobile responsiveness | ❓ Untested | `use-mobile.ts` hook exists; needs verification |
| Dark mode | ❓ Untested | Theme provider exists; needs verification |
