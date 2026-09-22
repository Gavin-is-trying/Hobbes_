import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test, { beforeEach, type TestContext } from "node:test";
import { setImmediate as nextTurn } from "node:timers/promises";
import { inspect } from "node:util";
import { getSession, getSubmission, listSubmissions, login, logout, publishSubmission, saveSubmission } from "./intake-server.ts";
import type { ClientPayload, ProcessPayload, Submission } from "./intake-types.ts";

const site = "https://intake.example.test";
const supabase = "https://intake-test.supabase.co";
const databaseUrl = `${supabase}/rest/v1/intake_submissions`;
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherOwner = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const id = "12345678-1234-4123-8123-123456789abc";
const accessToken = "TEST_PRIVATE_ACCESS_TOKEN";
const refreshToken = "TEST_PRIVATE_REFRESH_TOKEN";
const password = "TEST_PRIVATE_PASSWORD";
const anonKey = "TEST_ANON_KEY";
const serviceKey = "TEST_PRIVATE_SERVICE_ROLE_KEY";
const githubToken = "TEST_PRIVATE_GITHUB_TOKEN";
const repository = "intake-test-owner/intake-test-repo";
const github = `https://api.github.com/repos/${repository}`;
const prUrl = `https://github.com/${repository}/pull/42`;
const publicText = "Reviewed public summary. No private client details.";
const cookieName = "hobbes-intake-session";
const columns = "id,kind,payload,created_at,publication_text,pr_url";
const client: ClientPayload = {
  firstName: "PRIVATE_FIRST_NAME",
  lastName: "PRIVATE_LAST_NAME",
  phone: "PRIVATE_PHONE",
  email: "private-client@example.test",
  address: "PRIVATE_STREET_ADDRESS",
  notes: "PRIVATE_INTAKE_NOTES",
};
const processPayload: ProcessPayload = {
  customerType: "Internal Customers",
  selectedStep: "03",
  sourceText: "PRIVATE_SOURCE_NOTES",
  actions: ["PRIVATE_PROCESS_ACTION"],
};
const credentials = { email: "private-login@example.test", password };
const saved: Submission = {
  id, kind: "client", payload: client, created_at: "2026-09-20T12:34:56.123456+00:00",
  publication_text: null, pr_url: null,
};
const frozen: Submission = { ...saved, publication_text: publicText };
const linked: Submission = { ...frozen, pr_url: prUrl };
const saveInput = { id, kind: "client", payload: client };
const publishInput = { confirmed: true, text: publicText };
const privateValues = [
  accessToken, refreshToken, password, serviceKey, githubToken, credentials.email,
  ...Object.values(client), processPayload.sourceText, ...processPayload.actions,
];
const providerDetail = privateValues.join(" | ");
const environment = {
  INTAKE_ENABLED: "true",
  SUPABASE_URL: supabase,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  INTAKE_ALLOWED_USER_IDS: ` ${owner}, ${otherOwner} `,
  GITHUB_INTAKE_TOKEN: githubToken,
  GITHUB_REPOSITORY: repository,
  GITHUB_BASE_BRANCH: "main",
};

function assertPrivate(value: unknown) {
  // Unlike JSON.stringify, inspect also exposes Error messages/stacks passed directly to console.
  const text = typeof value === "string" ? value : inspect(value, { depth: null, maxStringLength: null, maxArrayLength: null });
  for (const secret of privateValues) assert.ok(!text.includes(secret), "Private data appeared in an error or log");
}

// Node runs these top-level tests serially. Restore both environment and mocks per test.
beforeEach((t) => {
  assert.ok("mock" in t);
  const previous = Object.keys(environment).map((key) => [key, process.env[key]] as const);
  Object.assign(process.env, environment);
  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const blocked = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unscripted fetch blocked"); });
  const log = t.mock.method(console, "error", () => {});
  t.after(() => {
    assert.equal(blocked.mock.callCount(), 0, "An unexpected request was blocked; no real network calls are permitted");
    assertPrivate(log.mock.calls.map((call) => call.arguments));
  });
});

type RequestOptions = {
  method?: string;
  body?: unknown;
  raw?: string;
  origin?: string | null;
  cookie?: string | null;
  headers?: Record<string, string>;
};
function request(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  const origin = options.origin === undefined ? site : options.origin;
  const cookie = options.cookie === undefined ? `unrelated=1; ${cookieName}=${accessToken}; other=2` : options.cookie;
  if (origin !== null) headers.set("origin", origin);
  if (cookie !== null) headers.set("cookie", cookie);
  const body = options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
  if (body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  return new Request(`${site}/api/intake${path}`, { method: options.method ?? "POST", headers, body });
}
function saveRequest(body: unknown = saveInput, options: RequestOptions = {}) {
  return request("/submissions", { body, ...options });
}
function publishRequest(body: unknown = publishInput, options: RequestOptions = {}) {
  return request(`/submissions/${id}/publish`, { body, ...options });
}
function listRequest(kind = "client", options: RequestOptions = {}, offset = 0) {
  return request(`/submissions?kind=${kind}&offset=${offset}`, { method: "GET", origin: null, ...options });
}
function getRequest(idValue = id, options: RequestOptions = {}) {
  return request(`/submissions/${encodeURIComponent(idValue)}`, { method: "GET", origin: null, ...options });
}

async function result(response: Response, status = 200) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  return response.json();
}
async function problem(response: Response, status: number) {
  assert.equal(response.headers.get("set-cookie"), null, "Errors must not establish or refresh a session");
  const data = await result(response, status);
  assert.equal(typeof data.error, "string");
  assert.ok(data.error.length > 0);
  assertPrivate(data);
  return data.error as string;
}

type Call = { url: URL; method: string; headers: Headers; body: unknown };
type Step = {
  url: string;
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
  data?: unknown;
  status?: number;
  raw?: string;
  error?: Error;
  waitFor?: Promise<void>;
  inspect?: (call: Call) => void;
};
function mockRequests(t: TestContext, steps: Step[]) {
  const remaining = [...steps];
  const calls: Call[] = [];
  const failures: unknown[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    let step: Step;
    try {
      assert.equal(typeof input, "string");
      const url = new URL(String(input));
      const call: Call = {
        url, method: init?.method ?? "GET", headers: new Headers(init?.headers),
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      };
      calls.push(call);
      const next = remaining.shift();
      assert.ok(next, `Unexpected ${call.method} ${url.pathname}`);
      step = next;
      assert.equal(url.origin + url.pathname, step.url);
      assert.deepEqual([...url.searchParams].sort(), Object.entries(step.query ?? {}).sort());
      assert.equal(call.method, step.method ?? "GET");
      assert.deepEqual(call.body, step.body);
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.redirect, "error");
      assert.ok(init?.signal instanceof AbortSignal);
      if (url.origin === supabase) {
        const key = url.pathname.startsWith("/rest/") ? serviceKey : anonKey;
        assert.equal(call.headers.get("apikey"), key);
        assert.equal(call.headers.get("authorization"), url.pathname.startsWith("/rest/")
          ? `Bearer ${serviceKey}` : url.pathname.endsWith("/user") ? `Bearer ${accessToken}` : null);
      } else {
        assert.equal(url.origin, "https://api.github.com");
        assert.equal(call.headers.get("authorization"), `Bearer ${githubToken}`);
        assertPrivate(call.body ?? "");
      }
      step.inspect?.(call);
    } catch (error) {
      // Handlers sanitize thrown fetch errors. Preserve assertion failures outside that catch boundary.
      failures.push(error);
      throw error;
    }
    if (step.waitFor) await step.waitFor;
    if (step.error) throw step.error;
    return new Response(step.raw ?? JSON.stringify("data" in step ? step.data : {}), {
      status: step.status ?? 200, headers: { "Content-Type": "application/json" },
    });
  });
  t.after(() => {
    assert.deepEqual(failures, [], "Mock request assertions failed inside a handler");
    assert.equal(remaining.length, 0, "Expected upstream requests were not made");
  });
  return calls;
}
function auth(userId = owner): Step {
  return { url: `${supabase}/auth/v1/user`, data: { id: userId, email: credentials.email } };
}
function token(expiresIn = 1800): Step {
  return {
    url: `${supabase}/auth/v1/token`, method: "POST", query: { grant_type: "password" }, body: credentials,
    data: { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, user: { id: owner } },
  };
}
function ownedQuery(extra: Record<string, string> = {}) {
  return { select: columns, owner_id: `eq.${owner}`, id: `eq.${id}`, ...extra };
}
function readSaved(rows: Submission[] = [saved]): Step {
  return { url: databaseUrl, query: ownedQuery(), data: rows };
}
function insert(row: Submission = saved): Step {
  return {
    url: databaseUrl, method: "POST", query: { select: "id", on_conflict: "id" },
    body: { id: row.id, owner_id: owner, kind: row.kind, payload: row.payload }, data: [{ id: row.id }],
    inspect: (call) => assert.equal(call.headers.get("prefer"), "resolution=ignore-duplicates,return=representation"),
  };
}
function freeze(data: Submission[] = [frozen]): Step {
  return { url: databaseUrl, method: "PATCH", query: ownedQuery({ publication_text: "is.null" }), body: { publication_text: publicText }, data };
}
function link(data: Submission[] = [linked]): Step {
  return { url: databaseUrl, method: "PATCH", query: ownedQuery(), body: { pr_url: prUrl }, data };
}
function list(kind = "client", rows: Submission[] = [saved], offset = 0): Step {
  return {
    url: databaseUrl, query: { select: columns, owner_id: `eq.${owner}`, kind: `eq.${kind}`, order: "created_at.desc,id.desc", limit: "5", offset: String(offset) },
    data: rows,
  };
}
function sizedProcessPayload(size: number, action: string): ProcessPayload {
  const payload = { ...processPayload, sourceText: "", actions: Array<string>(100).fill(action) };
  payload.sourceText = "s".repeat(size - Buffer.byteLength(JSON.stringify(payload), "utf8"));
  assert.ok(payload.sourceText.length > 0 && payload.sourceText.length <= 50000);
  assert.ok(action.length > 0 && action.length <= 2000);
  assert.equal(Buffer.byteLength(JSON.stringify(payload), "utf8"), size);
  return payload;
}

// One adapter happy-path fixture only: recover a known PR with the exact frozen content.
// Branch creation, Git writes, and the adapter's validation matrix belong to github-intake.test.ts.
function existingPull(inspect?: (call: Call) => void): Step[] {
  const headSha = "b".repeat(40);
  const blobSha = "c".repeat(40);
  const path = `TLC-OS/Website Intake/intake/${id}.md`;
  const markdown = `---\nid: ${id}\nkind: client\ncreated_at: "${saved.created_at}"\nstatus: raw\n---\n\n# Website intake\n\n\`\`\`text\n${publicText}\n\`\`\`\n`;
  return [
    {
      url: `${github}/pulls`, query: { state: "all", head: `intake-test-owner:intake/${id}`, per_page: "100" }, inspect,
      data: [{
        number: 42, state: "open", html_url: prUrl,
        base: { ref: "main", sha: "a".repeat(40), repo: { full_name: repository } },
        head: { ref: `intake/${id}`, sha: headSha, repo: { full_name: repository } },
      }],
    },
    {
      url: `${github}/contents/TLC-OS/Website%20Intake/intake/${id}.md`, query: { ref: headSha },
      data: { type: "file", path, sha: blobSha, encoding: "base64", content: Buffer.from(markdown).toString("base64") },
    },
    { url: `${github}/pulls/42/files`, query: { per_page: "100" }, data: [{ filename: path, status: "added", sha: blobSha }] },
  ];
}

test("disabled or incomplete authentication configuration fails closed without provider calls", async () => {
  const cases: [keyof typeof environment, string | undefined][] = [
    ["INTAKE_ENABLED", undefined], ["INTAKE_ENABLED", "false"], ["SUPABASE_URL", undefined],
    ["SUPABASE_URL", "https://intake-test.supabase.co.attacker.test"],
    ["SUPABASE_ANON_KEY", undefined], ["INTAKE_ALLOWED_USER_IDS", " , "],
  ];
  for (const [key, value] of cases) {
    Object.assign(process.env, environment);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    await problem(await login(request("/session", { body: credentials, cookie: null })), 503);
    await problem(await getSession(request("/session", { method: "GET" })), 503);
    await problem(await listSubmissions(listRequest()), 503);
    await problem(await getSubmission(getRequest(), id), 503);
    await problem(await saveSubmission(saveRequest()), 503);
    await problem(await publishSubmission(publishRequest(), id), 503);
  }
});

test("missing service-role configuration never falls back to a browser or user database key", async (t) => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  mockRequests(t, [auth(), auth(), auth(), auth()]);
  await problem(await getSubmission(getRequest(), id), 503);
  await problem(await listSubmissions(listRequest()), 503);
  await problem(await saveSubmission(saveRequest()), 503);
  await problem(await publishSubmission(publishRequest(), id), 503);
});

test("login returns authenticated and the verified user ID with a secure, short-lived access-token cookie", async (t) => {
  const lifetimes = [[1800, 1800], [7200, 3600], [123.9, 123]];
  // The verified user endpoint, not the token response's embedded user, determines the ID.
  mockRequests(t, lifetimes.flatMap(([ttl]) => [token(ttl), auth(otherOwner)]));
  for (const [, expected] of lifetimes) {
    const response = await login(request("/session", { body: credentials, cookie: null }));
    assert.deepEqual(await result(response), { authenticated: true, userId: otherOwner });
    const cookies = response.headers.getSetCookie();
    assert.equal(cookies.length, 1);
    const parts = cookies[0].split("; ");
    assert.equal(parts[0], `${cookieName}=${accessToken}`);
    for (const attribute of ["Path=/", "HttpOnly", "Secure", "SameSite=Strict", `Max-Age=${expected}`]) {
      assert.ok(parts.includes(attribute), `Cookie missing ${attribute}`);
    }
    assert.ok(!cookies[0].includes(password));
    assert.ok(!cookies[0].includes(refreshToken));
    assert.ok(!cookies[0].includes(credentials.email));
    assert.ok(!parts.some((part) => part.toLowerCase().startsWith("domain=")));
  }
});

test("login rejects provider failures, non-allowlisted accounts, and invalid session TTL without cookies", async (t) => {
  mockRequests(t, [
    { ...token(), status: 400, data: { message: providerDetail } },
    { ...token(), status: 429, data: { message: providerDetail } },
    { ...token(), status: 500, data: { message: providerDetail } },
    token(), auth("cccccccc-cccc-4ccc-8ccc-cccccccccccc"),
    token(0), auth(),
  ]);
  for (const status of [401, 429, 503, 403, 503]) {
    await problem(await login(request("/session", { body: credentials, cookie: null })), status);
  }
});

test("session verification does not refresh credentials and logout expires the same protected cookie", async (t) => {
  mockRequests(t, [auth()]);
  const session = await getSession(request("/session", { method: "GET", origin: null }));
  assert.deepEqual(await result(session), { authenticated: true, userId: owner });
  assert.equal(session.headers.get("set-cookie"), null);
  const response = await logout(request("/session", { method: "DELETE", cookie: null }));
  assert.deepEqual(await result(response), { authenticated: false });
  assert.equal(response.headers.get("set-cookie"), `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`);
});

test("missing, malformed, and oversized cookies cannot reach auth, storage, or GitHub", async () => {
  for (const cookie of [null, "unrelated=1", `${cookieName}=`, `${cookieName}=bad%0Atoken`, `${cookieName}=${"a".repeat(8001)}`]) {
    await problem(await getSession(request("/session", { method: "GET", cookie })), 401);
    await problem(await listSubmissions(listRequest("client", { cookie })), 401);
    await problem(await getSubmission(getRequest(id, { cookie }), id), 401);
    await problem(await saveSubmission(saveRequest(saveInput, { cookie })), 401);
    await problem(await publishSubmission(publishRequest(publishInput, { cookie }), id), 401);
  }
});

test("expired sessions and authenticated outsiders cannot access the database or GitHub", async (t) => {
  const rejected = [
    { step: { ...auth(), status: 401, data: { message: providerDetail } }, status: 401 },
    { step: { ...auth(), status: 403, data: { message: providerDetail } }, status: 401 },
    { step: auth("cccccccc-cccc-4ccc-8ccc-cccccccccccc"), status: 403 },
  ];
  mockRequests(t, rejected.flatMap(({ step }) => [step, step, step, step, step]));
  for (const { status } of rejected) {
    await problem(await getSession(request("/session", { method: "GET" })), status);
    await problem(await listSubmissions(listRequest()), status);
    await problem(await getSubmission(getRequest(), id), status);
    await problem(await saveSubmission(saveRequest()), status);
    await problem(await publishSubmission(publishRequest(), id), status);
  }
});

test("every mutating handler rejects absent, null, cross-site, or wrong-port Origin before any fetch", async () => {
  for (const origin of [null, "null", "https://attacker.test", "https://intake.example.test:444", "http://intake.example.test"]) {
    await problem(await login(request("/session", { body: credentials, origin })), 403);
    await problem(await logout(request("/session", { method: "DELETE", origin })), 403);
    await problem(await saveSubmission(saveRequest(saveInput, { origin })), 403);
    await problem(await publishSubmission(publishRequest(publishInput, { origin }), id), 403);
  }
});

test("malformed JSON, missing bodies, non-object JSON, and non-JSON media types are rejected", async (t) => {
  mockRequests(t, [auth(), auth(), auth(), auth()]);
  await problem(await login(request("/session", { raw: "{broken" })), 400);
  await problem(await login(request("/session", { body: credentials, headers: { "content-type": "text/plain" } })), 415);
  await problem(await saveSubmission(request("/submissions", { headers: { "content-type": "application/json" } })), 400);
  await problem(await saveSubmission(saveRequest([])), 400);
  await problem(await saveSubmission(saveRequest(saveInput, { headers: { "content-type": "text/plain" } })), 415);
  await problem(await publishSubmission(publishRequest(publishInput, { raw: "{broken" }), id), 400);
});

test("login, save, and publish enforce byte limits even without a trustworthy Content-Length", async (t) => {
  mockRequests(t, [auth(), insert(), readSaved(), auth(), auth(), auth(), auth(), auth()]);
  const exactBody = JSON.stringify(saveInput).padEnd(400000, " ");
  assert.equal(Buffer.byteLength(exactBody, "utf8"), 400000);
  assert.deepEqual(await result(await saveSubmission(saveRequest(saveInput, { raw: exactBody }))), { submission: saved });
  await problem(await login(request("/session", { body: credentials, headers: { "content-length": "8001" } })), 413);
  await problem(await login(request("/session", { raw: `"${"x".repeat(8000)}"` })), 413);
  await problem(await saveSubmission(saveRequest(saveInput, { headers: { "content-length": "400001" } })), 413);
  await problem(await saveSubmission(saveRequest(saveInput, { raw: `${exactBody} `, headers: { "content-length": "1" } })), 413);
  await problem(await publishSubmission(publishRequest(publishInput, { headers: { "content-length": "210001" } }), id), 413);
  await problem(await publishSubmission(publishRequest(publishInput, { raw: `"${"x".repeat(210000)}"` }), id), 413);

  let cancelled = false;
  const bytes = new TextEncoder().encode("é".repeat(200_001));
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(bytes.subarray(0, 200_000)); controller.enqueue(bytes.subarray(200_000)); },
    cancel() { cancelled = true; },
  });
  const streaming = new Request(`${site}/api/intake/submissions`, {
    method: "POST", body: stream, duplex: "half",
    headers: { origin: site, cookie: `${cookieName}=${accessToken}`, "content-type": "application/json" },
  } as RequestInit & { duplex: "half" });
  await problem(await saveSubmission(streaming), 413);
  assert.equal(cancelled, true, "Stop consuming an oversized streaming request");
});

test("the normalized payload has its own inclusive 400000-byte limit after UTF-8 decoding", async (t) => {
  const payload = sizedProcessPayload(400000, "\ufffd".repeat(1300));
  const row: Submission = { ...saved, kind: "process", payload };
  mockRequests(t, [auth(), insert(row), readSaved([row]), auth()]);
  for (const extra of ["", "s"]) {
    const normalized = { ...payload, sourceText: payload.sourceText + extra };
    assert.equal(Buffer.byteLength(JSON.stringify(normalized), "utf8"), 400000 + extra.length);
    // Each invalid single-byte UTF-8 sequence decodes to a three-byte replacement character.
    // Both wire bodies fit; only the second normalized payload exceeds the storage guard.
    const bytes = Buffer.from(JSON.stringify({ id, kind: "process", payload: normalized }).replaceAll("\ufffd", "\x80"), "latin1");
    assert.ok(bytes.byteLength < 400000);
    const response = await saveSubmission(new Request(saveRequest(), { body: new Uint8Array(bytes) }));
    if (extra) assert.match(await problem(response, 413), /payload is too large/i);
    else assert.deepEqual(await result(response), { submission: row });
  }
});

test("invalid UUIDs, offsets, kinds, and representative payload constraints never reach storage", async (t) => {
  const invalid = [
    { ...saveInput, id: "not-a-uuid" },
    { ...saveInput, id: "12345678-1234-1123-8123-123456789abc" },
    { ...saveInput, kind: "admin" },
    { ...saveInput, payload: { ...client, firstName: " ", lastName: " " } },
    { ...saveInput, payload: { ...client, email: "not an email" } },
    { ...saveInput, payload: { ...client, notes: "x".repeat(10001) } },
    { ...saveInput, payload: { ...client, address: "hidden\0suffix" } },
    { id, kind: "process", payload: { ...processPayload, selectedStep: "09" } },
    { id, kind: "process", payload: { ...processPayload, actions: [] } },
    { id, kind: "process", payload: { ...processPayload, actions: Array(101).fill("Action") } },
    { id, kind: "process", payload: { ...processPayload, actions: ["x".repeat(2001)] } },
    { id, kind: "process", payload: { ...processPayload, sourceText: "x".repeat(50001) } },
  ];
  const invalidOffsets = ["-1", "1.5", "NaN", "Infinity", "9007199254740992", "1000001"];
  mockRequests(t, Array.from({ length: invalid.length + invalidOffsets.length + 3 }, () => auth()));
  for (const body of invalid) await problem(await saveSubmission(saveRequest(body)), 400);
  await problem(await publishSubmission(publishRequest(), "id=eq.anything"), 400);
  await problem(await getSubmission(getRequest("not-a-uuid"), "not-a-uuid"), 400);
  await problem(await listSubmissions(listRequest("anything")), 400);
  for (const offset of invalidOffsets) {
    await problem(await listSubmissions(request(`/submissions?kind=client&offset=${offset}`, { method: "GET", origin: null })), 400);
  }
});

test("GET pages five owner-filtered records with correct cursors and bounded maximum-size responses", async (t) => {
  const payload = sizedProcessPayload(400000, "\u0001".repeat(650));
  // Six-byte JSON escapes exercise the worst-case expansion of 50000 publication characters.
  const rows: Submission[] = Array.from({ length: 5 }, (_, index) => ({
    ...saved, id: `12345678-1234-4123-8123-${String(5 - index).padStart(12, "0")}`,
    kind: "process", payload, publication_text: "\u0001".repeat(50000), pr_url: prUrl,
  }));
  mockRequests(t, [
    auth(), list("client", []),
    auth(), list("process", rows),
    auth(), list("process", rows, 5),
    auth(), list("process", rows.slice(0, 2), 10),
    auth(), list("process", [], 1_000_000),
  ]);
  const defaultOffset = request("/submissions?kind=client", { method: "GET", origin: null });
  assert.deepEqual(await result(await listSubmissions(defaultOffset)), { submissions: [], nextOffset: null });
  for (const offset of [0, 5]) {
    const response = await listSubmissions(request(`/submissions?kind=process&offset=${offset}&owner_id=${otherOwner}&limit=999&order=created_at.asc`, { method: "GET", origin: null }));
    const responseBytes = (await response.clone().arrayBuffer()).byteLength;
    assert.ok(responseBytes < 4_500_000, `Maximum-size five-record response was ${responseBytes} bytes`);
    assert.deepEqual(await result(response), { submissions: rows, nextOffset: offset + 5 });
    assert.equal(response.headers.get("set-cookie"), null);
  }
  assert.deepEqual(await result(await listSubmissions(listRequest("process", {}, 10))), { submissions: rows.slice(0, 2), nextOffset: null });
  assert.deepEqual(await result(await listSubmissions(listRequest("process", {}, 1_000_000))), { submissions: [], nextOffset: null });
});

test("saving either intake kind uses the authenticated owner and ignores forged server-owned fields", async (t) => {
  const processRow: Submission = { ...saved, kind: "process", payload: processPayload };
  mockRequests(t, [auth(), insert(), readSaved(), auth(), insert(processRow), readSaved([processRow])]);
  for (const row of [saved, processRow]) {
    const body = {
      id: id.toUpperCase(), kind: row.kind, payload: { ...row.payload, ignored: "not a schema field" },
      owner_id: otherOwner, created_at: "1900-01-01", publication_text: publicText, pr_url: prUrl,
    };
    assert.deepEqual(await result(await saveSubmission(saveRequest(body))), { submission: row });
  }
});

test("an identical save retry ignores the duplicate and returns the original, never an overwrite", async (t) => {
  const calls = mockRequests(t, [auth(), insert(), readSaved(), auth(), { ...insert(), data: [] }, readSaved([linked])]);
  assert.deepEqual(await result(await saveSubmission(saveRequest())), { submission: saved });
  const reordered = Object.fromEntries(Object.entries(client).reverse());
  assert.deepEqual(await result(await saveSubmission(saveRequest({ ...saveInput, payload: reordered }))), { submission: linked });
  assert.equal(calls.filter((call) => call.method === "PATCH").length, 0);
});

test("duplicate IDs with different input conflict, and another owner's ID is never returned or overwritten", async (t) => {
  const changed = { ...saved, payload: { ...client, notes: "Changed private notes" } };
  const wrongKind: Submission = { ...saved, kind: "process", payload: processPayload };
  const calls = mockRequests(t, [
    auth(), { ...insert(changed), data: [] }, readSaved(),
    auth(), { ...insert(wrongKind), data: [] }, readSaved(),
    auth(), { ...insert(), data: [] }, readSaved([]),
  ]);
  await problem(await saveSubmission(saveRequest({ ...saveInput, payload: changed.payload })), 409);
  await problem(await saveSubmission(saveRequest({ id, kind: "process", payload: processPayload })), 409);
  await problem(await saveSubmission(saveRequest()), 404);
  assert.equal(calls.filter((call) => call.method === "PATCH").length, 0);
});

test("publication requires literal confirmation and nonblank bounded text before reading any record", async (t) => {
  const invalid = [
    { text: publicText }, { confirmed: false, text: publicText }, { confirmed: "true", text: publicText },
    { confirmed: true, text: "  " }, { confirmed: true, text: "x".repeat(50001) },
    { confirmed: true, text: "approved\0hidden" },
  ];
  mockRequests(t, invalid.map(() => auth()));
  for (const body of invalid) await problem(await publishSubmission(publishRequest(body), id), 400);
});

test("single-record GET retrieves the owner's record; GET and publish refuse missing or foreign IDs", async (t) => {
  const missingId = "22345678-1234-4123-8123-123456789abc";
  mockRequests(t, [
    auth(), readSaved([linked]),
    auth(otherOwner), { ...readSaved([]), query: ownedQuery({ owner_id: `eq.${otherOwner}` }) },
    auth(), { ...readSaved([]), query: ownedQuery({ id: `eq.${missingId}` }) },
    auth(), readSaved([]),
  ]);
  const ownRequest = request(`/submissions/${id.toUpperCase()}?owner_id=${otherOwner}`, { method: "GET", origin: null });
  const response = await getSubmission(ownRequest, id.toUpperCase());
  assert.deepEqual(await result(response), { submission: linked });
  assert.equal(response.headers.get("set-cookie"), null);
  await problem(await getSubmission(getRequest(), id), 404);
  await problem(await getSubmission(getRequest(missingId), missingId), 404);
  await problem(await publishSubmission(publishRequest({ ...publishInput, owner_id: otherOwner, payload: client }), id.toUpperCase()), 404);
});

test("altered publication text conflicts even when a PR link already exists", async (t) => {
  mockRequests(t, [auth(), readSaved([frozen]), auth(), readSaved([linked])]);
  for (let attempt = 0; attempt < 2; attempt++) {
    await problem(await publishSubmission(publishRequest({ ...publishInput, text: `${publicText} Changed.` }), id), 409);
  }
});

test("a competing freeze wins atomically; the losing publisher rereads and never calls GitHub", async (t) => {
  const winner = { ...saved, publication_text: "A different review won the race." };
  const calls = mockRequests(t, [
    auth(), readSaved(),
    // PostgreSQL's conditional UPDATE matches no row after the other request commits.
    freeze([]), readSaved([winner]),
    auth(), list("client", [winner]),
  ]);
  await problem(await publishSubmission(publishRequest(), id), 409);
  assert.deepEqual(await result(await listSubmissions(listRequest())), { submissions: [winner], nextOffset: null });
  assert.equal(calls.filter((call) => call.method === "PATCH").length, 1);
});

test("a failed or unreadable database freeze prevents every GitHub request and hides provider details", async (t) => {
  mockRequests(t, [
    auth(), readSaved(), { ...freeze(), status: 500, data: { message: providerDetail } },
    auth(), readSaved(), freeze(), { ...readSaved([frozen]), error: new Error(providerDetail) },
  ]);
  await problem(await publishSubmission(publishRequest(), id), 503);
  await problem(await publishSubmission(publishRequest(), id), 503);
});

test("missing GitHub configuration preserves the frozen record and does not contact GitHub", async (t) => {
  delete process.env.GITHUB_INTAKE_TOKEN;
  mockRequests(t, [auth(), readSaved(), freeze(), readSaved([frozen]), auth(), list("client", [frozen])]);
  assert.match(await problem(await publishSubmission(publishRequest(), id), 502), /record is saved/i);
  assert.deepEqual(await result(await listSubmissions(listRequest())), { submissions: [frozen], nextOffset: null });
});

test("GitHub failure leaves saved state; retry uses that frozen snapshot and persists a recovered PR URL", { timeout: 5000 }, async (t) => {
  let persisted: Submission = saved;
  const acknowledgement = Promise.withResolvers<void>();
  const [lookup] = existingPull();
  const calls = mockRequests(t, [
    auth(), readSaved(),
    { ...freeze(), waitFor: acknowledgement.promise }, readSaved([frozen]),
    {
      ...lookup, status: 500, data: { message: providerDetail },
      inspect: () => assert.deepEqual(persisted, frozen, "Freeze must finish BEFORE the first GitHub read, not just before a write"),
    },
    auth(), list("client", [frozen]),
    auth(), readSaved([frozen]),
    ...existingPull(() => assert.deepEqual(persisted, frozen)),
    { ...link(), inspect: () => { persisted = linked; } },
  ]);
  const publishing = publishSubmission(publishRequest(), id);
  try {
    await nextTurn();
    assert.equal(calls.length, 3, "Do not reread or contact GitHub while the freeze is unacknowledged");
    assert.deepEqual(persisted, saved);
  } finally {
    persisted = frozen;
    acknowledgement.resolve();
    await publishing;
  }
  assert.match(await problem(await publishing, 502), /record is saved.*GitHub transfer failed/i);
  assert.deepEqual(persisted, frozen);
  assert.deepEqual(await result(await listSubmissions(listRequest())), { submissions: [frozen], nextOffset: null });
  assert.deepEqual(await result(await publishSubmission(publishRequest(), id)), { submission: linked });
  assert.deepEqual(persisted, linked);
  assert.deepEqual(calls.filter((call) => call.method === "PATCH").map((call) => call.body), [
    { publication_text: publicText }, { pr_url: prUrl },
  ]);
});

test("an unchanged already-published record returns its link without any database writes or GitHub calls", async (t) => {
  mockRequests(t, [auth(), readSaved([linked])]);
  assert.deepEqual(await result(await publishSubmission(publishRequest(), id)), { submission: linked });
});

test("a PR whose link was not saved can be recovered on retry without refreezing or changing the record", async (t) => {
  const calls = mockRequests(t, [
    auth(), readSaved([frozen]), ...existingPull(), link([]),
    auth(), readSaved([frozen]), ...existingPull(), link(),
  ]);
  assert.match(await problem(await publishSubmission(publishRequest(), id), 503), /link was not saved.*retry/i);
  assert.deepEqual(await result(await publishSubmission(publishRequest(), id)), { submission: linked });
  assert.deepEqual(calls.filter((call) => call.method !== "GET").map((call) => call.body), [{ pr_url: prUrl }, { pr_url: prUrl }]);
});

test("network and unexpected JSON failures expose neither raw PII nor credentials in responses or logs", async (t) => {
  mockRequests(t, [
    { ...auth(), error: new Error(providerDetail) },
    auth(), { ...list(), status: 500, data: { message: providerDetail } },
    auth(), { ...list(), raw: providerDetail },
    auth(), { ...list(), data: { message: providerDetail } },
    auth(), readSaved([frozen]), { ...existingPull()[0], error: new Error(providerDetail) },
  ]);
  await problem(await getSession(request("/session", { method: "GET" })), 503);
  await problem(await listSubmissions(listRequest()), 503);
  await problem(await listSubmissions(listRequest()), 503);
  await problem(await listSubmissions(listRequest()), 503);
  await problem(await publishSubmission(publishRequest(), id), 502);
});
