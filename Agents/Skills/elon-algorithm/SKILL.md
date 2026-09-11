---
name: elon-algorithm
description: Apply the ordered five-step algorithm to aggressively challenge requirements, delete unnecessary work, simplify what remains, accelerate cycle time, and automate last before creating or revising any business process, SOP, playbook, runbook, or workflow.
---

# Elon Algorithm

Use this skill as the default orchestration and quality gate for business-process work. Apply it when creating, mapping, reviewing, or revising a process, SOP, playbook, runbook, policy workflow, approval flow, customer journey, employee journey, or automation proposal.

## Required Companion Skills

Load and follow these repository skills when available:

- `../process-mapping/SKILL.md` for current-state discovery, bottleneck analysis, future-state design, and metrics.
- `../process-docs/SKILL.md` for the final executable SOP, runbook, or onboarding playbook.

This skill controls their order. Do not let either companion skill skip requirement challenge and deletion.

## Operating Posture

Challenge strongly. Presume every requirement, step, approval, handoff, report, field, meeting, artifact, and proposed automation is unnecessary until its owner and evidence justify retaining it.

Be constructive rather than theatrical. Challenge the work, not the people. Do not accept “best practice,” “management wants it,” “we have always done it,” or “the system requires it” as sufficient justification.

Never invent facts, owners, legal obligations, performance data, or customer needs. Mark unknowns explicitly and proceed with stated assumptions when a useful autonomous draft is possible.

## Safety Boundary

Aggressively challenge legal, regulatory, contractual, safety, financial-control, employment, privacy, security, and explicit customer commitments, but do not silently remove or weaken them. Flag them as `VERIFY BEFORE REMOVAL`, identify the accountable owner or required expert, and draft the safest simplified alternative. The user receives recommendations first, followed by an autonomous draft; do not pause for approval unless essential information is unavailable or proceeding could cause immediate harm.

## Mandatory Order

Never reorder these steps:

1. Make requirements less dumb.
2. Delete unnecessary parts or process steps.
3. Simplify and optimize what survives.
4. Accelerate cycle time.
5. Automate last.

If prior work began with optimization or automation, return to Step 1 before continuing.

## Workflow

### 0. Frame the outcome

Define:

- The customer of the process, including internal customers.
- The outcome they need.
- Trigger, terminal state, scope, and process owner.
- Known constraints and non-negotiable external obligations.
- Baseline metrics and evidence, distinguishing measured values from estimates.

Use `references/orchestration-workflow.md` for the complete sequence.

### 1. Make requirements less dumb

Create a requirement register using `references/requirement-challenge-framework.md`.

For every requirement:

- Name a person or accountable role who owns it. Never use an organization or department as the owner.
- Identify its source and the outcome or risk it protects.
- Request or record evidence.
- Distinguish externally imposed obligations from internal choices.
- Ask whether the requirement is still current, correctly interpreted, and necessary at this scope or frequency.
- Rewrite retained requirements as the smallest testable constraint that protects the intended outcome.

Requirements without an accountable owner, credible source, or defensible outcome are deletion candidates.

### 2. Delete

Map the actual current state with `process-mapping`, including unofficial workarounds and exceptions. Attempt to delete each requirement and each process element before improving it.

For each element, decide:

- `DELETE`
- `EXPERIMENTALLY REMOVE`
- `COMBINE`
- `RETAIN`
- `VERIFY BEFORE REMOVAL`

Delete duplicate entry, unnecessary approvals, status reporting without a decision consumer, preventable handoffs, unused outputs, speculative edge cases, and controls whose protected risk no longer exists.

Use the “add-back” heuristic as a pressure test, not a quota: if no deleted element merits restoration after validation, question whether deletion was aggressive enough. Never restore work merely to hit a percentage.

### 3. Simplify and optimize

Only modify elements that survived deletion:

- Reduce roles, variants, fields, tools, and decision branches.
- Move authority closer to the work.
- Standardize inputs and outputs.
- Replace broad approvals with explicit exception thresholds.
- Prevent defects at their source instead of adding downstream inspection.
- Prefer a clear default path with separately documented exceptions.

Do not optimize an element still marked for deletion or verification.

### 4. Accelerate cycle time

Separate touch time from waiting time. Reduce queues, batching, rework, serial handoffs, work-in-progress, and approval latency before asking people to work faster.

Record baseline, target, measurement method, and owner for relevant metrics. Never present estimates as measured facts.

### 5. Automate last

Automate only a retained, simplified, stable, measurable path. For each automation candidate confirm:

- The requirement is valid.
- The step survived deletion.
- Inputs and decision rules are sufficiently stable.
- Exceptions and a manual fallback are defined.
- Monitoring and an accountable owner exist.
- Automation cost and failure risk are justified by volume and value.

Reject automation that merely makes waste happen faster.

### 6. Recommend, then draft autonomously

Present a concise recommendation set before the draft:

1. Requirements to challenge or rewrite.
2. Elements to delete, experimentally remove, or combine.
3. Simplifications.
4. Cycle-time changes.
5. Automation candidates and rejected automations.
6. Risks and items requiring expert verification.

Then continue without waiting and produce the proposed future-state map and final process document using `process-docs`. Clearly label assumptions and verification items.

### 7. Run the final adversarial pass

Challenge the draft itself:

- Does every section enable a decision or action?
- Did documentation add approvals, fields, reports, or maintenance burden?
- Can any step, role, tool, metric, or paragraph be removed?
- Are exceptions rarer and clearer than the primary path?
- Does every retained control have an owner and rationale?
- Is automation still last?

Revise the draft before delivering it.

## Repository Intake Convention

For lifecycle processes in this repository, use these directories within the applicable stage:

- `intake/` for human-created, unverified source material.
- `reviews/` for the Elon Algorithm analysis and future-state proposal.
- `decisions/` for the persistent decision log.
- `SOPs/` for proposed and approved executable documents.

Use `templates/raw-process-intake.md` for speech-to-text and stream-of-consciousness input. Treat raw intake as qualitative evidence rather than an authoritative process. Preserve the original intake, distinguish observations from assumptions and requirements, and write generated artifacts to the sibling directories named above.

Never put process content in `.gitkeep`; it is only a placeholder for an empty directory. Follow the repository-wide handling, naming, status, and privacy guidance in `PROCESS-DOCUMENTATION-GUIDE.md` when available.

## Required Outputs

Unless the user asks for a narrower artifact, produce:

1. **Outcome and scope**
2. **Current-state summary**
3. **Requirement challenge register**
4. **Deletion and simplification recommendations**
5. **Future-state process**
6. **Metrics and validation plan**
7. **Draft SOP, playbook, or runbook**
8. **Decision log**
9. **Open verification items and assumptions**

Use:

- `templates/five-step-review.md` for the review package.
- `templates/decision-log.md` to preserve challenged, deleted, retained, restored, simplified, and automated decisions.
- `references/process-review-scorecard.md` for the final quality gate.

## Decision-Log Rules

Maintain the decision log whenever a process is created or revised. Each material decision records the date, process element, original rationale, evidence, decision, owner, expected effect, validation method, and review date.

Never erase prior decisions. Mark superseded decisions and add a new entry so unnecessary bureaucracy cannot quietly return and valid controls are not accidentally removed later.

## Completion Standard

A process is not ready merely because it is documented. It is ready when:

- Its outcome and customer are explicit.
- Every retained requirement has an accountable owner and defensible rationale.
- Deletion occurred before optimization.
- The simplest viable path is documented with explicit exceptions.
- Cycle time can be measured.
- Automation, if any, applies only to validated work.
- Failure modes and safe escalation paths exist.
- The decision log and review date are present.
