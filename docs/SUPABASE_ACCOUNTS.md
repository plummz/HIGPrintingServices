# Supabase Auth + GitHub Pages

The selected replacement for Railway is Supabase Auth. The existing Next.js/Better Auth application remains in source as a separate implementation; its workspaces and credentials are not automatically migrated or connected to Supabase. The GitHub Pages workspace remains a demo.

## Prepared implementation

- `account.html` and `web-auth/account.js`: signup, email confirmation, login, password reset, logout, and profile deletion. Uses the pinned official Supabase client, bundled locally with `npm run build:accounts`.
- Accounts and display-name metadata live in Supabase Auth's PostgreSQL database. There are no public application tables or anonymous data grants. Passwords are managed by Supabase.
- Browser sessions use the official SDK with localStorage and PKCE. Only session tokens are persisted in the browser, never passwords. Email confirmation/reset links must open in the same browser that requested them. Accounts remain in the database independently of browser storage.
- `supabase/functions/delete-account/index.ts`: server-side deletion validates the bearer token with Auth, verifies email confirmation and current password, derives the target ID from the authenticated user, and deletes only that user. The admin key stays exclusively in the Edge Function. No ID from the browser is accepted. Deploy this function before activating the public account buttons.

## Activation gate (not completed)

1. Connect Supabase and select/create the HIGP project; review any costs first.
2. Enable email/password authentication, confirmed email, minimum password length 12, appropriate Auth rate limits, and production email delivery using a verified sender domain and custom SMTP (for example Resend). Supabase's default sender is for testing, not public customer signup.
3. Set Site URL and exact allowed redirect to `https://plummz.github.io/HIGPrintingServices/account.html`. Do not add wildcard redirect origins.
4. Deploy the `delete-account` Edge Function. Keep gateway JWT validation enabled. It also performs server-side token validation. The allowed browser Origin is `https://plummz.github.io`.
5. Put only the project HTTPS URL and public publishable/anon key in `pages-assets/config.js`. Do not publish service-role, secret, SMTP, or database credentials. Keep `supabaseReady: false` until real tests pass.
6. Test confirmation, login after logout/reload, reset email and password update, wrong-password deletion rejection, deletion of a synthetic account, and inability to sign in afterward. Verify account retention independently of browser session storage.
7. Review database backup/restore and hosting retention. Free projects can pause; this is not a promise of perpetual storage.
8. Set `supabaseReady: true`, bump config/JavaScript cache versions and publish. Public buttons then navigate to `account.html` instead of the pending connection dialog.

Future orders, files and business membership require a separate database migration with row-level access rules and corresponding server authorization. Never connect the old demo workspace to private customer data without those controls.
