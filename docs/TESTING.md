# Planned verification

> Module 1 is now implemented. This document also describes future modules; see [MODULE_1.md](MODULE_1.md) for implemented scope, validation and limitations.

Module 1 now has runnable unit, integration and browser tests, linting, TypeScript checking and a production build. MODULE_1.md records observed results. The table below also includes checks for future modules.

## Module gates

Each code module must pass lint, TypeScript checking, relevant unit/integration tests and a production build. Final release also requires browser end-to-end checks, dependency review and a manual security/accessibility review.

| Area           | Required positive and negative cases                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | Valid login/logout; wrong credentials; reset expiry/replay; verified identity; revoked session                                        |
| Roles          | Owner/admin/staff/customer matrix; last-owner protection; no self-elevation/mass assignment                                           |
| Tenancy        | Business A cannot read/update/delete/export/link B resources, including guessed UUIDs; pooled concurrent requests do not leak context |
| Customer scope | One customer cannot access another's files, quotes, payments or proofs within the same business                                       |
| Pricing        | Every method, exact area conversion, tier boundaries, discounts/tax rounding, invalid dimensions; manipulated browser total ignored   |
| Job acceptance | Expired/stale quote denied; concurrent acceptance creates one job; collision-free job numbers                                         |
| Proofs         | Versions preserved; stale decision denied; approved bytes immutable; simultaneous approval/revision has one winner                    |
| Workflow       | Every permitted edge; invalid skip denied; all required job-item approvals checked; terminal states protected                         |
| Tracking       | Random tokens; digest-only persistence; revoked/expired token denied; no approval/file access or internal DTO fields                  |
| Payments       | Duplicate retry; overpayment rejected; bounded refund; competing transactions; audit rollback                                         |
| Inventory      | Movement + quantity atomic; negative stock prevention; retries; same-tenant FK validation                                             |
| Files          | Size/signature/MIME mismatch, traversal names, decompression limits, quarantine, unauthorized download and orphan cleanup             |
| Notifications  | Outbox dedupe, retry, recipient isolation, no private push payload                                                                    |
| Reports        | Tenant-local date ranges, ledger reconciliation, CSV injection neutralization                                                         |
| PWA            | Install/mobile layout, offline fallback, no private HTML/API/RSC/artwork caches, logout and tenant switch                             |
| Recovery       | Backups restored in isolated environment; private storage remains private                                                             |

Integration tests use real disposable PostgreSQL, not SQLite approximations, and two businesses with two customers each. Run concurrency tests with independent transactions. Storage integration uses an isolated private adapter/bucket. Email uses a test transport. Seed data must be synthetic and explicitly labelled.

Release scenario: customer requests -> staff quotes -> customer accepts -> deposit recorded -> artwork/proof -> revision -> exact version approved -> production -> QC -> pickup -> remaining payment -> completed. Verify customer-visible tracking and owner ledger/report totals at each stage.
