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

> **Status: PROPOSED.** The system of record is now the hosted client database
> described below. Do not treat this document as approved until the accountable
> owner and privacy/retention rules are verified.

## Purpose

Add one short, consistent record for each customer so the client list is easy to
read and every entry has the same shape.

## Scope

This SOP covers adding a new client and keeping the list sorted by last name.
It does not cover assessment, estimating, scheduling, production, or service
history.

## System of Record

Client entries are stored in the TLC-OS client database: a hosted Postgres
database behind the website's Clients page. The page reads and writes through
server API routes; the connection string is supplied through the `DATABASE_URL`
environment variable and is never committed.

- The database is the only system of record for customer records. Do not commit
  real customer names, phone numbers, email addresses, or street addresses to
  this repository.
- `TLC-OS/Clients/Client Registry.md` defines the record format and sort rule
  only. It is not the data store.
- Customer records are loaded from the database when the Clients page opens, so
  entries are available across sessions and devices.

## Fields

Every client entry uses exactly these fields, in this order:

| Field | Required | Notes |
|---|---|---|
| First name | A name | At least one of first or last name is required. Used to break ties within the same last name. |
| Last name | A name | At least one of first or last name is required. Primary sort key. |
| Phone | No | One usable number when available. |
| Email | No | One usable address when available. |
| Address | No | Service or billing address when available. |
| Notes | No | One short, factual line. No transcripts. |

The Clients page enforces only the name rule: it holds an entry until at least a
first or last name is present. Contact fields are kept blank until they are known
rather than filled with placeholder text.

Do not add fields for one client only. Fixed fields are what keep entries
comparable. Any new field requires a decision-log entry.

## Ordering

Sort the client list by **last name A to Z**, then by first name A to Z when two
clients share a last name. Compare case-insensitively so `de la Cruz` and
`De La Cruz` sort together. The same rule applies in the form and in the registry.

## Procedure

1. Search the current client list for the customer's last name before adding a new
   entry. The list on the Clients page loads from the database. If an entry exists,
   update it instead of creating a duplicate.
2. Open the client form and complete the fixed fields in order. Use the customer's
   own spelling of their name.
3. Add one short notes line when it changes a future action, such as a gate code or
   a preferred contact time. Otherwise leave notes empty.
4. Save the entry. The Clients page writes to the client database through the
   server API. If the page reports that the database is unavailable, the entry was
   not saved; retry and escalate if it stays down.
5. Confirm the new entry appears in the list, sorted by last name, A to Z.

## Exceptions and Escalation

| Condition | Immediate action | Escalate to |
|---|---|---|
| Duplicate entry found | Keep one entry and update it | Process owner |
| Customer requests no contact | Record the restriction and stop outreach | Process owner |
| Database unavailable | Retry; do not treat the entry as saved | Process owner |
| Requested field is not in the fixed set | Do not add a one-off field | Process owner |

## Completion Check

The process is complete when exactly one entry exists for the customer, the record
has at least a first or last name, and the list is sorted by last name A to Z.

## Verification Items

- Process owner is not assigned.
- Access control for the Clients API is not defined; anyone who can reach the
  site can add or remove records.
- Privacy, consent, and retention rules for the database are not verified.
- Database backup and retention configuration are not confirmed.
- The notes field has no approved length guidance.

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-09-18 | Agent draft | Created proposed SOP from the raw request and review. |
| 2026-09-18 | Agent draft | Named the hosted client database as system of record; updated procedure, exceptions, and verification items to match issue #14. |
