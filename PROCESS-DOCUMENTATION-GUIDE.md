# Process Documentation Guide

This repository turns rough operational knowledge into challenged, measurable,
and executable processes. Start with an unpolished transcript; do not write the
SOP first.

## Folder Model

Every external- and internal-customer lifecycle stage contains:

```text
stage/
├── intake/      # Human-created raw source material
├── reviews/     # Agent-generated Elon Algorithm analysis
├── decisions/   # Persistent decision history
└── SOPs/        # Proposed and approved operating documents
```

Do not put content in `.gitkeep`. It is only an empty placeholder that allows
Git to track an otherwise empty directory.

The `TLC-OS` folders are not pre-scaffolded because values and philosophy are
foundational context rather than automatically executable processes. Add a
process workspace there only when a concrete recurring workflow requires one.

## What You Create

Create one raw intake document in the appropriate stage's `intake/` directory:

```text
YYYY-MM-DD-process-name-transcript.md
```

Example:

```text
External Customers/04 Estimate/intake/2026-09-04-estimate-creation-transcript.md
```

Start from:

```text
Agents/Skills/elon-algorithm/templates/raw-process-intake.md
```

Use Markdown (`.md`) rather than plain text (`.txt`). Markdown accepts completely
unformatted speech-to-text while also supporting metadata and agent
instructions. If a transcription tool exports `.txt`, paste its contents into
the Markdown template or rename it after adding the template metadata.

Your transcript can be disorganized, repetitive, incomplete, contradictory,
and grammatically rough. Describe what actually happens rather than what the
policy claims should happen.

Useful subjects include:

- What starts and ends the process
- Who performs, approves, receives, or waits for work
- Tools and systems used
- Information collected or entered more than once
- Handoffs, queues, delays, and recurring rework
- Normal steps, unofficial workarounds, and exceptions
- Things described as required and who supposedly requires them
- Frustrations, risks, errors, and customer consequences
- Ideas for improvement or automation
- Anything uncertain or disputed

Do not polish away uncertainty. Use `[unclear]`, `[inaudible]`, or `[possible
transcription error]` when appropriate.

## What Agents Generate

After the intake is attached and the Elon Algorithm is invoked, agents generate
or update:

### `reviews/`

The structured analysis, including current state, challenged requirements,
proposed deletions, simplifications, cycle-time improvements, automation review,
future state, metrics, assumptions, and verification items.

Suggested filename:

```text
YYYY-MM-DD-process-name-elon-review.md
```

### `decisions/`

The permanent history of what was challenged, deleted, experimentally removed,
combined, retained, restored, simplified, accelerated, automated, or rejected
for automation—and why.

Suggested filename:

```text
process-name-decision-log.md
```

Never erase historical decisions. Add a superseding entry when evidence or the
decision changes.

### `SOPs/`

The executable SOP, runbook, or playbook produced after requirement challenge
and process redesign.

Suggested filename:

```text
Process Name SOP.md
```

An agent-generated document remains `proposed` until the accountable human owner
approves it.

## Status Lifecycle

Use these values in document metadata:

1. `raw` — unverified source material
2. `extracted` — claims and process elements have been structured
3. `under-review` — requirements and design are being challenged
4. `proposed` — future state or process document is ready for human review
5. `approved` — the accountable human owner has approved it
6. `superseded` — a newer approved document replaces it

Do not allow an agent to label its own draft `approved`.

## Speech-to-Text Workflow

1. Choose one lifecycle stage and one primary process.
2. Copy `raw-process-intake.md` into that stage's `intake/` directory.
3. Rename it using `YYYY-MM-DD-process-name-transcript.md`.
4. Complete the YAML metadata as far as you can; use `unknown` when needed.
5. Dictate freely into the raw transcript section.
6. Preserve observations, complaints, exceptions, assumptions, and ideas.
7. Remove secrets and unnecessary personal information.
8. Commit the intake when it is safe to preserve in Git history.
9. Attach the intake file and `Agents/Skills/elon-algorithm/` to the agent.
10. Ask the agent to run the algorithm and write the resulting artifacts into
    the sibling `reviews`, `decisions`, and `SOPs` directories.
11. Correct factual errors and verify sensitive obligations.
12. Have the accountable process owner approve or reject the proposal.

Suggested invocation:

> Run `Agents/Skills/elon-algorithm/` against this raw intake. Strongly
> challenge every requirement and step. Write the review, decision log, and
> proposed SOP to the appropriate sibling directories. Clearly label unknowns
> and anything requiring expert verification.

## Qualitative Evidence Rules

A transcript can mix several kinds of statements in one sentence. Agents should
classify them as observations, requirements, assumptions, opinions, proposals,
exceptions, unknowns, contradictions, or verification items.

Record who supplied the information, when it was recorded, and whether the
speaker performs, manages, receives, or merely observes the process. Different
accounts are evidence of process variation and should not be silently merged
into a false consensus.

Keep raw material separate from authoritative process documentation. The raw
transcript is evidence; the review is analysis; the decision log is history;
the approved SOP is the operating standard.

## Privacy, Security, and Retention

Assume committed Git history is durable, even when the repository is private.
Before committing, remove:

- Passwords, API keys, access tokens, and credentials
- Payment-card, banking, or government-identifier data
- Medical information
- Unnecessary customer or employee identities
- Sensitive contract details not required for process analysis
- Personal criticism that can be restated as a neutral process observation

Prefer `[CUSTOMER NAME REDACTED]`, `[EMPLOYEE DETAIL REDACTED]`, or `[SECRET
REMOVED]` over identifiable data.

If raw material must expire reliably, store it in an approved controlled system
rather than Git. Removing a later version does not reliably remove earlier Git
history.

## First-Session Checklist

- [ ] Pick one frequent, painful, slow, or error-prone process.
- [ ] Choose its external- or internal-customer lifecycle stage.
- [ ] Copy and rename the raw intake template.
- [ ] Fill in known metadata and mark unknowns honestly.
- [ ] Dictate what actually happens, including workarounds and exceptions.
- [ ] Remove secrets and unnecessary personal information.
- [ ] Attach the intake and invoke `Agents/Skills/elon-algorithm/`.
- [ ] Review recommendations, assumptions, and verification items.
- [ ] Confirm the decision log preserves the reasoning.
- [ ] Approve the SOP only after the accountable owner validates it.
