---
name: complexity-review
description: Review Hobbes website code for unnecessary complexity when explicitly asked for an over-engineering or simplification review. Report evidence-backed suggestions only; process redesign uses the existing process skills.
---

# Complexity review

Use only for an explicitly requested code-complexity review. Read the repository's
[shared instructions](../../AGENTS.md) and [website README](../../web/README.md) first. Review the requested diff or files; scan the
whole repo only when asked. Do not edit, install packages, or perform repository
write operations. Do not turn document corrections into process redesign; use the
canonical process skills only when that work is requested.

## Review

- Trace behavior and callers before suggesting a cut, including indirect use,
  tests, and documented contracts. Absence from one caller is not proof of dead code.
- Look for duplicated existing behavior, avoidable dependencies, unused flexibility,
  and speculative scaffolding. Prefer reuse, standard library, native features or
  installed dependencies where equivalent; name the exact replacement.
- Check edge cases, browser support, accessibility and failure behavior before
  claiming equivalence. If evidence is missing, label a question rather than a finding.
- A small helper, single-implementation interface, wrapper or one-export file is
  not inherently unnecessary. Judge whether it provides a useful boundary.
- Preserve `Everything is computer/web/lib/content.ts` as the discovery/link owner, its publishing allowlist,
  stable document URLs, rendering/security controls, privacy and accessibility.
  Reuse the installed Markdown stack rather than replacing it with an ad hoc parser.
  Existing regression suites and the web test gate are safeguards, not deletion targets.
- Do not recommend code golf, weaker validation or removal of requested behavior.
  Note incidental correctness/security concerns separately; this is not a full
  correctness or security review and must not imply the code is safe to ship.

## Ponytail sources

Use the existing review above rather than installing overlapping plugins. The cleanup applied the simplicity ladder from [ponytail](https://github.com/Gavin-is-trying/ponytail/blob/974d940a1c5344210874150b98ff0d2c861fab6a/skills/ponytail/SKILL.md), whole-tree findings from [ponytail-audit](https://github.com/Gavin-is-trying/ponytail/blob/974d940a1c5344210874150b98ff0d2c861fab6a/skills/ponytail-audit/SKILL.md), and final diff review from [ponytail-review](https://github.com/Gavin-is-trying/ponytail/blob/974d940a1c5344210874150b98ff0d2c861fab6a/skills/ponytail-review/SKILL.md). Reuse those methods when relevant; do not duplicate their platform adapters or impose line-count quotas.

## Report

Rank actionable findings by maintenance benefit, not lines removed. For each,
provide `path:line`, the unnecessary complexity and evidence, the proposed
replacement (or deletion), and the behavior/regression checks needed to validate it.
State scope and checks actually performed. If nothing is justified, say so.
Do not invent savings, impose a deletion quota, or create a report file unless asked.
