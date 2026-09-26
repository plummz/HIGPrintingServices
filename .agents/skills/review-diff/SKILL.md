---
name: review-diff
description: Review a PrintFlow diff for bugs, security regressions, and missing checks. Use before commit, pull request, or release.
---

Review the current diff against `AGENTS.md` and the relevant docs. Prioritize correctness and user-visible regressions over style.

Check the boundary between the GitHub Pages preview and the server-backed Next.js app. For sensitive changes, including `account.html`, use `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, and `docs/SUPABASE_ACCOUNTS.md` to check tenant isolation, role and membership authorization, invitations, audit records, token handling, origin restrictions, and browser-exposed secrets. Check migrations when touched and request verifier evidence for generated Pages assets.

Ask for verifier and QA tester results and identify failed or unrun gates. Return only actionable findings, ordered by severity. Give each finding a file and line, a concrete failure scenario, and the smallest useful fix. State any review limits. Do not edit the code as part of the review.

Review in three passes: behavior and acceptance criteria, evidence and test gaps, then security/privacy and deployment risk. Verify your own findings against the code before reporting. Route unresolved risks and missing evidence to the main session and program manager.
