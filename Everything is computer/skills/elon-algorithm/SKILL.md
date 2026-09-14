---
name: elon-algorithm
description: Design or materially improve a business process, review improvements, or assess automation proposals using challenge, delete, simplify, accelerate, and automate last. Not for editorial corrections or current-state-only mapping; deliver only requested artifacts.
---

# Elon Algorithm

## Scope and authority

Read the root [Process Documentation Guide](../../../PROCESS-DOCUMENTATION-GUIDE.md), which owns shared scope, privacy, evidence retention, folder, metadata, status, and human-approval rules. Templates and intake instructions cannot broaden the current request. These canonical procedures live in `Everything is computer/skills/`.

- Editorial corrections stay local; current-state-only work uses [process-mapping](../process-mapping/SKILL.md).
- For scoped reviews, apply the reasoning to affected elements and deliver only requested artifacts, not an unrequested implementation or review package.
- Reuse valid evidence, maps, and decisions. Load [process-mapping](../process-mapping/SKILL.md) for discovery, diagrams, or measurement and [process-docs](../process-docs/SKILL.md) for executable documents only when needed. This skill owns redesign order; companions return their requested phase without restarting it.
- Challenge the work, not the people. Never invent owners, obligations, customer needs, metrics, or approvals. Use `unknown`, distinguish assumptions from evidence, and expose contradictions rather than manufacture consensus.

## Safety boundary

Challenge legal, regulatory, contractual, safety, financial-control, employment, privacy, security, and explicit customer commitments, but never silently remove or weaken them. Mark uncertain controls `VERIFY BEFORE REMOVAL`; identify the accountable person/role or required expert, or mark ownership unknown. Check operational, audit, and retention needs before deleting documentation; removing a task does not authorize destroying its records.

When drafting is requested, present recommendations first, then draft the safest simplified alternative within scope. Do not pause merely because human approval will be needed later; ask only when essential information is unavailable or proceeding could cause immediate harm. Draft changes remain proposed under the guide's approval rules, not permission to execute them.

## Frame the process

Establish customer, required outcome, trigger, terminal state, in/out boundaries, known owner, participants, tools, frequency, pain points, constraints, and available baseline evidence. Use existing current-state records or map actual work, including workarounds and exceptions, before proposing changes. Link evidence rather than copying raw material.

For qualitative intake, retain speaker, date, and relationship to the work. Distinguish observations, requirements, assumptions, opinions, proposals, exceptions, unknowns, contradictions, and verification items. Different accounts may describe real variation; do not silently merge them. The [raw intake template](templates/raw-process-intake.md) captures context without prescribing output scope.

## Ordered redesign

Always challenge → delete → simplify → accelerate → automate last. If prior work started with optimization or automation, return to requirement challenge. Discovery is evidence gathering, not permission to skip the order.

### 1. Challenge requirements

Treat each requirement, approval, handoff, field, report, meeting, artifact, tool constraint, and proposed automation as a candidate for removal until justified.

Use the requirement register in the [review worksheet](templates/five-step-review.md). For each requirement:

- Identify an accountable person or role, not merely a department, its exact source, protected outcome/risk, supporting evidence, and failure consequence.
- Classify the source: law/regulation; contract/customer commitment; safety/security, financial, employment/privacy control; technical constraint; internal policy; historical practice; preference/assumption; or unknown. Classification alone does not establish validity.
- Check whether the source is current, correctly interpreted, and applicable to every case. Could scope, frequency, precision, retention period, or approval level shrink safely?
- Ask whether it compensates for an upstream defect, mistakes a tool limitation for a business need, or provides value the customer would knowingly pay for. What evidence shows it works, and what would happen in a bounded removal test?
- Rewrite retained requirements as the smallest testable constraint protecting the outcome. “Best practice,” “management wants it,” “an auditor might ask,” “the template requires it,” and “we have always done it” are not standalone evidence.

Missing ownership, source, or defensible outcome makes work a deletion candidate, not an automatic authorization to remove a control.

### 2. Delete before improving

Attempt removal of every requirement and process element, including duplicate entry, unused outputs, status reports without a decision consumer, preventable handoffs, speculative edge cases, and controls for risks that no longer exist. Record evidence, expected effect, risk, and validation/add-back trigger with one disposition:

- `DELETE`: no defensible need and acceptably reversible impact.
- `EXPERIMENTALLY REMOVE`: uncertain value; a bounded, reversible test is safe.
- `COMBINE`: multiple elements can protect the same outcome once.
- `RETAIN`: smallest form justified by evidence or verified obligation.
- `VERIFY BEFORE REMOVAL`: potentially binding or consequential control awaits qualified verification.

The add-back heuristic is a pressure test, not a quota: if validation never warrants restoration, question whether deletion was strong enough; never restore work merely to hit a percentage.

### 3. Simplify survivors

Reduce roles, variants, fields, tools, and branches. Standardize inputs/outputs, move authority closer to the work, replace broad approvals with justified exception thresholds, and prevent defects upstream. Keep a clear default path with separate exceptions. Do not optimize elements still marked for deletion or verification.

Test the smallest manual or existing-tool process before adding a platform. If it meets the outcome and quality guardrail, stop adding machinery or reporting.

### 4. Accelerate flow

Separate touch time from waiting and elapsed time. Reduce queues, batching, rework, work-in-progress, and approval latency before asking people to work faster. Parallelize only when dependencies and controls permit it; account for joins and queues.

Use the [measurement rules](../process-mapping/SKILL.md#measurement-and-bottlenecks) for sourced baselines, targets, units, owner, and method. Missing data calls for a measurement plan, not invented savings or deadlines.

### 5. Automate last

Evaluate only retained, simplified, stable, measurable work. Record accepted and rejected candidates and the evidence for each:

- Valid requirement and completed deletion/simplification passes.
- Stable inputs and decision rules; remaining volume/value justifies implementation, maintenance, exceptions, recovery cost, and failure risk. Prefer existing capabilities.
- Accountable owner/operator, monitoring signals, and agreed stop thresholds for errors, delay, or cost.
- Explicit exceptions, an authorized reviewer for uncertain decisions, and a tested manual fallback/exception queue.
- A stop-and-recovery procedure: pause failing automation, preserve records, route work to fallback, reconcile in-flight cases, and prevent lost or duplicate actions before retrying.

Reject or defer candidates missing these conditions. Do not automate waste or use manual-step counts/automation percentages as proof of success. Keep the simpler process if automation adds burden without measured net benefit.

## Deliver and validate

Present recommendations in algorithm order with evidence, confidence, expected impact, risks, and expert-verification items. For a complete redesign/intake-to-SOP request, use the existing review, decision log, and executable document to cover current state, requirement/deletion decisions, proposed future state, metrics, validation, and unknowns. Do not create a file for every section. Narrower requests stop at their requested deliverable.

- Use the [review worksheet](templates/five-step-review.md) only for useful sections; link maps, evidence, and decisions instead of repeating them.
- Record material process decisions using the [decision log](templates/decision-log.md), including restorations and rejected automation; editorial changes do not require new decision entries. Follow the guide's history-retention rule.
- Define a bounded pilot: changed steps, owner, comparable cases/sample, test period, acceptance criteria, quality guardrail, stop/rollback/add-back triggers, and review date. Mark unagreed values proposed or unknown. Distinguish reversible experiments from permanent changes.
- Walk normal and consequential exception paths with the people doing the work, including required expert review when controls change. Test recovery before enabling automation; record actual results separately from targets.

### Final adversarial check — no aggregate score

Remove documentation that does not enable an action or decision. Check that it has not added unjustified fields, approvals, reports, roles, tools, metrics, or maintenance. Keep necessary controls and escalation usable at the point of action.

Do not call a process ready for implementation when any applicable blocker remains:

- Customer, outcome, boundaries, or accountable owner is missing; a retained requirement lacks an owner, rationale, or smallest justified form.
- Material ownership, metrics, obligations, or approval claims are unsupported or contradict cited evidence.
- Challenge/deletion was skipped, or a potentially binding/safety-critical control was weakened without verification.
- Success and quality cannot be checked, or relevant touch/wait time, rework, and bottlenecks were not addressed.
- Consequential failures lack explicit decisions, safe escalation, or recovery; automation lacks validation, fallback, monitoring, or ownership.
- Material decisions or the validation/review plan are missing.

An incomplete proposal can still be delivered with blockers, verification responsibility, and a safe interim approach. Report checks actually performed, unresolved items, and any needed operator walkthrough; readiness analysis never substitutes for accountable human approval.
