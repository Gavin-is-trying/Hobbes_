---
name: process-docs
description: Create or revise requested executable SOPs, runbooks, or onboarding playbooks. Reuse established analysis; editorial corrections do not trigger a full process redesign.
---

# Process Documentation

## Scope and sources

Read the [Process Documentation Guide](../../../TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md) for shared scope, privacy/retention, folder, evidence, metadata, status, and human-approval rules. Canonical skills live in `everything-is-computer/skills/`.

- Editorial/factual corrections update only affected text and references. Do not silently resolve contradictions by changing ownership, approvals, or requirements.
- Reuse the relevant intake, current document, review, maps, and decision history. Consult `TLC-OS/03 Org Chart/org-chart.md` from the repository root where ownership matters; verify roles and tools against sources, not examples.
- New processes or material operating changes follow [elon-algorithm](../elon-algorithm/SKILL.md) before drafting. Reuse valid established analysis; when invoked by that skill, complete only the documentation phase without restarting orchestration or creating extra artifacts.
- Never invent owners, measurements, durations, obligations, or approval. Mark unknowns and disputed claims. Do not silently weaken legal, contractual, safety, financial, employment, privacy, security, or customer commitments; use the redesign skill's verification boundary when a change affects them.

## Draft the minimum executable document

For existing documents, preserve the structure unless the requested change requires otherwise. For new documents, use the shared skeleton below plus only the applicable type-specific details. Templates are checklists, not requirements to manufacture empty sections, RACI tables, SLAs, or version logs.

1. Identify the document type and requested outcome. Confirm trigger, endpoint, scope, frequency, prerequisites, tools, and pain/failure points from available evidence.
2. Walk or reuse the end-to-end map. Verify the accountable owner and actor for each major action; add approval, consultation, or notification only where needed.
3. Write imperative actions with specific inputs, outputs, tool paths, and checks. Split independent actions or branches when useful, not merely because a sentence contains “and.”
4. State explicit if/then conditions and destinations. At consequential steps, give failure signals, safe stop/recovery, and escalation to an authorized person/role. Unknown authority or thresholds are verification blockers, not permission to improvise.
5. Link background rationale and established subprocesses rather than copying them, while retaining the controls and instructions an operator needs at the point of action. Prefer durable text UI paths; use screenshots only when needed for a complex interface.

### Shared document skeleton

- **Identity:** Process/document type, accountable owner, last updated/reviewed date, established review cadence (or explicitly proposed cadence), and status per the guide. Use existing revision history; add a separate changelog only if it serves a real need.
- **Purpose and boundaries:** Required outcome, trigger, completion state, what is in/out of scope.
- **Prerequisites:** Required inputs, tools, access, permissions, and checks before starting.
- **Procedure:** Numbered actor/action steps with outputs, explicit decision branches, handoffs, and required controls.
- **Exceptions and escalation:** Condition/failure signal → immediate safe action → authorized recipient → known response threshold → recovery/re-entry check. Keep consequential instructions beside the relevant action; use a table only if it improves use.
- **Completion:** How the operator verifies the result and records it in the existing system; do not add duplicate tracking.
- **Verification items:** Missing/conflicting evidence, responsible verifier if known, and safe interim approach. Link supporting analysis and material decisions.

### Choose type-specific detail

| Type | Add what execution requires |
|---|---|
| Operational SOP — routine work | Normal sequence, relevant exceptions, completion checks, and any sourced scheduling/escalation timings. |
| Incident runbook — reactive response | Detection signals and established severity criteria; responsible/on-call role; immediate triage, containment, and communication; diagnostic branches; resolution per known cause; safe rollback and recovery verification; post-incident follow-up and last-tested date. Do not invent severity levels or “first five minutes” deadlines. |
| Onboarding playbook — learning path | Access/orientation, core training and shadowing, guided practice with supervision/checkpoints, and demonstrated graduation criteria. Use sourced or explicitly proposed sequencing/duration and buddy/owner; do not assume a two-week schedule. |

For automated steps, retain the operator's failure signal, stop threshold, manual fallback/exception queue, and recovery checks from the approved design. Preserve records and reconcile in-flight cases to avoid lost or duplicate actions before retries. Keep uncertain decisions with an authorized reviewer; if this design is absent, flag the gap rather than invent a safe procedure.

## Validate before delivery

- Reconcile material owners, metrics, obligations, and approval claims with cited evidence. Preserve raw sources and material decision history per the guide; a correction or superseding decision must not erase earlier evidence.
- Check that a newcomer can follow the normal path and consequential failure branches without the usual operator present. Request or perform an authorized walkthrough, recording where it stops or becomes ambiguous; do not claim unperformed testing.
- Verify prerequisites, branches, escalation destinations, success checks, and useful timing. Label estimates and proposed thresholds; unknown consequential controls block operational readiness even if a useful draft can be delivered.
- Delete sections that do not enable execution, a necessary decision, or a required control. Do not shorten away failure handling or required detail.
- Report actual checks, unresolved blockers, and any needed operator/expert review. New drafts remain proposed until the accountable human approves them; agent review is not approval.
