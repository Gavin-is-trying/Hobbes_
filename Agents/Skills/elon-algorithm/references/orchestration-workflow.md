# Orchestration Workflow

Use this sequence to coordinate `process-mapping`, the five-step review, and `process-docs`.

## 1. Intake

Capture the process name, customer, desired outcome, trigger, terminal state, owner, scope, known obligations, pain points, tools, participants, frequency, and available evidence. If information is incomplete, list assumptions rather than inventing facts.

## 2. Current-State Map

Use `process-mapping` to document what actually occurs rather than what policy says should occur. For every step record:

- Requirement served
- Actor and accountable owner
- Input and output
- Tool or system
- Touch time and wait time
- Decision or approval
- Handoff
- Failure modes and rework
- Customer value

Include unofficial workarounds and exception paths.

## 3. Requirement Challenge

Build the requirement register before proposing improvements. Attribute every requirement to a person or accountable role, classify its source, and record evidence. Rewrite retained requirements as minimal testable constraints.

## 4. Deletion Pass

Attempt to remove each requirement, step, approval, handoff, field, artifact, report, meeting, tool, and exception. Record the proposed decision and expected effect. External obligations that are not yet verified are marked `VERIFY BEFORE REMOVAL`, not silently discarded.

## 5. Simplification Pass

For surviving work, reduce variants, ownership boundaries, fields, tools, and decision branches. Prefer defaults, thresholds, prevention, and direct ownership over broad approvals and downstream inspection.

## 6. Acceleration Pass

Measure elapsed time separately from touch time. Attack waiting and rework first. Set a target and measurement method; do not fabricate a baseline.

## 7. Automation Pass

Evaluate automation only now. Document volume, stability, value, exceptions, fallback, monitoring, and ownership. Reject candidates that do not meet the criteria.

## 8. Recommendations

Present recommendations in algorithm order. Include risk, evidence, expected impact, confidence, and verification items. Do not pause before drafting unless required information is genuinely unavailable or an immediate harmful action would result.

## 9. Future-State Map

Use `process-mapping` to produce the proposed future state, implementation sequence, metrics, risks, and validation plan. Distinguish reversible experiments from permanent changes.

## 10. Executable Documentation

Use `process-docs` to select the right artifact type and write the SOP, incident runbook, or onboarding playbook. Include ownership, prerequisites, imperative steps, explicit decisions, failure handling, success criteria, review cadence, and changelog.

## 11. Adversarial Review

Score the result with `process-review-scorecard.md`. Delete documentation that does not enable action or a necessary decision. Confirm automation remains last.

## 12. Preserve Decisions

Append the decision log. Never rewrite history; supersede prior entries with new evidence and decisions.
