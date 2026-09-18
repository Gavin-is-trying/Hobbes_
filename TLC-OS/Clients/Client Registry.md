---
document_type: client-registry
process: client-intake
area: tlc-os
stage: clients
status: proposed
created_at: 2026-09-18
process_owner: unassigned
sop: ./SOPs/Client Intake SOP.md
---

# Client Registry

The client registry is the sorted list of client entries, viewed and maintained on
the website's Clients page. Add entries using the short form in the
[Client Intake SOP](./SOPs/Client%20Intake%20SOP.md) and the
[Client Entry Template](./SOPs/Client%20Entry%20Template.md).

## System of Record

Client records live in the TLC-OS client database: a hosted Postgres database
behind the Clients page. The page loads entries from the database on open and
saves new entries through server API routes. The connection string is supplied
through the `DATABASE_URL` environment variable and is never committed.

> **Privacy.** This repository publishes every document under `TLC-OS/`. Do not
> commit real customer names, phone numbers, email addresses, or street addresses
> here. This page defines the format and sort order only; the database is the
> only store for actual client data.

## Format

Each database record has exactly these columns: `first_name`, `last_name`,
`phone`, `email`, `address`, `notes`. The table below shows the same format for
reference; leave it empty.

## Sort Rule

List every client by **last name, A to Z**, then by first name A to Z when two
clients share a last name. Compare case-insensitively. The Clients page applies
this rule to database entries when it loads them.

| # | Last name | First name | Phone | Email | Address | Notes |
|---|---|---|---|---|---|---|
| | | | | | | |
