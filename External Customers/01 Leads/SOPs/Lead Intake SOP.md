---
document_type: operational-sop
process: lead-intake
area: external-customers
stage: 01-leads
status: proposed
version: 0.1
created_at: 2026-09-04
process_owner: unassigned
review_cadence: unset
source_review: ../reviews/2026-09-04-lead-intake-elon-review.md
decision_log: ../decisions/lead-intake-decision-log.md
---

# Lead Intake — Standard Operating Procedure

> **Status: PROPOSED.** Do not treat this document as approved until the accountable process owner, system of record, next-stage criteria, and applicable outreach restrictions are verified.

## Purpose

Give each legitimate prospective customer one clear, owned next action without duplicate records, unnecessary data collection, or unauthorized outreach.

## Scope

This SOP covers:

- Receiving an inbound inquiry
- Intentionally selecting a plausible outbound prospect
- Checking contact restrictions
- Finding or creating a minimal lead record
- Making an initial fit decision
- Assigning ownership and a next action
- Closing records that should not proceed

This SOP does not cover campaign design, advertising purchases, content creation, detailed assessment, estimating, or production.

## Ownership

- **Process owner:** Unassigned — must be named before approval
- **Executor:** Unassigned
- **Approver:** Required only for approval of this SOP or a verified exception; no routine lead approval is currently justified
- **Consulted:** Qualified owner for applicable privacy, marketing, contractual, and contact restrictions

## Prerequisites

Before using this process:

1. Designate one system of record for active leads.
2. Assign the person or role responsible for new-lead ownership.
3. Verify applicable permission, opt-out, and do-not-contact rules by outreach channel and jurisdiction.
4. Define the minimum service-fit criteria.
5. Define the next lifecycle stage and its entry criteria.

Until those prerequisites are complete, use this SOP only as a controlled draft and do not initiate bulk outreach.

## Working Definition

A **lead** is a contactable person or organization with plausible service fit and an authorized, owned next action.

Do not classify a person as an active lead merely because their contact information is available.

## Minimum Record

Capture only information that changes action, ownership, restrictions, fit, or a metric someone actively uses:

- Contact name or organization when known
- Usable contact method
- Received or selected timestamp
- Source channel
- Inbound or outbound direction
- Brief service need when known
- Initial fit result when applicable
- Permission, opt-out, or contact restriction status when applicable
- One owner
- One next action and due time, or one closure reason

Optional analytical attributes are:

- Relationship: warm, cold, or unknown
- Interaction scale: one-to-one or one-to-many campaign source

Delete optional fields that do not support a demonstrated decision or used metric.

## Procedure

### A. Receive or Select the Prospect

1. **Identify the trigger.** Mark the record as either an inbound inquiry or an intentionally selected outbound prospect.
2. **Confirm plausible relevance.** Determine whether the person or organization could reasonably need and receive the service using the minimum verified fit criteria.
   - If clearly irrelevant, do not create an active lead. Record a closure reason only if a record already exists.
   - If relevance is unknown, continue only with the minimum action needed to determine fit.
3. **Check contact restrictions before outbound contact.** Review the verified permission, opt-out, and do-not-contact sources applicable to the channel.
   - If contact is prohibited, do not contact the prospect. Record the restriction in the approved system.
   - If permission is uncertain, hold outreach and escalate for verification.

### B. Find or Create the Record

4. **Search the designated system of record** using the available contact method and name.
5. **Update the existing record** when the prospect already exists. Do not create a duplicate.
6. **Create one minimal record** when no matching record exists.
7. **Record the source independently** from relationship temperature and interaction scale.
8. **Capture only the minimum record fields** listed above.

### C. Decide and Assign

9. **Apply the verified initial fit criteria.**
   - If the prospect is not a fit, close the lead with one factual reason.
   - If information is missing, assign one minimum-information follow-up action.
   - If the prospect appears to fit, continue.
10. **Assign one accountable owner.** Do not assign ownership to a department or shared queue without a named role responsible for clearing it.
11. **Set one next action and due time.** Do not add multiple speculative tasks.
12. **Send or perform the first authorized response** through the appropriate channel.
13. **Record the result.** Move the lead to the verified next stage or close it with a reason and any contact restriction.

## Classification Guidance

Do not force a lead into one combined four-bucket taxonomy. Record dimensions separately only when useful:

| Dimension | Examples |
|---|---|
| Relationship | Warm, cold, unknown |
| Direction | Inbound, outbound |
| Interaction scale | One-to-one, one-to-many campaign source |
| Source channel | Referral, existing customer, Google Local Services, Facebook, Nextdoor, direct mail, door-to-door, other |

Advertising and marketing are upstream activities that may create inquiries or identify prospects. They require separate SOPs only when their recurring work has a distinct trigger, outcome, and owner.

## Exceptions and Escalation

| Condition | Action | Escalate to | Target |
|---|---|---|---|
| Contact permission or restriction is unclear | Hold outreach and preserve the record without messaging | Qualified compliance/legal owner | Unset |
| Duplicate ownership exists | Stop parallel outreach and select one owner | Process owner | Unset |
| Initial fit cannot be determined | Ask only the minimum clarifying question | Lead owner | Unset |
| System of record is unavailable | Record the minimum information once in the approved fallback | Process owner/system owner | Unset |
| Prospect requests no further contact | Stop outreach and record the restriction | Process owner if suppression fails | Immediately |

Do not invent an SLA. Set targets only after measuring actual performance and confirming customer commitments.

## Failure Modes

- **Duplicate lead:** Merge or link records using the system's verified procedure and retain one owner.
- **Missing owner:** Assign an accountable person or close the record; do not leave it in an unowned queue.
- **Missing next action:** Add one justified next action or close the record.
- **Unauthorized contact attempt:** Stop further outreach, record the issue, apply the appropriate restriction, and escalate under the verified policy.
- **Incorrect source:** Correct the source without changing historical decision-log entries.
- **Repeated missing information:** Fix the upstream capture method before adding downstream inspection.

## Success Criteria

The process is complete when exactly one of these states exists:

1. The lead has one owner, one authorized next action, and a due time.
2. The lead has moved to the verified next lifecycle stage.
3. The lead is closed with a factual reason and any contact restriction recorded.

## Initial Metrics

Measure before establishing targets:

- Time from receipt or selection to ownership
- Time from inbound receipt to first authorized response
- Percentage of active leads with one owner and next action
- Duplicate-record rate
- Lead aging
- Transition rate to the verified next stage
- Closure reasons by source
- Contact-restriction failures

Label manually reconstructed values as estimates. Assign an owner and definition to each retained metric.

## Pilot and Review

1. **Run the process manually** for a defined pilot period.
2. **Record exceptions and unused fields.**
3. **Delete fields and steps that do not support decisions, obligations, or used metrics.**
4. **Review the decision log** before restoring deleted work.
5. **Consider automation only after** rules, volume, exceptions, fallback, monitoring, and ownership are stable.

## Approval Checklist

- [ ] Accountable process owner assigned
- [ ] Executor role assigned
- [ ] System of record named
- [ ] Initial fit criteria defined
- [ ] Next lifecycle stage and entry criteria verified
- [ ] Contact permission and restriction rules verified
- [ ] Pilot period defined
- [ ] Baseline measurement method approved
- [ ] Review cadence assigned

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-09-04 | Agent draft | Created proposed SOP from raw intake and Elon Algorithm review. |
