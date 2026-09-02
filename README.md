# Hobbes

Hobbes is The Lawn Company's business systems and data foundation. This first phase mirrors read-only Jobber business data into PostgreSQL, keeps it fresh through full syncs, signed webhooks, and reconciliation, and offers typed services for deterministic business questions. It has no LLM, personal/Calvin integration, or autonomous Jobber writes.

## Included

* Jobber OAuth 2 authorization, PostgreSQL token storage, expiry tracking, refresh rotation, and reconnect handling.
* Typed GraphQL transport with centralized API version, timeout, retries, rate-limit handling, errors, and reusable cursor pagination.
* PostgreSQL migrations and normalized clients, properties, jobs, visits, quotes, invoices, and payments with original JSONB payloads.
* Idempotent signed webhook ingestion and a simple durable PostgreSQL-backed in-process worker.
* Full sync/reconciliation commands and a typed business service for active clients, addresses, open invoices, revenue, rankings, jobs, properties, and service history.
* Fastify health/internal endpoints, structured redacted logs, and mocked tests that require no Jobber account.

Read [the architecture](docs/architecture.md) and the important [Jobber validation/runbook](docs/jobber.md) before connecting production data.

## Requirements and setup

Install Node.js 20+, npm, Docker, and Docker Compose.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run dev
```

Fill every blank in `.env`. Generate secrets rather than reusing passwords:

```bash
openssl rand -base64 48 # OAUTH_STATE_SECRET
openssl rand -base64 48 # INTERNAL_API_KEY
```

Jobber webhook verification uses the Jobber app client secret, as prescribed by its HMAC convention. Keep `.env` private. The example database password is only for loopback local development.

## Connect Jobber

1. Create/configure the app in Jobber and register the exact `JOBBER_REDIRECT_URI`.
2. Confirm the current API version, read scopes, GraphQL operations, webhook signing directions, and topics as described in [docs/jobber.md](docs/jobber.md).
3. Start Hobbes and open `http://localhost:3000/auth/jobber`.
4. Approve access. On success the callback reports `connected: true`.
5. Run `npm run jobber:sync` and inspect progress logs. No token or record payload is logged.

## Run and operate

```bash
npm run dev                 # development server with reload
npm run build && npm start  # compiled server
npm run jobber:sync         # initial/full mirror upsert
npm run jobber:reconcile    # periodic drift-correcting full upsert
npm test                    # mocked unit tests
npm run typecheck
npm run lint
```

Schedule `jobber:reconcile` conservatively (for example nightly) using the host scheduler. Only run one reconciliation at a time. Both sync commands continue resource-by-resource but stop on the first resource error so automation receives a nonzero exit code and the state table identifies the failure.

## Endpoints

* `GET /health` checks the process and database without exposing diagnostics.
* `GET /auth/jobber` and `GET /auth/jobber/callback` implement OAuth.
* `POST /webhooks/jobber` verifies and queues raw signed requests.
* `GET /api/clients?q=...`, `GET /api/clients/:id`, `GET /api/invoices/open`, and `GET /api/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD` query local data.
* `POST /internal/jobber/sync` starts a full sync and returns immediately.

Every `/api` and `/internal` request needs `X-Internal-Api-Key`. These routes bind to `127.0.0.1` by default; put authentication/TLS at a trusted reverse proxy before exposing them.

## Test a webhook

Use a Jobber test delivery whenever available. A hand-built request is only useful for local receiver testing because it is not a real Jobber event:

```bash
BODY='{"id":"local-1","topic":"client.updated","itemId":"example"}'
SIG=$(printf %s "$BODY" | openssl dgst -sha256 -hmac "$JOBBER_CLIENT_SECRET" -binary | base64)
curl -i http://localhost:3000/webhooks/jobber \
  -H 'Content-Type: application/json' -H "X-Jobber-Hmac-SHA256: $SIG" \
  -H 'X-Jobber-Topic: client.updated' -H 'X-Jobber-Webhook-Id: local-1' --data-binary "$BODY"
```

A new event returns 202; the same delivery returns 200 with `duplicate: true`. Inspect status without exposing payloads: `SELECT id, topic, status, attempt_count, last_error FROM webhook_events ORDER BY received_at DESC;`.

## Common errors

* **Configuration validation error:** a required variable is blank, a URL/version is malformed, or a secret is too short.
* **Database unreachable:** start Compose, check port 5432, then rerun migrations.
* **Invalid OAuth callback:** restart at `/auth/jobber`; state is signed and deliberately rejected if modified.
* **Reconnect Jobber:** the refresh grant failed or was revoked; visit `/auth/jobber` again.
* **GraphQL unknown field/permission error:** use Jobber's current schema explorer, scopes, and supported version; update the centralized resource operation/mapper rather than weakening types elsewhere.
* **Webhook 401:** verify exact raw request forwarding and the current Jobber signing secret/header instructions.
* **Webhook stays failed:** inspect its safe error and topic. Unknown topics are deliberately not guessed.
