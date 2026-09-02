# Jobber integration runbook

> **Live-documentation validation required:** the build environment could not reach Jobber's developer site (the documentation host returned HTTP 403 on 2026-09-02). The endpoints, `X-JOBBER-GRAPHQL-VERSION` header, cursor connection shape, OAuth form exchange, and HMAC header below follow Jobber's documented integration conventions, but the configured API version and checked-in operations must be validated in Jobber's current GraphiQL/schema explorer before production use. Schema-sensitive details are intentionally centralized in `.env` and `src/integrations/jobber/types/entities.ts`.

## API and authentication

* GraphQL endpoint: `https://api.getjobber.com/api/graphql`.
* Authorization endpoint: `https://api.getjobber.com/api/oauth/authorize`.
* Token endpoint: `https://api.getjobber.com/api/oauth/token`.
* Register the exact `JOBBER_REDIRECT_URI` in the Jobber developer app, then visit `/auth/jobber`. The callback validates signed state and exchanges the code. Access and refresh tokens, server-reported lifetime, and optional scopes are saved in PostgreSQL.
* Access tokens refresh 60 seconds before expiry. Refresh-token rotation is saved atomically. A failed refresh deletes the invalid connection and tells the operator to reconnect.
* API versions are date strings sent in `X-JOBBER-GRAPHQL-VERSION`. Set a version supported by the installed app; do not silently advance it.

Official starting points: [Jobber Developer Center](https://developer.getjobber.com/), [Getting Started](https://developer.getjobber.com/docs/getting_started/), [GraphQL API](https://developer.getjobber.com/docs/using_jobbers_api/).

## Queries and pagination

Connection queries request `first: 100`, pass `after`, read `nodes`, and continue using `pageInfo.hasNextPage/endCursor`. The client prevents a non-advancing cursor. Supported full-sync resources are clients, properties, jobs, visits, quotes, invoices, and payments. Operations are read-only. Jobber can vary availability by permissions, app approval, API version, and account plan; confirm every checked-in operation in the current schema explorer and grant the corresponding read scopes.

The transport uses a 15-second timeout, retries network and 5xx failures twice, honors `Retry-After` on HTTP 429 with a 30-second cap, and surfaces GraphQL response errors. Jobber can enforce cost and request limits beyond HTTP 429; reconciliation should be scheduled conservatively.

## Webhooks

Configure the Jobber app to send supported create/update/archive/delete topics to `https://YOUR-HOST/webhooks/jobber`. The receiver expects Jobber's base64 HMAC-SHA256 in `X-Jobber-Hmac-SHA256`, calculated over the exact request bytes, using the Jobber app client secret. Confirm the current documentation's secret selection and delivery/topic header names before registering production subscriptions.

The receiver accepts topic and delivery ID from Jobber headers, with documented-payload-style fallbacks. A stable delivery ID is required for deduplication. The payload is retained for diagnostics but is not used as a full authoritative entity. Processing performs a fresh resource sync. Unsupported topics fail visibly and are retried up to eight attempts.

Webhooks can be duplicated, delayed, missed, or arrive out of order. Run reconciliation periodically. Archived flags are mirrored where exposed for clients/properties. Hard deletion is not inferred from absence because a filtered/incomplete response must not erase business history.

## Production checklist

1. Review the current [Jobber developer documentation](https://developer.getjobber.com/) and schema explorer.
2. Pin a currently supported `JOBBER_API_VERSION` and validate all seven operations.
3. Confirm required scopes, token lifetime/rotation rules, webhook HMAC secret, headers, available topics, and rate-limit guidance.
4. Use an HTTPS public webhook URL and long random state, signing, and internal API secrets.
5. Restrict database access, backups, logs, and environment files; OAuth tokens are sensitive at rest.
6. Authorize Jobber, test a webhook, inspect `webhook_events`, run a full sync, and schedule reconciliation (for example, nightly with cron).
