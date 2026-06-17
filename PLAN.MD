

# OpenVerify MVP Development Plan

## 1. Product Summary

OpenVerify is a Trinidad and Tobago-focused identity verification service for businesses that need to add a KYC or onboarding verification layer without building the entire process themselves.

The MVP will allow a business to create an admin account, create one or more deployments, issue unique API credentials per deployment, redirect users to a hosted verification flow, collect ID card and selfie evidence, run automated checks, calculate a verification score, send webhook results back to the business, and allow admins or super admins to manually review and override verification outcomes.

The first account created in the system becomes the super admin account automatically. That super admin can view and manage all accounts, admins, deployments, verification records, review queues, audit logs, and system-wide settings.

The service initially supports only Trinidad and Tobago identification cards, specifically:

- Current Trinidad and Tobago EBC national identification card layout.
- Previous Trinidad and Tobago EBC national identification card layout.

This narrow scope is deliberate. Identity verification is not where we should practise heroic improvisation while holding people’s biometric data like civilisation has learned nothing.

---

## 2. MVP Goals

### Primary Goals

1. Let businesses integrate OpenVerify into onboarding or KYC flows quickly.
2. Provide a secure hosted verification interface for end users.
3. Validate Trinidad and Tobago national ID cards using frontend and backend checks.
4. Compare selfie images against the ID card photo.
5. Match extracted user identity data against the electoral register database.
6. Compare IP geolocation against the registered address and include proximity in a validity score.
7. Return verification outcomes to the business through webhooks.
8. Provide admin dashboards for review, manual validation, and deployment management.
9. Provide a super admin dashboard for full system oversight.
10. Include privacy policy and terms of service drafted around Trinidad and Tobago data protection expectations.

### Non-Goals for MVP

These should not be included in the first MVP unless they become legally or commercially unavoidable:

- Support for passports, driving permits, non-TT IDs, or foreign documents.
- Fully automated fraud detection across many document types.
- Native mobile apps.
- White-label dashboard customisation.
- Advanced AML watchlist screening.
- Credit checks.
- Liveness detection beyond basic selfie capture quality checks.
- Client-side SDKs for every framework.
- Multi-region data residency.

---

## 3. Target Users

### Business Admins

Businesses that need to verify users during onboarding, account creation, application processing, access approval, credit checks, gated services, membership approval, or internal KYC workflows.

Admin needs:

- Create deployments.
- Configure webhook endpoints.
- Copy integration code.
- View verification records.
- Review flagged submissions.
- Manually approve or reject submissions.
- Export limited verification reports.
- Rotate API credentials.

### End Users

People being asked by a business to confirm their identity with OpenVerify.

End user needs:

- Understand why they are being redirected.
- See who requested the verification.
- Capture their TT ID card clearly.
- Capture a selfie.
- Submit the verification securely.
- Receive a clear outcome.
- Avoid confusing technical language, because apparently civilisation still thinks onboarding copy should read like a printer manual.

### Super Admin

The system-level operator.

Super admin needs:

- View all business accounts.
- View all deployments.
- View all verification records.
- Search and filter submissions.
- Override verification statuses.
- Suspend admins, accounts, or deployments.
- View audit logs.
- Monitor webhook failures.
- Review platform health and usage.

---

## 4. Core User Flows

## 4.1 Business Signup Flow

1. A business user creates an account.
2. If this is the first account in the system, it is automatically assigned the `super_admin` role.
3. Later accounts are assigned the `admin` role by default unless invited by an existing super admin.
4. The user confirms their email.
5. The user lands in the dashboard onboarding screen.
6. The dashboard prompts them to create their first deployment.

## 4.2 Deployment Creation Flow

1. Admin clicks **Create deployment**.
2. Admin enters:
   - Deployment name.
   - Description or use case.
   - Webhook URL.
   - Optional webhook secret.
   - Redirect success URL.
   - Redirect pending URL.
   - Redirect failure URL.
   - Allowed origins.
   - Branding options for the hosted verification page.
3. System creates:
   - Deployment record.
   - Public deployment key.
   - Secret API key.
   - Webhook signing secret.
4. Admin is shown:
   - Embeddable HTML/JS snippet.
   - AI prompt/integration brief.
   - API endpoint details.
   - Test mode toggle.

## 4.3 Business Integration Flow

A business adds an onboarding step that tells the user something like:

> Confirm your identification with OpenVerify. You will be redirected to OpenVerify to complete this step. Do not close this window.

The business backend creates a verification session using the deployment API credentials.

OpenVerify returns:

- Verification session ID.
- Hosted verification URL.
- Expiry timestamp.
- Current status.

The business redirects the end user to the hosted URL or opens it in the embedded integration flow.

## 4.4 End User Verification Flow

1. User lands on hosted OpenVerify page.
2. Page confirms:
   - Business requesting verification.
   - Purpose of verification.
   - What data will be collected.
   - Consent checkbox.
   - Link to privacy policy.
3. User captures or uploads front image of Trinidad and Tobago ID card.
4. Frontend checks:
   - File type.
   - File size.
   - Image sharpness.
   - Sufficient lighting.
   - Card boundary visible.
   - Expected card orientation.
   - Likely TT ID card layout.
   - Required visual zones present.
5. User captures selfie.
6. Frontend checks:
   - Face visible.
   - One face detected.
   - Image not too dark or blurry.
   - Face not obstructed.
7. Submission is uploaded securely.
8. Backend processing begins.
9. User sees one of:
   - Verified successfully.
   - Could not complete automatically, manual review required.
   - Submission failed validation and may be retried.

## 4.5 Automated Verification Flow

1. Store raw images in Cloudflare R2 using private object keys.
2. Create signed/internal-only access paths for processing.
3. Extract ID card fields through OCR/document parser.
4. Identify card version/layout.
5. Validate ID structure and visual layout.
6. Extract ID card portrait region.
7. Compare selfie face to ID portrait.
8. Match extracted name and available identifiers against electoral register database.
9. Resolve user IP through Flat18 Geo IP service.
10. Compare geolocation coordinates against registered address coordinates.
11. Calculate weighted validity score.
12. Assign status:
    - `verified`
    - `needs_review`
    - `rejected`
    - `failed`
13. Trigger webhook to business backend.
14. Record all score components and audit events.

## 4.6 Manual Review Flow

1. Admin opens review queue.
2. Admin filters by deployment, status, score range, date, or risk flag.
3. Admin opens a verification record.
4. Dashboard shows:
   - ID image.
   - Selfie image.
   - Extracted name.
   - Electoral register match result.
   - Face match score.
   - IP location match result.
   - Overall score.
   - Automated decision explanation.
   - Submission metadata.
5. Admin selects:
   - Approve.
   - Reject.
   - Request resubmission.
   - Keep pending.
6. System records manual decision with actor, timestamp, reason, and previous status.
7. If configured, webhook is sent again with updated status.

## 4.7 Super Admin Flow

1. Super admin logs into system dashboard.
2. Super admin can view all accounts, deployments, submissions, API usage, webhook failures, and audit logs.
3. Super admin can suspend accounts or deployments.
4. Super admin can override any verification request.
5. Super admin can force webhook replay.
6. Super admin can review security-sensitive events.

---

## 5. Roles and Permissions

## 5.1 Roles

### `super_admin`

System-wide owner role.

Permissions:

- View all accounts.
- View all admins.
- View all deployments.
- View all verification records.
- Create, suspend, or delete accounts.
- Change verification statuses globally.
- Manage platform settings.
- View audit logs.
- Rotate platform-level secrets where applicable.

### `admin`

Business account owner or operator.

Permissions:

- View own account.
- Manage own deployments.
- View own verification records.
- Manually approve/reject own submissions.
- Configure webhooks.
- Rotate deployment API credentials.
- Invite team members if team support is enabled.

### `reviewer` - optional post-MVP

Restricted review-only user.

Permissions:

- View assigned deployment records.
- Review and mark submissions.
- No API credential access.
- No account billing/settings access.

### `end_user`

Temporary verification subject.

Permissions:

- Access only their own active verification session.
- Upload ID and selfie.
- View verification result page.

---

## 6. Status Model

### Verification Session Statuses

- `created` - session exists but user has not started.
- `started` - user opened verification flow.
- `consented` - user accepted data processing notice.
- `id_uploaded` - ID image uploaded.
- `selfie_uploaded` - selfie uploaded.
- `processing` - backend checks running.
- `verified` - automatically or manually approved.
- `needs_review` - automatic process could not confidently approve.
- `rejected` - verification failed or was manually rejected.
- `resubmission_requested` - user should submit again.
- `expired` - session was not completed in time.
- `cancelled` - admin or system cancelled the session.
- `error` - unexpected processing failure.

### Webhook Delivery Statuses

- `pending`
- `sent`
- `failed`
- `retrying`
- `exhausted`

---

## 7. Verification Scoring Model

The MVP should use a transparent weighted scoring model. The exact weights can be tuned after testing.

### Suggested Score Components

| Component | Suggested Weight | Description |
| --- | ---: | --- |
| ID layout confidence | 20 | Whether the document resembles a supported TT ID card layout. |
| OCR confidence | 15 | Whether key fields are readable. |
| Face match score | 30 | Similarity between ID portrait and selfie. |
| Electoral register match | 25 | Whether extracted name/address data matches register records. |
| IP geolocation proximity | 10 | Approximate distance between IP location and registered address. |

### Suggested Decision Thresholds

| Score | Decision |
| ---: | --- |
| 85-100 | `verified` |
| 60-84 | `needs_review` |
| 0-59 | `rejected` or `needs_review` depending on risk flags |

### Important Scoring Rules

- IP geolocation must never be treated as identity proof on its own.
- Face match must not automatically approve a user if the ID card layout or electoral register match is weak.
- Low image quality should usually trigger `resubmission_requested`, not `rejected`.
- Any suspected tampering should trigger `needs_review`.
- Admins should see score components, not only the final score.

---

## 8. Technical Architecture

## 8.1 Proposed Stack

- **Frontend/dashboard**: Next.js or Nuxt/Vue, depending on current team preference.
- **Styling**: Tailwind CSS or Bootstrap 5 with a restrained design system.
- **Database**: Supabase Postgres.
- **Auth**: Supabase Auth.
- **Object storage**: Cloudflare R2.
- **Hosting/deployment**: Cloudflare Pages + Cloudflare Workers.
- **Server/API layer**: Cloudflare Workers or Pages Functions.
- **Geo IP**: Flat18 Geo IP service.
- **Image processing**: Cloudflare Worker-compatible pipeline where possible, with external processing worker if needed.
- **OCR/document analysis**: Pluggable provider behind an internal interface.
- **Face comparison**: Pluggable provider behind an internal interface.
- **Webhook queue**: Supabase table-backed queue for MVP, later Cloudflare Queues.
- **Audit logging**: Supabase Postgres append-only audit table.

## 8.2 Services

### Web App

Includes:

- Landing page.
- Auth pages.
- Admin dashboard.
- Super admin dashboard.
- Hosted verification flow.
- Legal pages.

### API Service

Includes:

- Deployment credential validation.
- Verification session creation.
- Upload URL generation.
- Verification processing orchestration.
- Webhook dispatch.
- Admin data endpoints.

### Processing Service

Includes:

- ID image validation.
- OCR.
- Card layout classification.
- Face extraction.
- Selfie comparison.
- Electoral register matching.
- Geo IP lookup.
- Score calculation.

For MVP, this can be implemented inside the main API worker if the processing load and execution limits allow it. If not, use a separate Node-based worker service.

---

## 9. Data Storage Model

## 9.1 Supabase Tables

### `accounts`

Stores business accounts.

Fields:

- `id uuid primary key`
- `name text not null`
- `slug text unique`
- `status text not null default 'active'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `profiles`

Extends Supabase Auth users.

Fields:

- `id uuid primary key references auth.users(id)`
- `account_id uuid references accounts(id)`
- `full_name text`
- `email text`
- `role text not null check role in ('super_admin','admin','reviewer')`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `deployments`

Organises verification records and API credentials per business use case.

Fields:

- `id uuid primary key`
- `account_id uuid references accounts(id)`
- `name text not null`
- `description text`
- `public_key text unique not null`
- `secret_key_hash text not null`
- `webhook_url text`
- `webhook_secret text`
- `success_redirect_url text`
- `pending_redirect_url text`
- `failure_redirect_url text`
- `allowed_origins text[]`
- `branding jsonb default '{}'`
- `status text not null default 'active'`
- `test_mode boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `verification_sessions`

Stores each verification attempt.

Fields:

- `id uuid primary key`
- `deployment_id uuid references deployments(id)`
- `account_id uuid references accounts(id)`
- `external_reference text`
- `status text not null`
- `subject_email text`
- `subject_phone text`
- `consented_at timestamptz`
- `started_at timestamptz`
- `completed_at timestamptz`
- `expires_at timestamptz not null`
- `ip_address inet`
- `user_agent text`
- `geo_result jsonb`
- `score numeric`
- `score_breakdown jsonb`
- `decision_reason text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `verification_assets`

Stores references to uploaded files in R2.

Fields:

- `id uuid primary key`
- `verification_session_id uuid references verification_sessions(id)`
- `asset_type text not null check asset_type in ('id_front','selfie','id_portrait_crop','processed_debug')`
- `r2_bucket text not null`
- `r2_key text not null`
- `mime_type text`
- `size_bytes bigint`
- `checksum text`
- `created_at timestamptz not null default now()`

### `verification_extracted_data`

Stores OCR and parsed data.

Fields:

- `id uuid primary key`
- `verification_session_id uuid references verification_sessions(id)`
- `card_version text`
- `full_name text`
- `id_number text`
- `date_of_birth date`
- `address_text text`
- `ocr_confidence numeric`
- `layout_confidence numeric`
- `raw_ocr jsonb`
- `created_at timestamptz not null default now()`

### `electoral_register_matches`

Stores register match results.

Fields:

- `id uuid primary key`
- `verification_session_id uuid references verification_sessions(id)`
- `matched boolean not null default false`
- `matched_record_id uuid`
- `name_score numeric`
- `address_score numeric`
- `registered_address text`
- `registered_lat numeric`
- `registered_lon numeric`
- `distance_from_ip_km numeric`
- `raw_match jsonb`
- `created_at timestamptz not null default now()`

### `face_match_results`

Stores selfie-to-ID match result.

Fields:

- `id uuid primary key`
- `verification_session_id uuid references verification_sessions(id)`
- `match_score numeric`
- `provider text`
- `raw_result jsonb`
- `created_at timestamptz not null default now()`

### `manual_reviews`

Stores human review decisions.

Fields:

- `id uuid primary key`
- `verification_session_id uuid references verification_sessions(id)`
- `reviewer_id uuid references profiles(id)`
- `previous_status text`
- `new_status text not null`
- `reason text`
- `created_at timestamptz not null default now()`

### `webhook_events`

Stores webhook payloads and delivery attempts.

Fields:

- `id uuid primary key`
- `verification_session_id uuid references verification_sessions(id)`
- `deployment_id uuid references deployments(id)`
- `event_type text not null`
- `payload jsonb not null`
- `status text not null default 'pending'`
- `attempt_count integer not null default 0`
- `last_attempt_at timestamptz`
- `next_attempt_at timestamptz`
- `last_response_status integer`
- `last_response_body text`
- `created_at timestamptz not null default now()`

### `audit_logs`

Append-only activity log.

Fields:

- `id uuid primary key`
- `actor_profile_id uuid references profiles(id)`
- `account_id uuid references accounts(id)`
- `action text not null`
- `entity_type text not null`
- `entity_id uuid`
- `metadata jsonb default '{}'`
- `ip_address inet`
- `created_at timestamptz not null default now()`

---

## 10. Security Requirements

## 10.1 Authentication and Authorisation

- Use Supabase Auth for dashboard users.
- Enforce row-level security for account-scoped data.
- Super admin access must be explicitly checked server-side.
- API keys must be hashed before storage.
- Secret API keys must only be shown once when generated.
- Deployment credentials must be rotatable.
- Every sensitive action must be written to `audit_logs`.

## 10.2 File Security

- Store ID and selfie images in private Cloudflare R2 bucket.
- Never expose raw R2 public URLs.
- Use short-lived signed URLs for admin review access.
- Restrict image access by role and account.
- Apply retention limits and deletion workflows.
- Store checksums for uploaded assets.

## 10.3 Data Security

- Encrypt sensitive secrets at rest where possible.
- Avoid storing unnecessary raw OCR data beyond operational need.
- Restrict service role keys to backend/server environments only.
- Do not expose Supabase service role keys in frontend code.
- Use strict CORS rules for API endpoints.
- Rate limit session creation and upload endpoints.
- Include CSRF protection where browser cookies are used.
- Use signed webhooks to prevent fake verification callbacks.

## 10.4 Webhook Security

Webhook requests should include:

- `OpenVerify-Signature`
- `OpenVerify-Timestamp`
- `OpenVerify-Event-Id`

Signature format:

```text
HMAC_SHA256(webhook_secret, timestamp + '.' + raw_body)
```

Admins should be instructed to reject stale timestamps and invalid signatures.

---

## 11. API Design

## 11.1 Create Verification Session

```http
POST /api/v1/verification-sessions
Authorization: Bearer <deployment_secret_key>
Content-Type: application/json
```

Request:

```json
{
  "deployment_key": "dep_public_xxx",
  "external_reference": "user_12345",
  "subject_email": "person@example.com",
  "subject_phone": "+1868XXXXXXX",
  "redirect_success_url": "https://client.app/onboarding/verified",
  "redirect_pending_url": "https://client.app/onboarding/pending",
  "redirect_failure_url": "https://client.app/onboarding/failed"
}
```

Response:

```json
{
  "id": "verify_session_uuid",
  "status": "created",
  "verification_url": "https://openverify.app/verify/verify_session_uuid?token=...",
  "expires_at": "2026-06-15T18:00:00Z"
}
```

## 11.2 Get Verification Session

```http
GET /api/v1/verification-sessions/:id
Authorization: Bearer <deployment_secret_key>
```

## 11.3 Cancel Verification Session

```http
POST /api/v1/verification-sessions/:id/cancel
Authorization: Bearer <deployment_secret_key>
```

## 11.4 Webhook Events

Events:

- `verification.created`
- `verification.started`
- `verification.verified`
- `verification.needs_review`
- `verification.rejected`
- `verification.resubmission_requested`
- `verification.expired`
- `verification.error`

Webhook payload:

```json
{
  "event": "verification.verified",
  "event_id": "evt_uuid",
  "created_at": "2026-06-15T18:00:00Z",
  "data": {
    "verification_session_id": "verify_session_uuid",
    "deployment_id": "deployment_uuid",
    "external_reference": "user_12345",
    "status": "verified",
    "score": 91,
    "decision_reason": "Automatic verification passed"
  }
}
```

---

## 12. Dashboard Information Architecture

## 12.1 Main Admin Navigation

Use a clean left sidebar or top-level app shell.

Primary sections:

1. **Overview**
2. **Verifications**
3. **Deployments**
4. **Integration**
5. **Review Queue**
6. **Webhooks**
7. **Settings**

Keep labels plain. No nonsense like “Identity Intelligence Hub”, because apparently dashboards now need to sound like rejected Marvel departments.

## 12.2 Admin Dashboard Pages

### Overview

Cards:

- Total verifications.
- Verified.
- Needs review.
- Rejected.
- Verification volume over time.
- Recent activity.
- Webhook failure count.

### Verifications

Table columns:

- Date.
- External reference.
- Deployment.
- Status.
- Score.
- Name extracted.
- Review flag.
- Actions.

Filters:

- Deployment.
- Status.
- Date range.
- Score range.
- Manual/automatic.

### Verification Detail

Sections:

- Status banner.
- User/session metadata.
- ID card image.
- Selfie image.
- Extracted data.
- Electoral register match.
- Face match result.
- Geo IP result.
- Score breakdown.
- Timeline/audit log.
- Manual decision controls.
- Webhook delivery history.

### Deployments

Table columns:

- Name.
- Status.
- Test mode.
- Public key.
- Created date.
- Last used.
- Actions.

### Deployment Detail

Tabs:

- Settings.
- API credentials.
- Webhook configuration.
- Branding.
- Integration code.
- Logs.

### Integration

Show:

- Copy-paste embed snippet.
- Backend API example.
- AI prompt for implementation.
- Webhook verification guide.
- Test credentials and test mode notes.

### Review Queue

Focused view for `needs_review` and `resubmission_requested` submissions.

Design goal: fast review, low clutter, obvious decision controls.

### Webhooks

Show:

- Recent webhook events.
- Delivery status.
- Retry button.
- Failure response.
- Signing secret info.

### Settings

Show:

- Account details.
- Team members if enabled.
- Security.
- Data retention settings.
- Notification settings.

## 12.3 Super Admin Navigation

Primary sections:

1. **Platform Overview**
2. **Accounts**
3. **Admins**
4. **Deployments**
5. **All Verifications**
6. **Review Oversight**
7. **Webhook Monitor**
8. **Audit Logs**
9. **Platform Settings**

---

## 13. Landing Page Plan

## 13.1 Positioning

OpenVerify should be positioned as:

> Identity verification for Trinidad and Tobago onboarding flows.

Supporting message:

> Add a secure TT ID card and selfie verification step to your app, form, or onboarding process without building the identity layer yourself.

## 13.2 Tone

- Simple.
- Trustworthy.
- Local.
- Security-first.
- Jargon-free.
- Direct.

Avoid sounding like generic fintech sludge.

## 13.3 Landing Page Sections

### Hero

Headline:

> Verify Trinidad and Tobago IDs in your onboarding flow.

Subheading:

> OpenVerify lets businesses add a secure identity check using TT national ID cards, selfie matching, electoral register matching, and webhook results.

Primary CTA:

> Request access

Secondary CTA:

> View integration flow

### Problem Section

Headline:

> KYC should not mean chasing screenshots over WhatsApp.

Copy:

> Many local onboarding flows still rely on manual ID checks, email attachments, and slow back-office review. OpenVerify gives your business a structured verification layer with clear statuses, review tools, and developer-friendly integration.

### How It Works

Steps:

1. Create a deployment.
2. Send your user to OpenVerify.
3. User uploads TT ID and selfie.
4. OpenVerify checks the submission.
5. Your app receives the result by webhook.

### What We Check

Cards:

- TT ID card layout.
- ID image readability.
- Selfie-to-ID face match.
- Electoral register name/address match.
- IP geolocation proximity.
- Manual review where needed.

### Built for Businesses

Bullets:

- Unique API credentials per deployment.
- Hosted verification flow.
- Webhook callbacks.
- Manual review dashboard.
- Super admin oversight.
- Private image storage.
- Audit logs.

### Privacy and Security

Copy:

> OpenVerify is designed around minimal collection, clear consent, private file storage, role-based access, audit logs, and retention controls. Identity data is sensitive. We treat it that way because apparently this still needs saying.

### CTA

Headline:

> Add a local identity layer to your onboarding flow.

Button:

> Request access

---

## 14. Visual and UX Direction

## 14.1 Product Design Principles

- Minimal dashboard chrome.
- High contrast status labels.
- Clear review decisions.
- No decorative clutter on sensitive workflows.
- Tables should be dense but readable.
- Verification details should be structured like a case file.
- End-user flow should feel calm and guided.
- Every error should explain what to do next.

## 14.2 Suggested Visual Style

- White or very light neutral background for end-user verification.
- Dark navy/charcoal dashboard shell.
- One strong accent colour for primary actions.
- Status colours used consistently.
- Rounded cards, restrained shadows.
- Simple iconography.
- No stock photos of people holding phones and smiling at absolutely nothing.

## 14.3 Status Colour Semantics

- Verified: green.
- Needs review: amber.
- Rejected: red.
- Processing: blue.
- Expired/cancelled: grey.

---

## 15. Legal and Compliance Plan

## 15.1 Trinidad and Tobago Data Protection Expectations

The Trinidad and Tobago Data Protection Act, Chap. 22:04, sets general privacy principles for handling personal information. The MVP should be designed around these operational principles:

- The organisation is responsible for personal information under its control.
- The purpose of collection must be identified before or at collection.
- Knowledge and consent are required for collection, use, or disclosure.
- Collection must be lawful and limited to what is necessary.
- Data must only be retained for as long as necessary.
- Data must be accurate, complete, and up to date where needed.
- Appropriate safeguards must protect personal information.
- Sensitive personal information needs heightened protection.
- Individuals should be able to access information about policies and practices.
- Individuals should be able to challenge accuracy, completeness, and compliance.
- Overseas disclosure should only happen where comparable safeguards exist.

Legal source references for drafting:

- Trinidad and Tobago Data Protection Act, Chap. 22:04.
- TT-CSIRT summary of Data Protection Act General Privacy Principles.
- Any guidance from the Office of the Information Commissioner when available.

This is not a substitute for legal advice. The privacy policy and terms should be reviewed by a Trinidad and Tobago attorney before production launch.

## 15.2 Privacy Policy Must Cover

The privacy policy should explain, in plain language:

1. Who operates OpenVerify.
2. Who the business customer is.
3. What data is collected:
   - ID card image.
   - Selfie image.
   - Extracted ID text.
   - Face comparison result.
   - Electoral register match result.
   - IP address.
   - Approximate geolocation.
   - Device/browser metadata.
   - Verification outcome.
4. Why data is collected.
5. Legal basis/consent model.
6. How data is used.
7. How data is stored.
8. How long data is retained.
9. When data is shared with the requesting business.
10. Whether any processors or third-party services are used.
11. Whether data may be processed outside Trinidad and Tobago.
12. How users can request access, correction, or deletion where applicable.
13. How users can challenge a decision.
14. Security safeguards.
15. Contact information.
16. Complaint process.

## 15.3 Terms of Service Must Cover

The terms should include:

1. Description of service.
2. Business customer responsibilities.
3. Prohibited use.
4. Requirement that customers have a lawful reason to request verification.
5. Requirement that customers provide clear notice to end users.
6. API credential security obligations.
7. Webhook and integration responsibilities.
8. Manual review responsibilities.
9. Data retention and deletion.
10. Service availability limitations.
11. Accuracy limitations.
12. No guarantee that verification prevents all fraud.
13. Fees and billing if applicable.
14. Suspension and termination rights.
15. Liability limitations.
16. Indemnity from business misuse.
17. Governing law: Trinidad and Tobago.
18. Dispute resolution.
19. Changes to terms.
20. Contact details.

## 15.4 Data Retention Defaults

Suggested MVP defaults:

- Raw ID/selfie images: 30-90 days unless customer contract requires shorter retention.
- Verification metadata: 1-3 years depending on business need and legal advice.
- Audit logs: 3-7 years depending on compliance need.
- Failed/abandoned sessions: delete assets quickly, e.g. 7-30 days.

The dashboard should expose retention settings later, but MVP can start with platform-level defaults.

---

## 16. Initial Documents to Create

Create these documents in the app:

1. `/privacy` - Privacy Policy.
2. `/terms` - Terms of Service.
3. `/data-processing` - Data Processing Summary for business customers.
4. `/security` - Security overview.
5. `/docs` - Developer integration docs.

The public legal pages should be simple, readable, and versioned by effective date.

---

## 17. Integration Snippet Plan

## 17.1 Embeddable Code

The admin dashboard should generate a snippet similar to:

```html
<script src="https://openverify.app/embed.js" data-deployment-key="dep_public_xxx"></script>
<button id="openverify-start">Confirm your identification with OpenVerify</button>
<script>
  OpenVerify.start({
    externalReference: "USER_ID_FROM_YOUR_APP",
    onStatusChange: function (status) {
      console.log("OpenVerify status", status);
    }
  });
</script>
```

## 17.2 AI Integration Prompt

The dashboard should also offer an AI prompt for developers:

```text
Add OpenVerify identity verification to this onboarding flow.

Requirements:
- When the user reaches the KYC step, call our backend route to create an OpenVerify verification session.
- Redirect the user to the returned verification_url.
- Show this text before redirecting: "Confirm your identification with OpenVerify. You will be redirected to OpenVerify to complete this step. Do not close this window."
- Store the verification_session_id against the user record.
- Wait for the OpenVerify webhook to update the user's onboarding status.
- Treat statuses as follows:
  - verified: allow onboarding to continue.
  - needs_review: show pending review message.
  - rejected: show verification failed message.
  - resubmission_requested: allow user to retry.
```

---

## 18. MVP Build Phases

## Phase 1 - Project Foundation

Deliverables:

- App scaffold.
- Supabase project connected.
- Cloudflare deployment connected.
- R2 bucket configured.
- Environment variable strategy.
- Base layout and design system.
- Auth pages.
- First-account-becomes-super-admin logic.
- Database migrations.
- RLS policies.

Acceptance criteria:

- First registered user becomes `super_admin`.
- Later users become `admin` or require invitation.
- Authenticated dashboard shell loads correctly.
- RLS prevents admins from seeing other accounts.

## Phase 2 - Accounts and Deployments

Deliverables:

- Account model.
- Deployment CRUD.
- API credential generation.
- API key hashing.
- Credential rotation.
- Webhook config form.
- Integration snippet page.

Acceptance criteria:

- Admin can create a deployment.
- Deployment has unique public and secret credentials.
- Secret is shown once.
- Admin can configure webhook URL.
- Admin can copy integration code.

## Phase 3 - Verification Session API

Deliverables:

- Create session endpoint.
- Get session endpoint.
- Cancel/expire session logic.
- Hosted verification URL generation.
- Deployment credential validation.
- Rate limiting.

Acceptance criteria:

- Business backend can create a verification session using deployment credentials.
- Session cannot be created with invalid credentials.
- Session expires correctly.
- Session status is queryable.

## Phase 4 - Hosted Verification Flow

Deliverables:

- Consent screen.
- ID upload/capture step.
- Selfie upload/capture step.
- Frontend image validation.
- Upload to R2 through signed upload flow.
- Status/progress screen.
- Result screens.

Acceptance criteria:

- User can complete the verification flow.
- Blurry or unreadable images are rejected before backend processing where possible.
- Files are uploaded privately.
- Session status updates correctly.

## Phase 5 - Automated Processing

Deliverables:

- ID card layout classifier.
- OCR extraction service interface.
- Face comparison service interface.
- Electoral register matching logic.
- Flat18 Geo IP lookup integration.
- Distance calculation.
- Score calculation.
- Decision assignment.

Acceptance criteria:

- Valid sample submissions produce score breakdowns.
- Weak/uncertain submissions go to `needs_review`.
- Failed image quality requests can trigger resubmission.
- Processing results are stored in structured tables.

## Phase 6 - Admin Review Dashboard

Deliverables:

- Verification table.
- Verification detail page.
- Review queue.
- Manual approve/reject/resubmission controls.
- Score breakdown display.
- Asset preview with signed URLs.
- Timeline/audit events.

Acceptance criteria:

- Admin can review only their own submissions.
- Admin can manually change statuses.
- Manual decisions create audit records.
- Updated decisions can trigger webhook events.

## Phase 7 - Webhooks

Deliverables:

- Webhook event generation.
- Signed webhook delivery.
- Retry logic.
- Webhook event table.
- Webhook dashboard.
- Manual replay.

Acceptance criteria:

- Business receives webhook on status change.
- Signature can be verified by receiving backend.
- Failed webhooks retry.
- Admin can see webhook delivery history.

## Phase 8 - Super Admin

Deliverables:

- Platform overview.
- Accounts list.
- Admins list.
- All deployments view.
- All verification records view.
- Global review override.
- Audit log viewer.
- Account/deployment suspension.

Acceptance criteria:

- Super admin can view and manage everything.
- Admins cannot access super admin routes.
- Suspended deployments cannot create new verification sessions.

## Phase 9 - Public Site and Legal Pages

Deliverables:

- Landing page.
- Privacy policy.
- Terms of service.
- Security overview.
- Data processing summary.
- Developer docs.

Acceptance criteria:

- Landing page explains product in simple language.
- Legal pages are published and versioned.
- End-user verification flow links to privacy policy.
- Consent text references the requesting business and purpose.

## Phase 10 - Testing, Hardening, and Launch Prep

Deliverables:

- Unit tests for scoring and status transitions.
- API tests.
- RLS tests.
- Webhook signature tests.
- Upload validation tests.
- Manual QA checklist.
- Security checklist.
- Seed/test data.
- Production environment checklist.

Acceptance criteria:

- No cross-account data leakage.
- API credentials behave correctly.
- R2 files remain private.
- Webhooks are signed and retry safely.
- Verification flow works on mobile.
- Admin review flow is usable on desktop.

---

## 19. MVP Testing Checklist

### Security Tests

- Admin cannot view another account’s deployments.
- Admin cannot view another account’s verification records.
- Signed URLs expire.
- Invalid API keys are rejected.
- Revoked API keys stop working.
- Suspended deployments cannot create sessions.
- Webhook signatures fail when payload is modified.
- Service role key is never exposed client-side.

### Verification Tests

- Valid current TT ID card sample.
- Valid previous TT ID card sample.
- Blurry ID card image.
- Cropped ID card image.
- Non-ID image.
- Multiple faces in selfie.
- No face in selfie.
- Selfie mismatch.
- Electoral register exact match.
- Electoral register fuzzy name match.
- IP location far from registered address.
- IP location unavailable.

### UX Tests

- User can complete flow on mobile.
- User understands why they are being redirected.
- User can retry after bad image quality.
- Admin can identify why a submission needs review.
- Admin can approve/reject without hunting through the interface like a tax form in a cupboard.

---

## 20. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| False positives | Fraudulent users may pass. | Conservative thresholds, manual review, audit trail. |
| False negatives | Legitimate users blocked. | Resubmission flow, manual review, clear support path. |
| Poor ID photo quality | Processing fails. | Strong frontend validation and user guidance. |
| Biometric/privacy concern | Legal and reputational risk. | Consent, retention limits, safeguards, legal review. |
| Electoral register mismatch | Legitimate users may fail due to stale data. | Fuzzy matching, manual review, do not rely on one signal. |
| IP geolocation weakness | Incorrect location signal. | Low weighting, never use as sole proof. |
| Data breach | Severe impact. | Private storage, least privilege, audit logs, retention, encryption. |
| Webhook failure | Customer onboarding not updated. | Retry queue, replay button, dashboard visibility. |
| Vendor lock-in | Processing provider changes hard. | Abstract OCR and face match providers behind interfaces. |

---

## 21. Immediate Build Order

1. Finalise product name and domain.
2. Create Supabase schema migrations.
3. Implement auth and first super admin creation.
4. Implement account/deployment CRUD.
5. Implement API credentials.
6. Implement verification session creation endpoint.
7. Implement hosted verification flow shell.
8. Implement R2 upload pipeline.
9. Implement minimal processing pipeline with mocked OCR/face scoring.
10. Build admin verification list/detail/review queue.
11. Add real OCR and face comparison provider.
12. Add electoral register match and Geo IP score.
13. Add signed webhooks and retry queue.
14. Add super admin views.
15. Add landing page and legal pages.
16. Run security and privacy review.
17. Launch private beta with test deployments only.

---

## 22. Private Beta Scope

The first live beta should be limited to a small number of trusted businesses.

Beta constraints:

- Manual review required before final approval, even if automatic score is high.
- Short retention window.
- Test mode enabled by default.
- Clear beta disclaimer.
- No high-risk use cases without legal review.
- Close monitoring of false positives/false negatives.

Recommended beta success metrics:

- Completion rate.
- Average verification time.
- Percentage auto-verified.
- Percentage needing review.
- False positive reports.
- False negative reports.
- Webhook delivery success rate.
- Admin review time.

---

## 23. Summary

The OpenVerify MVP should stay narrow, secure, and useful:

- Trinidad and Tobago ID verification only.
- Hosted verification flow.
- Admin deployments with unique API credentials.
- Automated scoring from document, selfie, register, and IP location checks.
- Manual review for uncertain submissions.
- Signed webhook results.
- Super admin oversight.
- Clear public marketing.
- Strong privacy, retention, access control, and audit foundations.

The product should avoid pretending identity verification is magic. It is a structured risk decision made from several imperfect signals. The dashboard should make those signals visible, the API should make the outcome easy to consume, and the legal pages should be written as if real humans might read them, an optimistic but technically possible scenario.