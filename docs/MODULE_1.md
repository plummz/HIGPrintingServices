# Module 1 — Foundation and identity

Implementation started after explicit user approval on September 20, 2026. This is the first increment, not the full PrintFlow MVP.

## Implementation

Next.js 16 / React / TypeScript and Tailwind render the account and workspace screens. Better Auth owns password hashing, verification/reset tokens, sessions and auth rate limits. Prisma 6.19.3 provides PostgreSQL data access; an initial checked-in migration defines auth, business, membership, invitation, audit and security-event tables.

Business mutations lock the business row and then recheck the caller's membership inside the transaction. Role changes, approval of access and audit writes are atomic. Concurrent attempts to remove owners cannot remove the last active owner. Membership authorization is queried from the database every time; session cookie caching is disabled.

Owner invitations use random 256-bit tokens, store only SHA-256 digests and expire in 48 hours. Links put the token in the URL fragment, which browsers do not send as part of the initial request. Acceptance requires a signed-in, email-verified matching user, current inviter owner authority and an unused/nonrevoked invitation. Owners share invitation links manually; this module does not automatically send invitations.

Current administrative grants are `business:update`, `members:read` and `audit:read`; only ADMIN memberships can use delegated grants. OWNER can manage memberships. STAFF and CUSTOMER can view the business summary but cannot access its member list, audit or settings mutations. Future job/customer ownership policies remain future work.

## Implemented endpoints

- Better Auth GET/POST `/api/auth/*` (same-origin mutation and 16 KiB JSON checks at the wrapper).
- GET/POST `/api/v1/businesses`.
- GET/PATCH `/api/v1/businesses/:businessId`.
- GET `/api/v1/businesses/:businessId/memberships`.
- PATCH `/api/v1/businesses/:businessId/memberships/:membershipId`.
- GET/POST `/api/v1/businesses/:businessId/invitations`.
- DELETE `/api/v1/businesses/:businessId/invitations/:invitationId` (send `{}` as JSON).
- POST `/api/v1/invitations/accept`.
- GET `/api/v1/businesses/:businessId/audit` (most recent 50 events).

All business mutations have a database-backed per-user 30 requests/minute limit. Workspace creation is capped at 10 owned businesses; pending invitations at 100 per business. Member lists are limited to 100. These are documented first-increment limits, not a complete pagination implementation.

## Security review

- Verified cross-business reads/updates, staff/customer admin access and mass-assignment rejection.
- Verified expired/replayed/mismatched/revoked invitations, stale settings, immediate access revocation and last-owner guards.
- Composite invitation foreign keys reject links to a member of another business.
- State changes enforce origin, strict input schemas and bounded JSON; secrets remain in environment variables.
- CSP uses a per-response script nonce; no private response cache. Browser tests check usable forms under this policy.
- Auth logger is disabled to prevent token/credential leakage. Security events store action/user ID only. Business audit details include access changes, not secrets.
- Dependency review found a high-severity transitive `deepmerge-ts` advisory. It is overridden to patched 8.0.0; Prisma generation/migration/build and tests must remain green with the override. Revisit it when Prisma's upstream dependency is fixed.
- PostgreSQL RLS is not enabled. Current isolation uses server policies and composite constraints. Do not claim RLS protection.
- Failed auth audit events do not identify the supplied email. HTTP success resets sessions using library functionality. No custom password/reset cryptography.

## Verification status

Local lint, TypeScript checks, production build and 31 unit/integration tests have passed. Local DB verification uses PGlite's PostgreSQL engine through its socket adapter. Native PostgreSQL CI and browser checks are tracked in the pull request; their final observed status will be recorded before delivery.

## Operational limitations

No hosted deployment or real SMTP has been configured. Production auth requires both. No seeded admin exists. File mail is development-only and is excluded from Git. Native PostgreSQL concurrency checks are required before production use; PGlite serializes connections differently. Test-data cleanup is scoped to synthetic records; browser fixtures remain in the test database.

Daily rate/session cleanup is an external scheduled command for now. No arbitrary permission graph, ownership-transfer wizard, customer job records, file storage, quote engine, PWA service worker or job dashboard metrics are implied by this foundation.

## Sources used during integration

[Better Auth installation](https://better-auth.com/docs/installation), [Prisma adapter](https://better-auth.com/docs/adapters/prisma), [rate limiting](https://better-auth.com/docs/concepts/rate-limit), [email/password flows](https://better-auth.com/docs/authentication/email-password). Installed package types and executed tests are the source of truth for this integration.
