# Hobbes — Agent Instructions

Shared guidance for Zed and GitHub OpenCode. Work within the user's requested scope; research and review do not authorize edits. Do not create branches, commit, push, or publish without authorization.

## Do the minimum complete work

- Understand the requested outcome and trace the affected sources before editing. Reuse existing documents, helpers, and patterns before creating anything.
- For code: no build if unnecessary → existing code → standard library → native platform → installed dependency → minimum readable code. No speculative scaffolding, avoidable dependencies, or unrelated refactors. Inspect callers and fix shared causes.
- For documents: edit the canonical source and affected references, not a parallel copy. A small correction does not require a new map, review package, or SOP. Link supporting rationale; keep the instructions an operator needs at the point of action.
- Never shorten away validation, accessibility, security, privacy, data-loss protection, consequential failure handling, or explicitly requested detail. Prefer readable direct work over one-liners or deletion quotas.

For an explicitly requested code over-engineering review, read
[complexity-review](skills/complexity-review/SKILL.md). It reports
suggestions only; process redesign still uses the skills below.

## Business-process work

Read the [Process Documentation Guide](../TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md) for locations, evidence, status, approval, and retention rules. Load only the relevant skill:

- `elon-algorithm`: material process design or improvement; challenge → delete → simplify → accelerate → automate last.
- `process-mapping`: the requested current-state or future-state map, not an automatic full redesign.
- `process-docs`: an executable SOP, runbook, or playbook; reuse established analysis.

Canonical skills live in `everything-is-computer/skills/<name>/SKILL.md` (repository-relative). Explicitly load this instruction file and the relevant canonical skill when starting work; root discovery entry points are not provided. Maintain each procedure only in its canonical file and resolve its reference paths relative to that file.

Verify material owners, metrics, obligations, and approvals against cited sources. Flag contradictions; never invent a resolution. Preserve raw evidence and decision history, and label assumptions and proposed changes. Only the accountable human can approve a process.

## Website and validation

[web/README.md](web/README.md) covers the static Next.js knowledge site. `everything-is-computer/web/lib/content.ts` owns public content discovery and links. Preserve its allowlist, existing document paths/URLs, and privacy boundaries. Source documents in the allowlist are public regardless of an `internal` metadata label.

For document changes, check source claims, links, status, and affected references; request an operator walkthrough where execution needs validation. For web behavior, add focused coverage in the existing suites and run from `everything-is-computer/web/`: `npm test`, `npm run build`, `npm run typecheck`, then `npm run test:e2e` (see README prerequisites). Do not introduce a test framework for this guidance.

Finish with a brief summary, checks actually run, and unresolved items. Never claim approval, testing, or live skill discovery that was not verified.
