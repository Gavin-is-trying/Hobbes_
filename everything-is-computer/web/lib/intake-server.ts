import { isDeepStrictEqual } from "node:util";
import { openIntakePullRequest } from "./github-intake.ts";
import type { ClientPayload, IntakeKind, ProcessPayload, Submission } from "./intake-types.ts";

const cookieName = "hobbes-intake-session";
const columns = "id,kind,payload,created_at,publication_text,pr_url";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class IntakeError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function configuration() {
  if (typeof window !== "undefined") throw new Error("Intake storage is server-only.");
  if (process.env.INTAKE_ENABLED !== "true") throw new IntakeError(503, "Intake saving is not enabled. Contact the repository owner.");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const allowed = (process.env.INTAKE_ALLOWED_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !key || !allowed.length) {
    throw new IntakeError(503, "Intake authentication is not configured. Contact the repository owner.");
  }
  return { url: url.replace(/\/$/, ""), key, allowed };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new IntakeError(400, "Expected a JSON object.");
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || value.includes("\0") || (required && !value.trim())) {
    throw new IntakeError(400, `${field} must be ${required ? "1" : "0"}–${max} characters without null bytes.`);
  }
  return value;
}

function kind(value: unknown): IntakeKind {
  if (value !== "client" && value !== "process") throw new IntakeError(400, "Choose client or process intake.");
  return value;
}

function submissionId(value: unknown): string {
  if (typeof value !== "string" || !uuid.test(value)) throw new IntakeError(400, "A valid submission UUID is required.");
  return value.toLowerCase();
}

function payloadFor(type: IntakeKind, value: unknown): ClientPayload | ProcessPayload {
  const input = object(value);
  if (type === "client") {
    const payload = {
      firstName: text(input.firstName, "First name", 200),
      lastName: text(input.lastName, "Last name", 200),
      phone: text(input.phone, "Phone", 100),
      email: text(input.email, "Email", 320),
      address: text(input.address, "Address", 1000),
      notes: text(input.notes, "Notes", 10000),
    };
    if (!payload.firstName.trim() && !payload.lastName.trim()) throw new IntakeError(400, "Enter a first or last name.");
    if (payload.email && !/^[^\s@]+@[^\s@]+$/.test(payload.email)) throw new IntakeError(400, "Enter a valid email address or leave it empty.");
    return payload;
  }
  if (input.customerType !== "Internal Customers" && input.customerType !== "External Customers") throw new IntakeError(400, "Choose a valid customer journey.");
  if (typeof input.selectedStep !== "string" || !/^0[1-8]$/.test(input.selectedStep)) throw new IntakeError(400, "Choose a journey step from 01 to 08.");
  if (!Array.isArray(input.actions) || !input.actions.length || input.actions.length > 100) throw new IntakeError(400, "A process needs 1–100 actions.");
  return {
    customerType: input.customerType,
    selectedStep: input.selectedStep,
    sourceText: text(input.sourceText, "Source notes", 50000, true),
    actions: input.actions.map((action) => text(action, "Process action", 2000, true)),
  };
}

function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new IntakeError(403, "Cross-origin intake requests are not allowed.");
}

async function jsonBody(request: Request, limit = 400_000): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new IntakeError(415, "Send application/json.");
  if (Number(request.headers.get("content-length")) > limit) throw new IntakeError(413, "Intake request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new IntakeError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new IntakeError(413, "Intake request is too large.");
    }
    chunks.push(value);
  }
  try { return object(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
  catch { throw new IntakeError(400, "Invalid JSON body."); }
}

async function upstream(url: string, init: RequestInit): Promise<Response> {
  try { return await fetch(url, { ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) }); }
  catch { throw new IntakeError(503, "Intake service is unavailable. Retry without changing your saved record."); }
}

function sessionToken(request: Request): string | undefined {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
}

async function identity(token: string | undefined) {
  const { url, key, allowed } = configuration();
  if (!token || token.length > 8000 || !/^[a-zA-Z0-9_.-]+$/.test(token)) throw new IntakeError(401, "Log in to use intake.");
  const response = await upstream(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (response.status === 401 || response.status === 403) throw new IntakeError(401, "Your intake session expired. Log in again.");
  if (!response.ok) throw new IntakeError(503, "Could not verify your intake session. Retry shortly.");
  const user = await response.json();
  if (typeof user.id !== "string" || !allowed.includes(user.id)) throw new IntakeError(403, "This account is not authorized for intake.");
  return user.id as string;
}

function sessionCookie(request: Request, token: string, maxAge: number) {
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}

function reply(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff", ...headers } });
}

async function handle(work: () => Promise<Response>): Promise<Response> {
  try { return await work(); }
  catch (error) {
    if (error instanceof IntakeError) return reply({ error: error.message }, error.status);
    // Never log bodies, credentials, or raw intake. Operators can monitor route/status counts.
    console.error("Intake operation failed; inspect configuration and provider availability (request contents omitted).");
    return reply({ error: "Intake operation could not be confirmed. Keep your input and retry the same record." }, 503);
  }
}

export async function getSession(request: Request) {
  return handle(async () => {
    const userId = await identity(sessionToken(request));
    return reply({ authenticated: true, userId });
  });
}

export async function login(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const { url, key } = configuration();
    const input = await jsonBody(request, 8000);
    const email = text(input.email, "Email", 320, true);
    const password = text(input.password, "Password", 1024, true);
    const response = await upstream(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
    });
    if (response.status === 429) throw new IntakeError(429, "Too many login attempts. Try again later.");
    if (response.status >= 500) throw new IntakeError(503, "Login provider is unavailable. Try again later.");
    if (!response.ok) throw new IntakeError(401, "Login failed. Check your email and password.");
    const session = await response.json();
    const userId = await identity(session.access_token);
    if (!Number.isFinite(session.expires_in) || session.expires_in <= 0) throw new IntakeError(503, "Login provider returned an invalid session.");
    // Keep only the short-lived access token, never a refresh token or password. Re-login after expiry.
    return reply({ authenticated: true, userId }, 200, { "Set-Cookie": sessionCookie(request, session.access_token, Math.min(3600, Math.floor(session.expires_in))) });
  });
}

export async function logout(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    return reply({ authenticated: false }, 200, { "Set-Cookie": sessionCookie(request, "", 0) });
  });
}

async function database(query: URLSearchParams, method = "GET", body?: unknown, preference?: string): Promise<Submission[]> {
  const { url } = configuration();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new IntakeError(503, "Intake database is not configured. Contact the repository owner.");
  const response = await upstream(`${url}/rest/v1/intake_submissions?${query}`, {
    method,
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: preference ?? "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new IntakeError(503, "Database operation could not be confirmed. Keep your input and retry the same record.");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new IntakeError(503, "Database returned an unexpected result.");
  return rows as Submission[];
}

function ownedQuery(owner: string, id?: string) {
  return new URLSearchParams({ select: columns, owner_id: `eq.${owner}`, ...(id ? { id: `eq.${id}` } : {}) });
}

async function ownedSubmission(owner: string, id: string): Promise<Submission> {
  const rows = await database(ownedQuery(owner, id));
  if (!rows.length) throw new IntakeError(404, "Saved intake record not found.");
  return rows[0];
}

export async function listSubmissions(request: Request) {
  return handle(async () => {
    const owner = await identity(sessionToken(request));
    const params = new URL(request.url).searchParams;
    const type = kind(params.get("kind"));
    const offset = Number(params.get("offset") ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) throw new IntakeError(400, "Invalid page offset.");
    const query = ownedQuery(owner);
    query.set("kind", `eq.${type}`);
    query.set("order", "created_at.desc,id.desc");
    // Five full records keep even maximum escaped JSON payloads below Vercel's 4.5 MB response limit.
    query.set("limit", "5");
    query.set("offset", String(offset));
    const submissions = await database(query);
    return reply({ submissions, nextOffset: submissions.length === 5 ? offset + 5 : null });
  });
}

export async function getSubmission(request: Request, idValue: string) {
  return handle(async () => {
    const owner = await identity(sessionToken(request));
    return reply({ submission: await ownedSubmission(owner, submissionId(idValue)) });
  });
}

export async function saveSubmission(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const owner = await identity(sessionToken(request));
    const input = await jsonBody(request);
    const id = submissionId(input.id);
    const type = kind(input.kind);
    const payload = payloadFor(type, input.payload);
    if (Buffer.byteLength(JSON.stringify(payload), "utf8") > 400000) throw new IntakeError(413, "Intake payload is too large.");
    // The primary key and DO NOTHING make retries atomic without overwriting any owner's record.
    await database(new URLSearchParams({ select: "id", on_conflict: "id" }), "POST", { id, owner_id: owner, kind: type, payload }, "resolution=ignore-duplicates,return=representation");
    const submission = await ownedSubmission(owner, id);
    if (submission.kind !== type || !isDeepStrictEqual(submission.payload, payload)) throw new IntakeError(409, "This submission ID already holds different input. The saved record was not changed.");
    return reply({ submission });
  });
}

export async function publishSubmission(request: Request, idValue: string) {
  return handle(async () => {
    sameOrigin(request);
    const owner = await identity(sessionToken(request));
    const id = submissionId(idValue);
    const input = await jsonBody(request, 210000);
    if (input.confirmed !== true) throw new IntakeError(400, "Review the text for public Git history and website publication before continuing.");
    const approvedText = text(input.text, "Public publication text", 50000, true);
    let submission = await ownedSubmission(owner, id);
    if (submission.publication_text === null) {
      const query = ownedQuery(owner, id);
      query.set("publication_text", "is.null");
      // Freeze BEFORE any remote Git write. Concurrent reviewers cannot replace the first snapshot.
      await database(query, "PATCH", { publication_text: approvedText });
      submission = await ownedSubmission(owner, id);
    }
    if (submission.publication_text !== approvedText) throw new IntakeError(409, "Publication text is frozen. Reload the record and retry its original reviewed text.");
    if (submission.pr_url) return reply({ submission });
    let prUrl: string;
    try { prUrl = await openIntakePullRequest(submission); }
    catch (error) {
      // The GitHub adapter emits sanitized operational errors only, never provider bodies or credentials.
      throw new IntakeError(502, `Your record is saved; GitHub transfer failed. ${error instanceof Error ? error.message : "Retry this same record."}`);
    }
    const updated = await database(ownedQuery(owner, id), "PATCH", { pr_url: prUrl });
    if (!updated[0]) throw new IntakeError(503, "The pull request may exist, but its link was not saved. Retry this same record to recover it.");
    return reply({ submission: updated[0] });
  });
}
