---
name: process-mapping
description: Map a requested current or future business process, including handoffs, decisions, exceptions, and bottlenecks. Current-state-only work does not trigger a future-state map or SOP; route material redesign through the Elon Algorithm.
---

# Process Mapping

## Scope

Read the root [Process Documentation Guide](../../../PROCESS-DOCUMENTATION-GUIDE.md) for shared scope, evidence, privacy/retention, folder, status, and approval rules. Canonical skills live in `Everything is computer/skills/`.

For current-state discovery or a diagram, deliver the supported map/analysis and unresolved questions only: no automatic future state, decision log, or SOP. Reuse valid maps; a narrow correction stays narrow. For a future-state map, distinguish depicting an established proposal from designing material changes: new design follows [elon-algorithm](../elon-algorithm/SKILL.md). When called by that skill, complete the requested mapping phase and return; do not restart orchestration.

## Map actual work

1. Establish customer/outcome, trigger, endpoint, in/out boundaries, known accountable owner, and source links. Start with recent cases, timestamps, records, and the people performing, managing, receiving, or observing the work.
2. Record speaker/date/perspective, observation period, and sample size. Apply the guide's qualitative evidence categories: distinguish what happened from requirements, assumptions, opinions, and proposals. Keep contradictory accounts and process variants explicit; mark unknown owners, timings, and obligations rather than inventing them.
3. Choose the simplest useful representation: ordered steps for linear work, a diagram for branches, swimlanes when ownership/handoffs matter. Avoid duplicate prose and diagrams unless each serves a distinct need.
4. Trace normal work, unofficial workarounds, decisions, queues, approvals, handoffs, exceptions, rework loops, and consequential failures. Identify each decision condition and destination; make completion and safe stop/escalation paths explicit. Do not substitute policy for observed practice.
5. Validate the map against cases and, where available, the people doing the work. Record disagreements, missing evidence, and untested paths. Current-state-only requests stop here, with requested bottleneck analysis if applicable.

Use this row shape in the existing map or review when a table helps; include only relevant columns, not empty template sections:

| Step/action | Actor / accountable owner | Requirement or customer value | Input → output | Tool / record | Touch / wait time and source | Decision / handoff destination | Failure / rework / escalation |
|---|---|---|---|---|---|---|---|

Keep source evidence separate from proposed changes. Deleting work or redundant documentation does not authorize deleting underlying business facts, audit records, or history; link canonical records under the guide's retention rules.

## Measurement and bottlenecks

Use the fewest measures supporting a decision: an outcome measure and quality guardrail, adding effort/cost only when useful. Reuse records or a small spreadsheet before adding dashboards.

- Define boundaries, units, numerator/denominator where applicable, source, accountable owner, observation period, and sample size. Keep measured baselines, estimates, proposed targets, and observed results distinct; unknowns remain unknown.
- Compare similar case types and volumes. Include exceptions, failures, and rework; disclose exclusions and unfinished cases. Use the same timing and cost basis before/after.
- Measure elapsed duration from start/end timestamps; specify calendar versus business time. Sum active effort separately from waiting/elapsed time. Overlapping steps, queues, dependencies, and joins prevent naive summation or using the longest step as total duration.
- Trace delay/error causes; “manual” and arbitrary duration thresholds do not prove a bottleneck. Include a tail measure when averages hide long waits. Faster processing alone does not prove customer satisfaction: check completion, feedback, or support demand where relevant.
- For lower-is-better measures, reduction is `(baseline - observed result) / baseline × 100%` only with a positive baseline and matching units. Distinguish percentage-point change from relative rate reduction; first-time success is not automatically the complement of a differently defined error rate.
- Cost comparisons include implementation, maintenance, exceptions, rework, and recovery. Validate volume and realizable cost reductions before claiming net benefit or cash savings; do not infer trends without comparable observations.
- Set targets and review cadence only as needed for an actual decision, with an owner and method; label unagreed values proposed. Missing baselines require a measurement plan, not illustrative numbers.

## Requested future state

Use the ordered redesign and pilot/failure gates in [elon-algorithm](../elon-algorithm/SKILL.md), not a second improvement workflow here. Map the smallest surviving manual or existing-tool path first, then explicit exceptions. Link each material change to its requirement/deletion decision and evidence; keep proposed targets separate from achieved results.

Show implementation dependencies, changed ownership/handoffs, required controls, success checks, and safe rollback to the known working path. Link the bounded pilot and measurement plan rather than duplicating them. If automation is part of the established proposal, show the operator, failure signal, authorized exception route, manual fallback, and in-flight reconciliation before retry; do not treat a manual step as sufficient reason to automate.

Deliver only the requested map/analysis and verification items. Executable SOPs belong in [process-docs](../process-docs/SKILL.md) only when requested.
