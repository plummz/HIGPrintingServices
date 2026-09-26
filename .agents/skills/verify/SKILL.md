---
name: verify
description: Verify PrintFlow code changes with relevant repository checks and report observed results. Use after implementation or before a pull request.
---

Read `AGENTS.md`, the commands and database safeguards in `README.md`, and the coverage guidance in `docs/TESTING.md`. Identify whether the change affects the Pages preview, Next.js app, database, or Supabase account flow.

Run only relevant checks from `package.json`, normally choosing among `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. For `web-auth/account.js` changes, generate a temporary esbuild output with the arguments in `build:accounts` and compare it with `pages-assets/account.js`; do not overwrite the tracked asset. For Pages smoke checks, start `npm run preview` in the background, request `/`, `/account.html`, and a changed asset, then stop it.

Run integration tests only after confirming `TEST_DATABASE_URL` is a dedicated `_test` database or the documented local PGlite port in `README.md`. Browser tests use `DATABASE_URL`, so verify it is local or disposable before running them. Before any Pages Supabase account test, inspect `pages-assets/config.js` and confirm `supabaseUrl` and its project ref are local or disposable; otherwise report NOT RUN. If migrations are missing, report integration tests as NOT RUN and ask the main session to set up the database. Never aim checks at production or use this skill to deploy or alter remote services.

Report each command as PASS, FAIL, or NOT RUN with the reason, the first useful failure output, and what remains unverified. Do not hide failures behind a summary.

Record `git status --short` before and after commands. A build or dev server may alter tracked files; report any such change to the main session and do not discard it yourself.

Before handoff, check command selection, actual exit results, and security/privacy implications of skipped checks. Pass failures and risks to the main session and program manager. Do not infer a numeric quality rate.
