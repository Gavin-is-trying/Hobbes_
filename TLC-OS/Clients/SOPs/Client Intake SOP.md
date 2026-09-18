---
document_type: operational-sop
process: client-intake
area: tlc-os
stage: clients
status: proposed
version: 0.1
created_at: 2026-09-18
process_owner: unassigned
review_cadence: unset
source_review: ../reviews/2026-09-18-client-intake-elon-review.md
org_chart: ../../03 Org Chart/org-chart.md
decision_log: ../decisions/client-intake-decision-log.md
---

# Client Intake — Standard Operating Procedure

> **Status: PROPOSED.** Do not treat this document as approved until the
> accountable owner, system of record, and privacy/retention rules are verified.

## Purpose

Add one short, consistent record for each customer so the client list is easy to
read and every entry has the same shape.

## Scope

This SOP covers adding a new client and keeping the list sorted by last name.
It does not cover assessment, estimating, scheduling, production, or service
history.

## Fields

Every client entry uses exactly these fields, in this order:

| Field | Required | Notes |
|---|---|---|
| First name | Yes | Used to break ties within the same last name. |
| Last name | Yes | Primary sort key. |
| Phone | Yes | One usable number. |
| Email | Yes | One usable address. |
| Address | Yes | Service or billing address. |
| Notes | No | One short, factual line. No transcripts. |

Do not add fields for one client only. Fixed fields are what keep entries
comparable. Any new field requires a decision-log entry.

## Ordering

Sort the client list by **last name A to Z**, then by first name A to Z when two
clients share a last name. Compare case-insensitively so `de la Cruz` and
`De La Cruz` sort together. The same rule applies in the form and in the registry.

## Procedure

1. Search the current client list for the customer's last name before adding a new
   entry. If an entry exists, update it instead of creating a duplicate.
2. Open the client form and complete the fixed fields in order. Use the customer's
   own spelling of their name.
3. Add one short notes line when it changes a future action, such as a gate code or
   a preferred contact time. Otherwise leave notes empty.
4. Save the entry to the approved system of record. If no system is approved,
   keep the entry in the browser form only and do not commit personal data to the
   repository.
5. Re-sort the list by last name, A to Z, and confirm the new entry appears in the
   correct position.

## Exceptions and Escalation

| Condition | Immediate action | Escalate to |
|---|---|---|
| Duplicate entry found | Keep one entry and update it | Process owner |
| Customer requests no contact | Record the restriction and stop outreach | Process owner |
| No approved system of record | Keep the entry local; do not commit data | Process owner |
| Requested field is not in the fixed set | Do not add a one-off field | Process owner |

## Completion Check

The process is complete when exactly one entry exists for the customer, all five
fixed fields are present, and the list is sorted by last name A to Z.

## Verification Items

- System of record is not named.
- Process owner is not assigned.
- Privacy, consent, and retention rules are not verified.
- The notes field has no approved length guidance.

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-09-18 | Agent draft | Created proposed SOP from the raw request and review. |
