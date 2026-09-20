# Architecture proposal
Status: awaiting approval; design only.

## Scope and decisions
Build a modular monolith: one Next.js application and one PostgreSQL database, with explicit domain modules. This keeps deployment and student maintenance manageable without sacrificing separation. No microservices initially. Business functionality belongs in server-side application services, not route handlers or React components.

Use the Node server runtime for Prisma, authentication and file operations. PostgreSQL owns durable records; private object storage owns artwork bytes. A small scheduled worker processes a transactional outbox for notifications, overdue checks and upload cleanup. Hosting must support both server execution and an authenticated scheduled invocation.

Browser -> route handler / server component -> authenticated request context -> permission policy -> domain service -> tenant-scoped repository -> PostgreSQL. File access also passes policy checks before the storage adapter. Server components call services directly; they need not make HTTP requests back to themselves. Both route handlers and any later server actions enforce the same policies.

## Proposed folders
| Path | Responsibility |
|---|---|
| src/app/(auth)/ | Login, recovery, invitations and verification |
| src/app/(workspace)/b/[businessId]/ | Dashboard, jobs, customers, production, inventory, payments, reports and settings |
| src/app/(customer)/portal/ | Verified customer orders, quotations, proof review and profile |
| src/app/track/[token]/ | Minimal read-only tracking |
| src/app/api/v1/ | Thin validated HTTP adapters |
| src/app/api/auth/ | Authentication library endpoints |
| src/app/manifest.ts | App manifest |
| src/components/ui/ | Shared accessible controls |
| src/components/layout/ | Desktop sidebar and compact mobile navigation |
| src/modules/<domain>/ | schemas, policy, service, repository, DTO and domain-specific UI |
| src/server/auth/ | Authentication integration and session verification |
| src/server/tenancy/ | Verified business context and tenant-scoped DB access |
| src/server/db/ | Prisma client and transaction helpers |
| src/server/storage/ | Local-private and S3-compatible implementations |
| src/server/notifications/ | In-app, browser-push and future delivery adapters |
| src/server/security/ | CSRF, rate limits, upload validation and error handling |
| src/server/audit/ | Redacted business/security event recording |
| src/server/worker/ | Outbox dispatcher and scheduled tasks |
| src/lib/ | Pure money, units, time and formatting helpers |
| prisma/ | schema, migrations and explicit demo seed |
| public/icons/; public/offline.html; public/sw.js | Public PWA assets only |
| tests/unit/; tests/integration/; tests/e2e/ | Domain, real DB and browser checks |
| docs/ | Architecture, database, security, API, deployment, testing and capstone |
| .github/workflows/ | CI after implementation approval |

Domain modules: businesses, memberships, customers, catalog, pricing, orders, quotations, jobs, files, proofs, production, payments, inventory, tracking, notifications, reports.

Root configuration will include package.json, lockfile, TypeScript/Next/Tailwind configuration, .gitignore and placeholder-only .env.example. No credentials or production customer material belong in GitHub.

## Dependency rationale
Next.js/React provide UI and server entry points; Tailwind provides consistent responsive styling; Prisma gives typed database access and migrations; a maintained authentication library handles credentials, hashing, sessions and reset tokens. Zod is proposed for runtime input validation; decimal arithmetic for deterministic prices; an S3 SDK for the storage adapter; signature detection for upload validation; a QR encoder for tracking links. Vitest and Playwright cover domain and browser behavior. Add each only in its relevant module; verify compatibility and security advisories then pin versions.

Authentication library selection is a Module 1 gate: it must support PostgreSQL/Prisma, secure sessions, password reset, email verification and session revocation. Do not hand-roll these primitives.

## UI boundaries
Owner/admin navigation: dashboard, orders, jobs, customers, production, inventory, payments, reports, notifications, settings. Staff sees assigned jobs and permitted operations. Customer sees only their own orders and decisions. Navigation visibility improves usability but grants no authorization.

Use mobile-first forms, readable status chips, explicit errors, empty states, loading states and confirmation for irreversible decisions. A job detail screen contains specification, commercial summary, artwork, versioned proofs and timeline. Label all manually recorded payments accordingly. Never display fabricated operational metrics.

## Source guidance
Authorization close to data access and limited DTOs are informed by the [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication). Tenant context and isolation testing follow the [OWASP multi-tenant guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html). Detailed decisions here are proposed PrintFlow design choices, not claims that controls are implemented.
