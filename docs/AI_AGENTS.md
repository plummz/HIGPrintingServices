# Coding and product agents

The main Claude Code or Codex session owns implementation and file changes. Specialists are available on demand for a bounded task; most tasks need only a few roles. Claude can run the role files below as subagents; Codex uses the matching skills in its main session. All role files are committed with the repository.

`AGENTS.md` is the shared project rule file. `CLAUDE.md` imports it for Claude Code. The [task board](AGENT_TASKS.md) records owners, status, dependencies, and any dates the user has set. The [agent map](agent-map.jpg) shows the handoff flow.

The UX researcher uses the [customer insights report](CUSTOMER_INSIGHTS.md) to summarize every approved request in the supplied date range, with category counts and coverage limits. The current site does not provide live order data, so that report begins with no measured request frequency. The UX design head checks visual work against actual screenshots for margins, spacing, alignment, color, layout, responsive behavior, and accessibility before sign-off.

| Role                       | Claude subagent                                | Codex skill                                          | Main output                                   |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Work intake                | `.claude/agents/work-intake.md`                | `.agents/skills/work-intake/SKILL.md`                | Scoped task and acceptance criteria           |
| Customer input             | `.claude/agents/customer-input.md`             | `.agents/skills/customer-input/SKILL.md`             | Anonymized feedback themes                    |
| Progress tracker           | `.claude/agents/progress-tracker.md`           | `.agents/skills/progress-tracker/SKILL.md`           | Evidence-based website and roadmap status     |
| Program manager            | `.claude/agents/program-manager.md`            | `.agents/skills/program-manager/SKILL.md`            | Task order, owners, blockers, due-date review |
| Commerce flow              | `.claude/agents/commerce-flow.md`              | `.agents/skills/commerce-flow/SKILL.md`              | Planned payment and income flow               |
| Money specialist           | `.claude/agents/money.md`                      | `.agents/skills/money/SKILL.md`                      | Independent money-control review              |
| UX researcher              | `.claude/agents/ux-researcher.md`              | `.agents/skills/ux-researcher/SKILL.md`              | Research plan or evidence-backed findings     |
| UX writer                  | `.claude/agents/ux-writer.md`                  | `.agents/skills/ux-writer/SKILL.md`                  | Interface copy table                          |
| UX designer                | `.claude/agents/ux-designer.md`                | `.agents/skills/ux-designer/SKILL.md`                | User flows and page structure                 |
| Interaction designer       | `.claude/agents/interaction-designer.md`       | `.agents/skills/interaction-designer/SKILL.md`       | State and accessibility specification         |
| Visual designer            | `.claude/agents/visual-designer.md`            | `.agents/skills/visual-designer/SKILL.md`            | Visual-system guidance                        |
| Motion designer            | `.claude/agents/motion-designer.md`            | `.agents/skills/motion-designer/SKILL.md`            | Motion and reduced-motion specification       |
| UX engineer                | `.claude/agents/ux-engineer.md`                | `.agents/skills/ux-engineer/SKILL.md`                | File-level implementation plan                |
| Production designer        | `.claude/agents/production-designer.md`        | `.agents/skills/production-designer/SKILL.md`        | Print/artwork production specification        |
| Creative tools coordinator | `.claude/agents/creative-tools-coordinator.md` | `.agents/skills/creative-tools-coordinator/SKILL.md` | App and artifact handoff plan                 |
| Shirt 3D artist            | `.claude/agents/shirt-3d-artist.md`            | `.agents/skills/shirt-3d-artist/SKILL.md`            | Size-variant scene plan and measurement needs |
| Fit/size reviewer          | `.claude/agents/fit-size-reviewer.md`          | `.agents/skills/fit-size-reviewer/SKILL.md`          | Per-size accuracy and placement review        |
| Verifier                   | `.claude/agents/verifier.md`                   | `.agents/skills/verify/SKILL.md`                     | Observed checks and gaps                      |
| QA tester                  | `.claude/agents/qa-tester.md`                  | `.agents/skills/qa-tester/SKILL.md`                  | Scenario results and reproducible defects     |
| Reviewer                   | `.claude/agents/reviewer.md`                   | `.agents/skills/review-diff/SKILL.md`                | Ranked, actionable findings                   |

## Handoffs

The program manager is the executive coordinator: it keeps a complete, evidence-based view of scope, owners, dates, dependencies, quality, and security risks. Work intake leads operations input; UX designer leads research, writing, interaction, visual, motion, and production design; commerce flow leads the money specialist; creative-tools coordinator leads the shirt 3D artist and fit/size reviewer; UX engineer leads the technical handoff to the main implementer. A head checks its own work and each specialist's output before accepting it. The main implementer owns code changes, while verifier, QA tester, and reviewer provide independent checks.

The quality gate has three passes: each specialist checks completeness, evidence, and risks; its head checks dependent work; verifier and QA tester check the implementation; reviewer inspects the resulting diff and evidence. The program manager checks that all findings have an owner and disposition before the main session marks a task Done. Critical checks must pass. A target such as “95% flawless” is an aspiration, not a measured guarantee; report actual test and review evidence instead.

- **New request:** work-intake → program-manager → relevant specialists and their heads → main implementer → verifier → QA tester → reviewer → progress-tracker → program-manager.
- **Customer feedback:** customer-input → work-intake review → ux-researcher → ux-writer and ux-designer → interaction, visual, or motion designer as needed → ux-designer review → ux-engineer → main implementer. If code changes, continue through verifier → QA tester → reviewer → progress-tracker → program-manager; otherwise return the research report to program-manager.
- **Payment or income design:** work-intake → program-manager → commerce-flow → money specialist → commerce-flow review → main implementer. If code changes, continue through verifier → QA tester → reviewer → progress-tracker → program-manager; otherwise return the design and risks to program-manager. The reviewer receives the money specialist's findings and the commerce head's disposition when reviewing code.
- **Print artwork:** production-designer joins when artwork specifications or site assets are in scope.
- **3D shirt request:** work-intake → production-designer and creative-tools coordinator → shirt 3D artist → fit/size reviewer → creative-tools coordinator review → UX design head review → main session approves any public export. Blender handles the scene and still renders; Godot is optional for an interactive prototype. See `design/3d/README.md`.

Each handoff states **goal, affected surface, Current/Planned/Deferred status, evidence, proposed output, acceptance criteria, owner, due date if supplied, blockers, security/privacy risks, mitigation, and open questions**. Give the reviewer actual diff text and changed files; its Claude subagent has no shell tool. Specialists do not edit source files, contact customers, record payments, deploy, or change remote services. The main session updates the task board and resolves findings.

For a task in another IDE, open this repository and give its assistant `AGENTS.md` and the relevant `docs/` files as context. Antigravity's Gemini integration has its own agent behavior; these Claude and Codex role files are not automatically loaded by that IDE.
