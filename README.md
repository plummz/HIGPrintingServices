# PrintFlow
A proposed multi-business printing workflow PWA. HIGP Printing Services is the initial demo business, not a hard-coded platform identity.

## Current status
Architecture proposal only. Repository inspected on 2026-09-20 and found empty. No application, database migrations, authentication, or deployment has been implemented. The user's supplied specification requires approval before the first major implementation module.

## Planning documents
- [Architecture and folder structure](docs/ARCHITECTURE.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [PostgreSQL / Prisma model design](docs/DATABASE.md)
- [Security and role permissions](docs/SECURITY.md)
- [Workflow transitions](docs/WORKFLOW.md)
- [API contracts](docs/API.md)
- [Deployment, environment and PWA](docs/DEPLOYMENT.md)
- [Testing strategy](docs/TESTING.md)
- [Research metrics](docs/CAPSTONE.md)

## Proposed stack
Next.js App Router, TypeScript, React, Tailwind CSS, PostgreSQL and Prisma, with mature library-managed authentication and private local/S3-compatible storage adapters. Exact compatible versions and authentication library are selected and pinned during the approved foundation module.

## Setup
There is no runnable application yet. Installation, database, seed, development, lint, typecheck, test and build commands will be documented and verified as the foundation is implemented. Do not treat this proposal as production-ready software.

## Next approval
Approve Module 1: application foundation, authentication, tenant membership, role checks, business setup and security tests. See the roadmap for acceptance criteria. No license is assigned by this proposal; the repository owner should choose one before redistribution.
