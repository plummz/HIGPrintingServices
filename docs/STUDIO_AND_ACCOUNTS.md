# HIGP studio redesign and account persistence

## What this update delivers

The GitHub Pages storefront now has an original navy/cream/coral visual system, original SVG product illustrations, a floating product composition, service filters, accessible product dialogs, a process section, FAQs, motion controls and responsive layouts. The product artwork is illustrative, not photographs of completed HIGP jobs. No third-party image or icon dependencies were added.

`pages-assets/config.js` holds only the public HTTPS origin of the separately hosted account app. Until that origin is configured, login/register buttons explain the pending connection and never collect a password. Once configured, visitors navigate to the secure app's own `/login` or `/register` page; credentials are not sent from GitHub Pages or stored in localStorage.

## Accounts

The Next.js app uses Better Auth and PostgreSQL. `User` and credential records have no account-expiration field. Expiring sessions, signing out, changing devices or deploying a new app build does not delete an account. The daily cleanup script deletes only expired sessions/verification records and old rate-limit buckets.

`/account` provides self-service profile deletion through `DELETE /api/v1/account`. It requires an authenticated verified user, same origin, current password, exact `DELETE` confirmation, strict input validation and rate limiting. Password verification uses Better Auth's implementation. A serializable transaction protects memberships and last-owner checks. The operation removes the user's credentials, all sessions, memberships and invitations addressed to or created by that user. Business event history is retained with the actor marked `deleted-user`; shared business settings and other business records remain. The last active owner must add another owner first. Database backups age out according to the hosting provider's retention policy.

## Hosting still required

GitHub Pages cannot execute the Next.js authentication/database server. No production database or SMTP credentials have been provisioned by this update. `deploy/render.yaml` is a concrete deployment proposal using separate app and PostgreSQL resources, private database network access, migration deployment and generated auth secret. Applying it incurs provider charges; confirm current costs before applying. No resource has been purchased or created automatically.

To activate accounts:

1. Connect the hosting provider and create the app/database from the reviewed deployment configuration.
2. Set `BETTER_AUTH_URL` to the app's actual HTTPS origin and enter SMTP settings in the provider's private environment settings. Verify the proxy overwrites the configured client-IP header.
3. Enable managed database backups, document retention, and test restoration into a separate database. Keep a separate protected backup copy. Do not use a disposable/expiring test database for live accounts.
4. Verify signup, email delivery, verification, login, logout, password reset, and persistence after an app restart. Verify profile deletion with a synthetic account.
5. Set `appUrl` in `pages-assets/config.js` to that verified origin (for example `https://your-verified-app.example`, without a path). Bump the config asset version in `index.html` and publish.

There is no honest unconditional "forever" storage guarantee. Account retention depends on maintaining the hosting service, its database, and restorable backups. The application does not automatically expire users.

## Desktop source copy

The requested folder name is exactly **HIGPringting WEB**. With Remote Desktop Commander online, clone the main branch into that folder on the user's actual Windows Desktop. `scripts/Install-Desktop.ps1` performs the same copy and stops if a nonempty folder already exists. It includes all tracked source, SVG artwork, tests, migrations, documentation and dependency lockfiles; it intentionally excludes secrets, customer data and generated dependencies. Double-click `Start-Preview.cmd` to open the local storefront at `http://127.0.0.1:5173` using Node.js; this needs no npm install. Close its terminal to stop it. The secure app uses the separate setup in README. After installing Git, use normal commits/pulls to keep a cloned Desktop copy in sync; ZIP copies must be updated carefully without overwriting local edits.

## References

- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Next.js static export limitations](https://nextjs.org/docs/app/guides/static-exports#unsupported-features)
- Better Auth's installed password verification implementation and Prisma transaction API.
