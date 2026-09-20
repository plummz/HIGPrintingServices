# Deployment, PWA and environment proposal
No application has been deployed.

## Hosting
Use a Next.js-compatible Node host, managed PostgreSQL and private S3-compatible object storage. GitHub is source control; GitHub Pages alone cannot run the proposed authenticated server/database application. A local-private storage adapter is for development on persistent disk, not ephemeral serverless production storage.

Use separate development, test, staging and production databases/buckets. Run migrations with a deployment identity and restrictive runtime DB credentials. Back up DB and objects, test restoration and verify private bucket access. Production requires real auth email delivery for verification/reset; preview mail is development-only.

Choose versions and provider limits during Module 1; enforce a lockfile. No claim that a specific commercial hosting plan meets the requirements has been made.

## Environment contract
These are proposed application-owned names; authentication-library-specific names will be reconciled during integration. Only placeholders go into .env.example.

| Variable | Purpose / requirement |
|---|---|
| NODE_ENV | Runtime mode |
| APP_URL | Canonical HTTPS origin in production |
| DATABASE_URL | Runtime PostgreSQL connection (secret) |
| DIRECT_DATABASE_URL | Migration connection when pooling requires it (secret) |
| AUTH_SECRET | High-entropy auth-library secret; generated outside source control |
| AUTH_BASE_URL | Canonical auth origin, if required by selected library |
| EMAIL_TRANSPORT | SMTP in production; preview only for development |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM | Verification/reset delivery; credentials secret |
| STORAGE_DRIVER | local or s3 |
| STORAGE_LOCAL_ROOT | Private development directory outside public/ |
| S3_ENDPOINT, S3_REGION, S3_BUCKET | Production private object store |
| S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY | Least-privilege server-only credentials |
| S3_FORCE_PATH_STYLE | Adapter compatibility setting where necessary |
| MAX_UPLOAD_BYTES | Proposed default 20971520; enforce at upload and finalize |
| RATE_LIMIT_STORE_URL | Shared production rate-limit backend; secret if credentialed |
| WORKER_SECRET | Authenticate scheduled invocations |
| VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT | Browser push; private key server-only |
| MALWARE_SCANNER_URL | Private scanner adapter endpoint for production file pipeline |
| LOG_LEVEL | Redacted operational logging |
| DEMO_SEED_ENABLED | false by default; refuse production demo seed |

Do not use NEXT_PUBLIC_ for secrets. Expose only specifically allowed public configuration through explicit DTOs. Business currency, identity, timezone, hours, pricing and deposit policy belong in database configuration, not environment variables.

## PWA strategy
Manifest: stable id, PrintFlow name, standalone display, scope/start URL, theme/background, 192 and 512 PNG icons including maskable variant. Icons are static platform assets; business logos are separately authorized configuration.

Service worker cache is an explicit allowlist: public icons, static versioned CSS/JS and a generic offline page. Network-only for authentication, API data, customer/administrative HTML, React server-component payloads, quotations, proofs, private files and tracking. Do not cache all navigation responses or arbitrary same-origin GETs.

Offline opens a generic explanation and retry control. No offline payment posting, proof approval, background replay or sensitive form persistence in MVP. Show pending/failed submission honestly; never claim a mutation succeeded offline. Clear obsolete static caches at activation and client in-memory private state on logout/business switch.

Push requires explicit opt-in and browser support. Payload is generic (for example, "Your order has an update"), not artwork, price or customer PII. Opening notification requires authentication. In-app notifications remain available when browser push is unsupported.

Validate installation and update behavior on actual target phone browsers; document platform limitations. HTTPS is required in production. PWA installability is a Module 7 acceptance gate, not yet implemented.
