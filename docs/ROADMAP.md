# MVP implementation roadmap

Status: Module 1 approved and implemented for validation. See [MODULE_1.md](MODULE_1.md). Subsequent modules remain planned.

| Module                             | Complete increment                                                                                                                                | Exit criteria                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Planning                       | Architecture, data model, roles, transitions, API, environment and PWA strategy                                                                   | User reviews this proposal                                                                                                                |
| 1 — Foundation and identity        | Next/TS/Tailwind scaffold, PostgreSQL/Prisma, mature auth, invitations/recovery, business setup, memberships, authorization, audit foundation, CI | Sign in/out/reset; two-tenant negative tests; revoked memberships denied; owner cannot remove last owner; lint/typecheck/tests/build pass |
| 2 — Customers, catalog and pricing | Customer CRUD/search, configurable services/add-ons, supported pricing methods and tier rules                                                     | Tenant and field permission tests; server money/unit calculation tests; unconfigured prices require quotation                             |
| 3 — Orders, quotations and jobs    | Requests, immutable quotation versions, customer accept/change/decline, unique job numbers and printable job ticket                               | Expired/stale quotes rejected; concurrent acceptance creates one job; browser totals ignored; snapshots preserved                         |
| 4 — Private artwork and proofing   | Validated uploads, private retrieval, immutable proof versions, verified customer approval/revision                                               | Cross-customer access denied; stale proof approval conflicts; concurrent decisions safe; exact approved bytes pinned                      |
| 5 — Production and tracking        | Enforced state machine, filtered board, assignment/deadlines, history and QR tracking with rotation                                               | Cannot print unapproved artwork; assigned staff scope; QR cannot approve or expose private data                                           |
| 6 — Payments and inventory         | Manual payment/reversal ledger, balance calculation, inventory movement ledger and atomic consumption                                             | Duplicate retries harmless; concurrent payments/stock safe; refund and adjustment permissions tested                                      |
| 7 — Operations and installability  | Dashboard, date-filtered reports/CSV, in-app and browser notifications, manifest/icons/SW/offline fallback                                        | Correct tenant-local dates; no private caches; mobile end-to-end test; CSV neutralizes formulas; notification retry tests                 |
| 8 — Release readiness              | Security review, deployment/runbooks, backup restore exercise, demo data separation, accessibility and pilot                                      | Full customer-to-claim flow; no unresolved high/critical findings; HTTPS and storage settings verified                                    |

At each module: inspect current repo, identify changed files, explain dependencies, implement one complete increment, run lint/typecheck/relevant tests/build, fix failures, review security and update docs. Do not rewrite working modules. Do not describe unimplemented placeholders as finished.

MVP means all Modules 1–8 pass acceptance. A scaffold or attractive dashboard alone is not an MVP. Scope is substantial; no fixed completion date is promised.

## After MVP reliability

Add explainable scheduling recommendations based on deadline slack, production duration, priority, workload, required stages and machine availability. Store recommendation inputs, score reasons and manual overrides; do not call heuristic scoring AI. This is the advanced capstone phase, not an initial module.

## Explicitly deferred

Native Android, provider payment APIs, accounting, Messenger, AI extraction, machine IoT, ML forecasting, nesting, delivery tracking, enterprise branches, supplier marketplace, customer e-commerce storefront and payroll. A customer request portal is in scope; a shopping storefront is not.

## Approved first module

Module 1 creates the actual application/configuration, Prisma identity/business migrations, auth integration, tenant context, business setup UI, server permission policies, audit primitives and tests. It will not fabricate jobs or operational totals to imply completed downstream modules.
