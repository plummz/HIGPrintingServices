# Agent task board

This board tracks assigned work in the PrintFlow repository. Roles run when invoked; a listed role does not imply that a background process is active. Dates come from the user or an agreed project schedule, never from agent guesses.

| ID       | Owner            | Task                                          | Module / surface | Status | Due | Risk                          | Blocked by / next action           |
| -------- | ---------------- | --------------------------------------------- | ---------------- | ------ | --- | ----------------------------- | ---------------------------------- |
| SETUP-01 | Main implementer | Clone GitHub into the Desktop project folder  | Repository       | Done   | —   | None identified               | Keep working in the clone          |
| SETUP-02 | Main implementer | Add shared rules and specialist role files    | Agent setup      | Done   | —   | Incorrect role guidance       | Maintain as roles evolve           |
| SETUP-03 | Verifier         | Validate agent files, links, and hub image    | Agent setup      | Done   | —   | Broken links or invalid files | 20 role pairs and 47 links checked |
| SETUP-04 | Reviewer         | Review role boundaries and project facts      | Agent setup      | Done   | —   | Unsupported product claims    | Claude findings addressed          |
| SETUP-05 | Main implementer | Publish the agent setup to GitHub             | Repository       | Done   | —   | Publish failure               | Verify remote after push           |
| SETUP-06 | Main implementer | Check the local hub, map, and website preview | Agent setup      | Done   | —   | Broken user-facing navigation | Preview routes returned HTTP 200   |

No application feature task is assigned yet. The public Pages preview, prepared Supabase account flow, and separate Next.js account/workspace app are described in `README.md`; later order, production, and payment modules remain planned.

## New task template

| ID       | Owner            | Task                                     | Module / surface                            | Status | Due                     | Risk                            | Blocked by / next action |
| -------- | ---------------- | ---------------------------------------- | ------------------------------------------- | ------ | ----------------------- | ------------------------------- | ------------------------ |
| TASK-### | Named main owner | Specific outcome and acceptance criteria | Pages / Next.js / Supabase / planned module | To do  | User-supplied date or — | Risk, impact, mitigation, owner | First concrete step      |

The program manager proposes changes to this board. The main session records accepted changes and checks verifier, QA, and reviewer evidence before marking a code task Done. A skipped QA scenario must be marked Not run, never Passed.
