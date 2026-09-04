---
document_type: process-intake
process: replace-with-process-name
area: external-customers-or-internal-customers
stage: replace-with-stage-folder
status: raw
source_type: speech-to-text
recorded_at: YYYY-MM-DD
process_owner: unassigned
author: replace-with-name
sensitivity: internal
elon_review_status: pending
---

# [Process Name] — Raw Process Intake

> This file contains unverified source material. Statements may be incomplete,
> inaccurate, speculative, or contradictory. Do not treat them as approved
> requirements without verification.

## Processing Instructions

Use `Agents/Skills/elon-algorithm/SKILL.md` to process this intake.

Extract and distinguish:

- `OBSERVATION` — something the speaker directly sees or does
- `REQUIREMENT` — something stated as mandatory
- `ASSUMPTION` — something believed but not verified
- `OPINION` — a subjective assessment
- `PROPOSAL` — a suggested future solution
- `EXCEPTION` — a deviation from the normal path
- `UNKNOWN` — missing information
- `CONTRADICTION` — statements that cannot both be true as written
- `VERIFY BEFORE REMOVAL` — a potentially binding or safety-critical control

Treat the transcript as qualitative evidence, not as an authoritative process.
Challenge requirements, attempt deletion, simplify surviving work, accelerate
cycle time, and consider automation last.

Generate or update these sibling artifacts:

- `../reviews/YYYY-MM-DD-process-name-elon-review.md`
- `../decisions/process-name-decision-log.md`
- `../SOPs/Process Name SOP.md`

Present recommendations first, then continue autonomously into the proposed
future-state process and draft SOP. Clearly label assumptions and unresolved
verification items.

## Known Context

- **Customer of the process:** [Who receives the outcome?]
- **Desired outcome:** [What result should exist when the process succeeds?]
- **Trigger:** [What starts the process?]
- **Terminal state:** [What clearly marks completion?]
- **Known owner:** [Person or accountable role, or unknown]
- **Systems involved:** [Systems, tools, or unknown]
- **Known external obligations:** [Legal, contractual, safety, or none known]

## Privacy and Safety Check

Before committing this file, remove secrets and unnecessary personal or
confidential information. Never commit passwords, API keys, access tokens,
payment credentials, government identifiers, medical information, or
unnecessary customer and employee details. Replace them with explicit markers
such as `[CUSTOMER NAME REDACTED]` or `[SECRET REMOVED]`.

## Raw Transcript

The transcript may be rough, repetitive, fragmented, or contradictory. Preserve
uncertainty with markers such as `[unclear]`, `[inaudible]`, or `[possible
transcription error]`. Put the transcript between the delimiters below.

<!-- RAW_TRANSCRIPT_START

Paste or dictate the raw speech-to-text transcript here.

RAW_TRANSCRIPT_END -->
