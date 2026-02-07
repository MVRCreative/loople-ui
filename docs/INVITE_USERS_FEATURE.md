# Invite Users Feature - Member Onboarding System

## Overview

This document describes the member onboarding system for Loople, which provides three primary methods for adding members to clubs. This feature is critical for getting members into clubs and managing the membership lifecycle.

## What We're Trying to Do

We need to build a comprehensive member onboarding system that allows clubs to add members through three distinct pathways:

1. **Individual Email Invites** - Admins can send personalized invites to specific individuals
2. **CSV/Excel Import** - Admins can bulk import existing members from spreadsheets
3. **Waitlist Application** - Prospective members can apply and pay to join a waitlist

Each method serves different use cases and requires different workflows, but all ultimately result in members being added to clubs with proper accounts and access.

---

## How We're Going to Do It

### 1. Individual Email Invite System

#### Description
Admins can enter an email address and send an invite code/link that allows the recipient to create an account for a specific club.

#### Key Requirements
- **Invite Expiration**: Invites expire after 30 days from creation
- **Reusability**: Invites are NOT one-time use - users can click the link multiple times
- **Existing Account Handling**: If user already has an account, prompt them to log in and then join the club
- **Dynamic Club Branding**: Each invite must include the club name and be dynamically branded per club
- **Smart Routing**: Invite links must route to the correct club context

#### Implementation Approach
- Enhance existing `ClubsService.inviteToClub()` functionality
- Create `club_invites` database table to track invites with expiration timestamps
- Build invite acceptance flow at `/auth/accept-invite?token={token}&club={clubId}`
- Enhance email templates to include club branding dynamically
- Handle multi-club scenarios where users may receive invites from multiple clubs

#### Technical Components
- **Database**: New `club_invites` table with expiration tracking
- **Edge Function**: Enhance `clubs-invite` function to support expiration
- **Frontend**: Invite acceptance page, invite management UI
- **Email**: Dynamic email templates with club branding

---

### 2. CSV/Excel Import System

#### Description
Admins can upload a CSV or Excel file containing member information. These are typically existing members who just need to create accounts.

#### Key Requirements
- **File Validation**: Validate file format (CSV, XLS, XLSX), size, and structure
- **Email Validation**: Validate email format before processing each row
- **Deferred Invites**: Do NOT send invites immediately - create member records first, send invites later as separate action
- **Error Reporting**: Show detailed import results with success count, skipped rows, and errors
- **Duplicate Handling**: Check for existing members and handle appropriately

#### Implementation Approach
- Create CSV parsing service with validation
- Build file upload component with preview functionality
- Create member records with status 'pending' during import
- Provide bulk invite functionality after import completes
- Show comprehensive import results to admin

#### Technical Components
- **Service**: `MembersService.importFromCSV()`
- **Edge Function**: `members-import-csv` for server-side processing
- **Frontend**: CSV upload form, import preview, import results display
- **Database**: Use existing `members` table with 'pending' status

---

### 3. Waitlist Application System

#### Description
Prospective members fill out an application form and pay a fee. Once payment is confirmed, they're added to the waitlist in payment order. Admins can view, approve, remove, and reorder waitlist entries.

#### Key Requirements
- **Payment Configuration**: Payment amount is configurable per club in admin panel
- **Payment-First**: Application is NOT saved to waitlist until payment is confirmed
- **Payment Failure**: If payment fails, do NOT create any record - inform user and allow retry
- **Ordering**: Waitlist ordered by payment confirmation timestamp (first paid = first on list)
- **Admin Approval**: Approving waitlist entry does NOT make them active member - separate step required
- **Manual Reordering**: Admins can manually reorder waitlist entries (overrides payment order)

#### Implementation Approach
- Create `waitlist_applications` database table
- Build public application form with Stripe payment integration
- Implement Stripe webhook handler for payment confirmation
- Create admin waitlist management UI with approve/remove/reorder actions
- Ensure payment confirmation happens server-side via webhooks

#### Technical Components
- **Database**: New `waitlist_applications` table with payment tracking
- **Edge Functions**: 
  - `waitlist-submit-application` - Handle form + payment initiation
  - `waitlist-confirm-payment` - Webhook handler for Stripe
  - `waitlist-manage` - Admin operations
- **Frontend**: 
  - Public form: `/waitlist/apply?club={clubId}`
  - Admin management: `/admin/waitlist`
- **Payment**: Stripe integration with webhook verification

---

## Multi-Club Support

### User Account Management
Users can belong to multiple clubs. When a user receives invites from multiple clubs:
- Each invite link routes to the correct club dynamically
- User can accept multiple invites
- User account is linked to multiple club memberships

### Club Switching
- Club switcher component already exists (`components/club-switcher.tsx`)
- Selected club persists in localStorage
- UI must make club switching smooth and intuitive
- When user logs in, they see all clubs they belong to

### Invite Link Routing
- Invite links must include club identifier
- Format: `/auth/accept-invite?token={token}&club={clubId}`
- System routes to correct club context
- If user already logged in, automatically join the club

---

## Database Schema Changes

### New Tables

#### `club_invites`
```sql
CREATE TABLE club_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('adult', 'child', 'family')),
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `waitlist_applications`
```sql
CREATE TABLE waitlist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  application_data JSONB, -- Store additional form fields
  payment_intent_id TEXT, -- Stripe payment intent
  payment_amount DECIMAL NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  position INTEGER NOT NULL, -- Order in waitlist
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables

#### `clubs`
```sql
ALTER TABLE clubs ADD COLUMN waitlist_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE clubs ADD COLUMN waitlist_payment_amount DECIMAL;
```

---

## API Endpoints

### Invite Endpoints
- `POST /api/clubs/invite` - Send individual invite (exists, needs enhancement)
- `GET /api/clubs/invite/:token` - Validate invite token
- `POST /api/clubs/invite/accept` - Accept invite and create account

### CSV Import Endpoints
- `POST /api/members/import-csv` - Upload and process CSV file
- `GET /api/members/import/:importId/status` - Check import status
- `POST /api/members/bulk-invite` - Send invites to imported members

### Waitlist Endpoints
- `POST /api/waitlist/apply` - Submit waitlist application + payment
- `GET /api/waitlist/:clubId` - Get waitlist for club (admin only)
- `POST /api/waitlist/:id/approve` - Approve waitlist entry (admin)
- `DELETE /api/waitlist/:id` - Remove waitlist entry (admin)
- `PUT /api/waitlist/reorder` - Reorder waitlist entries (admin)
- `POST /api/webhooks/stripe` - Handle Stripe payment webhooks

---

## Frontend Components

### Invite Components
- `components/club-management/invite-member-form.tsx` (exists, needs updates)
- `components/club-management/invite-list.tsx` - View sent invites
- `app/auth/accept-invite/page.tsx` - Accept invite page

### CSV Import Components
- `components/club-management/csv-import-form.tsx` - CSV upload form
- `components/club-management/import-preview.tsx` - Preview before import
- `components/club-management/import-results.tsx` - Show import results

### Waitlist Components
- `app/waitlist/apply/page.tsx` - Public application form
- `components/waitlist/application-form.tsx` - Application form component
- `app/admin/waitlist/page.tsx` - Admin waitlist management
- `components/admin/waitlist-table.tsx` - Waitlist entries table
- `components/admin/waitlist-actions.tsx` - Approve/remove/reorder actions

---

## Implementation Phases

### Phase 1: Individual Email Invites (Enhancement)
**Priority: High**

- Enhance existing invite system with 30-day expiration
- Create `club_invites` database table
- Improve email templates with club branding
- Handle existing account scenarios
- Build invite acceptance flow
- Multi-club invite routing

### Phase 2: CSV Import
**Priority: Medium**

- Build CSV upload component
- Create file parsing and validation service
- Implement member record creation
- Build import results UI
- Add bulk invite functionality (after import)

### Phase 3: Waitlist Application
**Priority: High**

- Create `waitlist_applications` database table
- Build application form (fields TBD)
- Integrate Stripe payment processing
- Implement Stripe webhook handler
- Build admin waitlist management UI
- Add waitlist reordering functionality

### Phase 4: Multi-Club Enhancements
**Priority: Medium**

- Enhance club switching UX
- Improve invite link routing
- Multi-club member management improvements

---

## Security Considerations

### Invite Security
- Cryptographically secure invite tokens
- Rate limiting on invite acceptance endpoints
- Prevent token guessing/brute force attacks

### Payment Security
- All payment processing must be server-side
- Stripe webhook signature verification required
- Never trust client-side payment status
- Use idempotency keys for payment processing

### CSV Import Security
- Strict file type validation
- Sanitize all input data
- Prevent CSV injection attacks
- Rate limiting on import endpoints

### Data Consistency
- Prevent duplicate members across methods
- Email uniqueness per club
- Handle race conditions in waitlist ordering

---

## Performance Considerations

### Large CSV Imports
- Chunk processing for large files
- Background job processing for very large imports
- Progress tracking for admin
- Timeout handling

### Email Deliverability
- Reliable email service (Supabase Auth emails or SendGrid)
- SPF/DKIM configuration
- Bounce handling
- Rate limiting on email sends

### Waitlist Ordering
- Efficient position updates
- Handle concurrent admin actions
- Optimistic locking for reordering

---

## Open Questions / TBD

1. **CSV Format**
   - Exact column names and structure
   - Required vs optional fields
   - Data validation rules

2. **Waitlist Application Form**
   - Required fields
   - Club-specific questions
   - Form validation rules

3. **Waitlist Approval → Active Member**
   - Exact workflow for converting approved waitlist to active member
   - Additional steps required
   - Notification requirements

4. **Payment Refund Policy**
   - When to refund removed waitlist entries
   - Automatic vs manual refunds
   - Refund processing workflow

5. **Email Service**
   - Which email provider (Supabase Auth, SendGrid, etc.)
   - Email template system
   - Branding requirements

---

## Related Documentation

- [Club Switching System](./CLUB_SWITCHING.md)
- [API Documentation](./postman/API_DOCUMENTATION.md)
- [Supabase Edge Functions Rules](../.cursor/rules/writing-supabase-edge-functions.mdc)
- [Database Migration Rules](../.cursor/rules/create-migration.mdc)
