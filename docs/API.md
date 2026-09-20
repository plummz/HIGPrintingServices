# Proposed API architecture
Same-origin versioned JSON endpoints under /api/v1; library auth endpoints under /api/auth. Route handlers validate, authenticate and call application services. Server components call the same services directly.

## Cross-cutting contract
Authenticated request context contains userId, validated businessId, membershipId and effective permissions. Business IDs in paths are selectors, never authority. Use allowlisted DTO fields and cursor pagination (default 25, maximum 100), bounded filters and date ranges.

Return {data, meta?} or {error:{code,message,fieldErrors?,requestId}}. Statuses: 400 validation, 401 missing session, 403 action denied, 404 scoped resource unavailable, 409 stale version/conflict, 413 oversized upload, 415 invalid type, 422 invalid transition, 429 rate limit. Never expose DB errors. Foreign tenant IDs normally return 404.

Mutations enforce origin/CSRF controls. Send expectedVersion for concurrent edits; require Idempotency-Key for quotation acceptance, payments, refunds and material consumption. Store request hash with the key; a reused key with different payload fails. Unique constraints back up idempotency.

## Route groups
| Routes | Scope / behavior |
|---|---|
| GET/POST /businesses; GET/PATCH /businesses/:businessId | List verified memberships; authenticated owner setup; owner/settings grant |
| /businesses/:b/memberships and /invitations | Owner-controlled staff lifecycle; no arbitrary role assignment |
| /businesses/:b/customers | Scoped CRUD, search and archived history |
| /businesses/:b/products, /price-rules, /add-ons | Owner/admin grants; version price changes |
| /businesses/:b/orders | Staff or owning customer request creation/read |
| /businesses/:b/quotations | Create draft, list scoped quotations |
| POST /businesses/:b/quotations/:id/versions | Recalculate on server and create immutable revision |
| POST /businesses/:b/quotations/:id/issue | Validate complete pricing; notify customer |
| POST /businesses/:b/quotations/:id/decision | Verified owning customer; versionId, APPROVE/DECLINE/REQUEST_CHANGES and comment; no totals |
| /businesses/:b/jobs | Read/create only through accepted-order service; no bypass of commercial gate |
| GET /businesses/:b/jobs/:id/ticket | Authorized printable job ticket |
| POST /businesses/:b/jobs/:id/transitions | Policy + state machine + expectedVersion |
| POST /businesses/:b/jobs/:id/files/upload-intent | Authorized scoped private upload target |
| POST /businesses/:b/files/:id/finalize | Validate actual bytes, quarantine/validation lifecycle |
| GET /businesses/:b/files/:id/download | Reauthorize resource ownership; private stream or short-lived signed URL |
| POST /businesses/:b/job-items/:id/proofs | New immutable version referencing validated file |
| POST /businesses/:b/proofs/:id/decision | Owning verified customer, exact current version, APPROVE/REVISION, comment |
| GET /businesses/:b/production | Scoped deadline/priority/status/assignment filters |
| POST /businesses/:b/jobs/:id/tracking-token | Authorized rotate/revoke; raw token disclosed only at generation |
| GET /track/:token | Minimal public DTO; digest lookup, expiry/revocation and rate limits |
| POST /businesses/:b/jobs/:id/payments | Positive amount, method/reference; manual entry; server ledger balance |
| POST /businesses/:b/payments/:id/reversals | Elevated permission, bounded amount, reason and idempotency |
| /businesses/:b/inventory; POST /inventory/:id/movements | Grant-based ledger operations; serialized stock check |
| GET /businesses/:b/dashboard and /reports/:report | Owner/report grants; business-local date boundaries |
| GET /businesses/:b/reports/:report.csv | Same permissions; escape CSV and neutralize formula cells |
| /businesses/:b/notifications; /push-subscriptions | Recipient-only access; CSRF-protected subscribe/unsubscribe |
| GET /businesses/:b/audit | Owner/audit grant, redacted pagination |
| POST /internal/outbox/dispatch | Authenticated scheduled service identity, no public invocation |

All paths except minimal tracking require a session; customer membership/ownership restrictions apply to shared routes. Never use route presence or frontend navigation as access control. Responses containing private records are Cache-Control: private, no-store.

Example proof decision payload: {action:"APPROVE", expectedVersion:3}. Server derives customer identity, records timestamp and pins the referenced proof bytes. It does not accept actorId, approvedFilePath or business overrides from the client.
