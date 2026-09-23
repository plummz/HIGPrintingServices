# PrintFlow

## Live website preview

[Open HIGP / PrintFlow](https://plummz.github.io/HIGPrintingServices/). GitHub Pages publishes the root `index.html` and `pages-assets/` using **main / (root)**. It provides the public service homepage and an interactive workspace preview. Business settings are saved only in the visitor's browser; reset clears them. No passwords, accounts, invitations or orders are submitted from this preview.

The preview uses native Web Animations and CSS for page entrances, staggered scroll reveals, card/button interactions and a replayable paper-feed illustration. Motion is optional: a persistent pause control and the device reduced-motion preference disable it. No animation library or CDN is required.

The Next.js application below remains the server-backed product. GitHub Pages cannot run its authentication or PostgreSQL APIs; those require a separate application host. The preview does not replace or weaken those controls. Keep the preview CSS aligned with `src/app/globals.css` when updating the application design. `_config.yml` excludes application source and documentation from the Pages output. The live-site workflow checks that deployment serves the homepage and its CSS/JavaScript.

A modular printing-business PWA in development. **Module 1 implements accounts and business workspaces.** Orders, quotations, proofing, production, payments, inventory and PWA installation remain scheduled modules; this is not the completed MVP.

See [Studio redesign, account persistence and Desktop setup](docs/STUDIO_AND_ACCOUNTS.md) for this update. Profile deletion is available in the secure app at `/account`; live registration still requires the hosting/database/email connection.

## What works

- Email/password registration, email verification, sign-in/out and password recovery through Better Auth.
- Business creation/settings, PHP currency and configurable timezone/contact details.
- OWNER, ADMIN, STAFF and CUSTOMER memberships with server-enforced tenant isolation.
- Owner-created, email-bound invitations with expiry, one-time acceptance and revocation.
- Configurable admin grants, immediate membership revocation and last-owner protection.
- Atomic business audit records, auth security events, rate limits, input validation, same-origin mutation checks and private/no-store responses.
- Responsive desktop/mobile workspace UI with real data and clear empty states.

## Requirements

Node.js 24 LTS, npm, PostgreSQL 17 (CI baseline), and SMTP for production email. The application has not been deployed. Do not use GitHub Pages for its server/database runtime.

For a quick storefront preview on Windows, double-click `Start-Preview.cmd`. On any platform with Node.js, run `npm run preview`. This serves only the public storefront on localhost, not authentication or the database.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env`, set `DATABASE_URL`, and generate a unique `BETTER_AUTH_SECRET` with `node -e "console.log(require('crypto').randomBytes(40).toString('base64url'))"`.
3. Set `BETTER_AUTH_URL=http://localhost:3000` and use `MAIL_TRANSPORT=file` only for local development.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Run `npm run dev` and open http://localhost:3000.
6. Register. Local verification/reset emails are JSON files in the private `.local/mail/` directory. Open the URL from your own message, then sign in and create a workspace. No default user/password is seeded.

For a development environment without a PostgreSQL installation, `npm run db:local` starts a loopback-only PGlite socket. Set `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres?connection_limit=1`. This fallback has different concurrency characteristics from native PostgreSQL and is **not** a production database. Keep its terminal running while migrating/developing. Prefer native PostgreSQL for realistic concurrency validation.

## Validation commands

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

Integration tests require `TEST_DATABASE_URL` pointing to a dedicated database whose name ends in `_test`; the documented local fallback port is also allowed. Apply migrations to that test database before testing. Tests create synthetic users/businesses and clean their own fixtures. Browser tests create synthetic development records and use the private file mail adapter. Never run these against production.

CI runs migrations, checks, native PostgreSQL integration tests, a production build, a production dependency audit and desktop/mobile browser flows. See [verification status](docs/MODULE_1.md) for results actually observed.

## Production preparation

Use `npm run build`, then `npm start`. Configure HTTPS, production SMTP, a strong auth secret, a private PostgreSQL connection and a trusted reverse proxy that overwrites the configured client-IP header. The app deliberately refuses production auth with local file mail or a non-HTTPS origin. Run `npm run db:cleanup` daily to remove expired rate-limit buckets, verification records and sessions. This script does not delete business audit history.

Full-page navigation after sign-in, sign-out and workspace changes is intentional: it discards client-side state rather than retaining a previous user's workspace. No service worker caches private data; installability is Module 7.

## Planning and implementation documents

- [Module 1 implementation and limitations](docs/MODULE_1.md)
- [Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md)
- [Database](docs/DATABASE.md) · [Security](docs/SECURITY.md)
- [API](docs/API.md) · [Workflow](docs/WORKFLOW.md)
- [Deployment](docs/DEPLOYMENT.md) · [Testing](docs/TESTING.md) · [Research](docs/CAPSTONE.md)

PrintFlow is business-neutral. HIGP can be demo data later. No customer artwork or production information is included. No license has been assigned; the repository owner should choose one before redistribution.
