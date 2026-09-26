<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PrintFlow project context

- This repository has two separate products. GitHub Pages publishes the public preview from root `index.html`, `account.html`, and `pages-assets/`. The server-backed Next.js app lives in `src/` and uses Better Auth, Prisma, and PostgreSQL; GitHub Pages does not run it.
- The Pages account flow uses Supabase Auth, `web-auth/`, and `supabase/functions/delete-account/`. It is separate from the Next.js account system. Identify which system a change affects before editing either one.
- Keep public preview styling aligned with `src/app/globals.css` where the designs overlap. `web-auth/account.js` is the source for the bundled `pages-assets/account.js`; run `npm run build:accounts` after changing it.
- Read the relevant `docs/` file before changing behavior. In particular, use `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/TESTING.md`, and `docs/SUPABASE_ACCOUNTS.md` for their respective areas.

## Working rules

- Use the main session to implement changes. For substantive code changes, have a verifier run relevant automated checks, a QA tester check user journeys in a safe environment, and a reviewer inspect the diff before reporting completion. Record PASS, FAIL, or NOT RUN for each gate; findings return to the implementer for resolution.
- Specialist roles in `.claude/agents/` and `.agents/skills/` are advisory. Use work-intake and program-manager to route tasks; use research, design, commerce, and money roles only when the task needs them. The main session owns file edits and passes a concrete handoff between roles.
- Every specialist checks completeness, evidence, and security/privacy impact before handoff. Domain heads review their specialists' work and either accept it, return it for rework, or escalate a documented risk. The verifier checks build and automated gates; the QA tester checks user journeys and failure paths in safe environments; the reviewer inspects the diff. The program manager checks that all findings and decisions are recorded.
- Each handoff to the program manager includes the risk, likely impact, mitigation, owner, and unresolved decision. The program manager maintains the consolidated view of scope, status, dependencies, dates, quality evidence, and security risks; it does not treat an unverified claim as a completed task.
- For an assigned 3D garment task, the creative-tools coordinator and shirt 3D artist may write draft assets only under ignored `.local/agent-renders/`. The main session reviews any export before it enters the public repository. Use the actual garment size chart and licensed model/artwork; a render is illustrative and does not prove physical fit. See `design/3d/README.md`.
- Mark product capabilities Current, Planned, or Deferred using repository evidence. Modules beyond the implemented account/workspace foundation are planned; do not present orders, production, or payments as live.
- Use the scripts in `package.json`: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run integration and browser tests when the change warrants them, following the commands and database safeguards in `README.md` plus the coverage guidance in `docs/TESTING.md`.
- Run integration tests only with `TEST_DATABASE_URL` pointing to a dedicated `_test` database or the documented local PGlite port, as specified in `README.md`. Browser tests use `DATABASE_URL` through `next dev`; verify that it points to a local or disposable development database before running them. Check the target before any migration; never use production credentials for development checks.
- Protect tenant isolation, role and membership checks, invitation rules, audit records, and the last-owner guard. Review changes under `src/server/`, `src/app/api/`, `prisma/`, `supabase/`, `web-auth/`, and `account.html` for cross-business data access and authentication regressions.
- Keep secrets and service-role keys out of the repository and browser assets. Do not claim the Pages preview provides server-backed features or that either account system is production-ready unless its documented activation checks have passed.
- Report the changed surface, checks actually run, unresolved findings, and deployment implications. See `docs/AI_AGENTS.md` for the agent roles and handoff format.
