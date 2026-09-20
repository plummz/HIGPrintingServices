# Security boundaries and permissions
Proposed controls; none implemented yet.

## Boundaries
1. Browser input is untrusted. Validate all DTOs; ignore client-computed prices, role and authoritative tenant claims.
2. Verified session identifies user. Requested business is only a selector; load an active membership before building TenantContext.
3. Policy determines action AND record scope. Staff assignment and customer ownership are independent checks.
4. Tenant-scoped repositories require TenantContext; no raw Prisma access from components. Composite foreign keys prevent cross-tenant relationships.
5. Private storage requires an authorized FileAsset lookup before short-lived signed retrieval or streamed delivery.
6. Read-only tracking tokens cannot authenticate approval, payment, file or customer APIs.
7. Background jobs explicitly bind a tenant and a least-privilege service identity; logs and exports follow the same boundaries.

Database row-level security is a proposed defense in depth: install and test transaction-local tenant context under a non-bypass application role before relying on it. If deferred, disclose this and enforce repository policies plus composite constraints and mandatory isolation tests. Never rely on a pooled connection retaining tenant context.

## Default role matrix
| Capability | Owner | Admin | Staff | Customer |
|---|---|---|---|---|
| Business settings, ownership, staff grants | Full; cannot remove last owner | Only delegated non-owner settings | No | No |
| Customer records | Business-wide | Operational access | Minimum fields for assigned jobs | Own profile |
| Products/prices/discounts | Yes | Granted by owner | No by default | View quoted snapshot |
| Orders/quotations | All | Operational access | Assigned preparation when granted | Own submit/accept/decline/change |
| Jobs, assignment and queue | All | All operations | Assigned jobs; limited queue DTO | Own progress |
| Proof upload | Yes | Yes | Assigned jobs | Artwork upload for own request |
| Customer proof approval | No impersonation | No impersonation | No | Own current proof |
| Payments | Record/reverse | Record; reversal delegated | Explicit payment grant, scoped job | Own totals only |
| Inventory | All | Operational; adjustments granted | Explicit usage/restock grant | No |
| Revenue/reports/audit export | Yes | Explicit report grant | No financial reporting | No |
| Tracking rotate/revoke | Yes | Yes | Assigned job if granted | No by default |

Owner/admin access never implies cross-business rights. Admin grants cannot exceed the owner's delegated permission set. Staff cannot change role/tenant fields through mass assignment. Permission checks happen on every request; membership revocation invalidates access immediately or via explicitly bounded session policy.

## Auth, abuse and sessions
Use a maintained auth library, its password hashing and reset/verification flow, secure HttpOnly cookies, production Secure flags, SameSite and session rotation/revocation. Validate same-origin mutations and apply CSRF defenses to cookie-authenticated state changes; never mutate on GET. Require verified customer identity for quotation/proof decisions. Invitations cannot be replayed or used to self-elevate.

Distributed rate limits for login, reset, token lookup, uploads and decision endpoints must work across server instances. Avoid memory-only limits in production. Return generic reset responses and bounded errors; do not leak account existence or stack traces. Redact tokens, secrets, signed URLs and unnecessary PII from logs.

## Tracking and customer decisions
Generate at least 32 random bytes with a standard cryptographic RNG; store a digest, expiry and revocation state. Raw token is returned for QR generation; future regeneration rotates it rather than storing plaintext. Tracking DTO exposes job number, service summary, state and estimated date only. No customer name/contact, private files, costs or payment references.

Tracking responses are no-store/noindex, use no-referrer and contain no third-party analytics. Redact path tokens in proxy and application logs. Proof approval requires a customer session (or a separately designed verified, purpose-specific one-time capability); tracking token alone is never enough.

## Uploads
Default proposed maximum 20 MiB, configurable after host limits are checked. Accept JPG/JPEG/PNG/PDF only initially, with extension, detected MIME and signature agreement. Limit decoded image dimensions to prevent decompression abuse. Random keys, no original paths, no executable permissions, private bucket/directory and per-business quota. Quarantine until validation; use malware scanning in the production release pipeline. No arbitrary URL ingestion.

Production direct-to-storage upload credentials must be limited to one generated key, short expiry and bounded size; finalize validates the actual object bytes before marking usable. Serve originals as downloads with nosniff; display safe rendered previews of PDF/image content under restrictive policy. Protect against same-tenant cross-customer file access.

## Financial integrity and concurrency
Server calculation, immutable quotation/proof snapshots, idempotency records and serialized ledger operations are required. Audit records commit with the business mutation. No direct editing/deletion of proof approvals, payments or stock movement history.

Use CSP, frame restrictions, nosniff, TLS/HSTS after HTTPS rollout, least-privilege DB/storage credentials and protected migration credentials. Apply retention and backup rules. Customer artwork is never committed or used as public demo data.

## Required review after each module
Test foreign tenant/customer identifiers, unauthorized staff actions, mass assignment, tampered totals, stale approvals, token guessing, upload execution, cache leakage, duplicate requests, concurrent ledger updates and error disclosure. Resolve critical/high findings before continuing. This is a design review checklist, not a claim of certification.

Reference: [OWASP multi-tenant security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html).
