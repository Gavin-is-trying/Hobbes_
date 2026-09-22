import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test, { beforeEach, type TestContext } from "node:test";
import { openIntakePullRequest } from "./github-intake.ts";
import type { Submission } from "./intake-types.ts";

const id = "12345678-1234-4123-8123-123456789abc";
const branch = `intake/${id}`;
const repository = "trusted-owner/trusted-repo";
const token = "github_pat_TEST_SECRET";
const baseSha = "a".repeat(40);
const headSha = "b".repeat(40);
const path = `TLC-OS/Website Intake/intake/${id}.md`;
const contents = `/contents/TLC-OS/Website%20Intake/intake/${id}.md`;
const headRef = `/git/ref/heads/${encodeURIComponent(branch)}`;
const listPulls = `/pulls?state=all&head=${encodeURIComponent(`trusted-owner:${branch}`)}&per_page=100`;
const prUrl = `https://github.com/${repository}/pull/42`;
const title = `Website intake: client ${id}`;
const privateText = "PRIVATE_PERSON PRIVATE_EMAIL PRIVATE_PHONE PRIVATE_ADDRESS PRIVATE_NOTES";
const submission: Submission = {
  id,
  kind: "client",
  payload: {
    firstName: "PRIVATE_PERSON",
    lastName: "PRIVATE_PERSON",
    email: "PRIVATE_EMAIL",
    phone: "PRIVATE_PHONE",
    address: "PRIVATE_ADDRESS",
    notes: "PRIVATE_NOTES",
  },
  created_at: "2026-09-20T12:34:56.123456+00:00",
  publication_text: "Approved public summary.\nSecond line.",
  pr_url: null,
};
const metadata = `---\nid: ${id}\nkind: client\ncreated_at: "${submission.created_at}"\nstatus: raw\n---\n\n# Website intake\n\n`;
const markdown = `${metadata}\`\`\`text\nApproved public summary.\nSecond line.\n\`\`\`\n`;
const changedFiles = [{ filename: path, status: "added", sha: "c".repeat(40) }];

type Step = {
  endpoint: string;
  method?: string;
  status?: number;
  data?: unknown;
  body?: unknown;
  error?: Error;
  raw?: string;
};
type Call = { endpoint: string; method: string; body: unknown };

beforeEach((t) => {
  assert.ok("mock" in t);
  const previous = ["GITHUB_INTAKE_TOKEN", "GITHUB_REPOSITORY", "GITHUB_BASE_BRANCH"].map((name) => [name, process.env[name]] as const);
  process.env.GITHUB_INTAKE_TOKEN = token;
  process.env.GITHUB_REPOSITORY = repository;
  delete process.env.GITHUB_BASE_BRANCH;
  t.after(() => {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  // A missing scripted response must never fall through to a real GitHub request.
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Unscripted fetch"); });
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, "timeout", (milliseconds: number) => {
    assert.equal(milliseconds, 8_000);
    return timeout(milliseconds);
  });
});

function mockGitHub(t: TestContext, steps: Step[]) {
  const remaining = [...steps];
  const calls: Call[] = [];
  const failures: unknown[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    try {
      assert.equal(typeof input, "string");
      const url = new URL(String(input));
      assert.equal(url.origin, "https://api.github.com");
      assert.equal(url.username, "");
      assert.equal(url.password, "");
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.redirect, "error");
      assert.ok(init?.signal instanceof AbortSignal);
      const headers = new Headers(init.headers);
      assert.equal(headers.get("authorization"), `Bearer ${token}`);
      assert.equal(headers.get("accept"), "application/vnd.github+json");
      assert.equal(headers.get("x-github-api-version"), "2022-11-28");
      const call = {
        endpoint: url.pathname.replace(`/repos/${repository}`, "") + url.search,
        method: init.method ?? "GET",
        body: init.body ? JSON.parse(String(init.body)) as unknown : undefined,
      };
      calls.push(call);
      const step = remaining.shift();
      assert.ok(step, `Unexpected ${call.method} ${call.endpoint}`);
      assert.equal(call.endpoint, step.endpoint);
      assert.equal(call.method, step.method ?? "GET");
      assert.deepEqual(call.body, step.body);
      if (step.error) return Promise.reject(step.error);
      return new Response(step.raw ?? JSON.stringify(step.data ?? {}), {
        status: step.status ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      failures.push(error);
      throw error;
    }
  });
  t.after(() => {
    assert.deepEqual(failures, [], "Mock GitHub request assertions failed");
    assert.equal(remaining.length, 0, "Expected GitHub requests were not made");
  });
  return calls;
}

function branchData(name: string, sha: string) {
  return { ref: `refs/heads/${name}`, object: { type: "commit", sha } };
}

function fileData(text = markdown) {
  return { type: "file", path, sha: "c".repeat(40), encoding: "base64", content: Buffer.from(text).toString("base64").match(/.{1,60}/g)!.join("\n") + "\n" };
}

function pullData(base = "main") {
  return {
    number: 42,
    state: "open",
    html_url: prUrl,
    base: { ref: base, sha: baseSha, repo: { full_name: repository } },
    head: { ref: branch, sha: headSha, repo: { full_name: repository } },
  };
}

function compare(sha: string, files: unknown[] = changedFiles): Step {
  return { endpoint: `/compare/${baseSha}...${sha}`, data: { status: sha === baseSha ? "identical" : "ahead", files } };
}

function newBranch(base = "main"): Step[] {
  return [
    { endpoint: listPulls, data: [] },
    { endpoint: `/git/ref/heads/${encodeURIComponent(base)}`, data: branchData(base, baseSha) },
    { endpoint: headRef, status: 404 },
    { endpoint: "/git/refs", method: "POST", status: 201, body: { ref: `refs/heads/${branch}`, sha: baseSha }, data: branchData(branch, baseSha) },
    { endpoint: headRef, data: branchData(branch, baseSha) },
    compare(baseSha, []),
    { endpoint: `${contents}?ref=${baseSha}`, status: 404 },
  ];
}

function createFile(text = markdown, message = title): Step {
  return {
    endpoint: contents,
    method: "PUT",
    status: 201,
    body: { message, content: Buffer.from(text).toString("base64"), branch },
    data: { content: fileData(text), commit: { sha: headSha } },
  };
}

function checkFile(text = markdown): Step[] {
  return [
    { endpoint: headRef, data: branchData(branch, headSha) },
    { endpoint: `${contents}?ref=${headSha}`, data: fileData(text) },
    compare(headSha),
    { endpoint: listPulls, data: [] },
  ];
}

function createPull(base = "main", kind = "client"): Step {
  return {
    endpoint: "/pulls",
    method: "POST",
    status: 201,
    body: {
      title: `Website intake: ${kind} ${id}`,
      head: branch,
      base,
      body: `Approved publication for ${kind} intake ${id}.\n\nStatus: raw. Review is required before merging.`,
    },
    data: pullData(base),
  };
}

function verifyPull(text = markdown): Step[] {
  return [
    { endpoint: `${contents}?ref=${headSha}`, data: fileData(text) },
    { endpoint: "/pulls/42/files?per_page=100", data: changedFiles },
  ];
}

function existingBranch(sha = headSha, files: unknown[] = changedFiles): Step[] {
  return [
    { endpoint: listPulls, data: [] },
    { endpoint: "/git/ref/heads/main", data: branchData("main", baseSha) },
    { endpoint: headRef, data: branchData(branch, sha) },
    compare(sha, files),
  ];
}

test("sequential flow creates only the deterministic intake branch, approved file, and neutral PR", async (t) => {
  const calls = mockGitHub(t, [...newBranch(), createFile(), ...checkFile(), createPull(), ...verifyPull()]);
  assert.equal(await openIntakePullRequest(submission), prUrl);
  assert.equal(calls[0].endpoint, listPulls);
  const writes = calls.filter((call) => call.method !== "GET");
  assert.deepEqual(writes.map((call) => call.method), ["POST", "PUT", "POST"]);
  assert.ok(writes.every((call) => !JSON.stringify(call.body).includes("PRIVATE_")));
  const contentWrite = writes[1].body as { content: string; branch: string; sha?: string };
  assert.equal(Buffer.from(contentWrite.content, "base64").toString("utf8"), markdown);
  assert.equal(contentWrite.branch, branch);
  assert.equal(contentWrite.sha, undefined);
  assert.ok(!calls.some((call) => call.method === "PATCH" || call.method === "DELETE"));
  assert.ok(!calls.some((call) => call.endpoint.includes("workflows")));
});

test("honors a configured base branch with a slash without writing to it", async (t) => {
  const base = "release/review";
  process.env.GITHUB_BASE_BRANCH = base;
  mockGitHub(t, [...newBranch(base), createFile(), ...checkFile(), createPull(base), ...verifyPull()]);
  assert.equal(await openIntakePullRequest(submission), prUrl);
});

test("process intake uses only frozen publication text, not payload getters or a supplied PR URL", async (t) => {
  const value = { ...submission, kind: "process" as const, pr_url: "https://attacker.invalid/forged-pr" };
  Object.defineProperty(value, "payload", { get() { throw new Error("Raw payload must never be read"); } });
  const text = markdown.replace("kind: client", "kind: process");
  mockGitHub(t, [...newBranch(), createFile(text, `Website intake: process ${id}`), ...checkFile(text), createPull("main", "process"), ...verifyPull(text)]);
  assert.equal(await openIntakePullRequest(value), prUrl);
});

test("literal publication preserves multiline text and cannot break out of its variable-length text fence", async (t) => {
  const approved = "  Keep whitespace.\r\n```mermaid\n``````\n:::directive\n![image](https://tracker.invalid)\n[link](javascript:alert(1))\n<img src=x onerror=alert(1)>\n---\nstatus: approved\n~~~\nEnd.\n\n";
  const text = `${metadata}${"`".repeat(7)}text\n${approved}${"`".repeat(7)}\n`;
  const calls = mockGitHub(t, [...newBranch(), createFile(text), ...checkFile(text), createPull(), ...verifyPull(text)]);
  assert.equal(await openIntakePullRequest({ ...submission, publication_text: approved }), prUrl);
  const write = calls.find((call) => call.method === "PUT")!.body as { content: string };
  const decoded = Buffer.from(write.content, "base64").toString("utf8");
  assert.equal(decoded, text);
  assert.equal(decoded.slice(metadata.length + 12, -8), approved);
  assert.ok(!decoded.includes("PRIVATE_"));
  assert.ok(!JSON.stringify(calls.find((call) => call.method === "POST" && call.endpoint === "/pulls")!.body).includes("tracker.invalid"));
});

for (const state of ["open", "closed", "merged"]) {
  test(`recovers an existing ${state} PR without writes, even when its branch was deleted`, async (t) => {
    const pull = { ...pullData(), state: state === "merged" ? "closed" : state, merged_at: state === "merged" ? submission.created_at : null };
    const calls = mockGitHub(t, [{ endpoint: listPulls, data: [pull] }, ...verifyPull()]);
    assert.equal(await openIntakePullRequest({ ...submission, pr_url: "untrusted cached value" }), prUrl);
    assert.ok(calls.every((call) => call.method === "GET"));
    assert.ok(calls.every((call) => !call.endpoint.startsWith("/git/")));
  });
}

test("GitHub failure exposes operation and HTTP status but not response bodies or credentials", async (t) => {
  mockGitHub(t, [{ endpoint: listPulls, status: 403, data: { message: `${token} ${privateText}` } }]);
  await assert.rejects(openIntakePullRequest(submission), (error: Error) => {
    assert.match(error.message, /find intake pull request.*HTTP 403/);
    assert.ok(!error.message.includes(token));
    assert.ok(!error.message.includes("PRIVATE_"));
    return true;
  });
});

for (const name of ["Error", "TimeoutError"]) {
  test(`sanitizes ${name} fetch failures and permits a safe retry`, async (t) => {
    const error = new Error(`${token} ${privateText}`);
    error.name = name;
    mockGitHub(t, [{ endpoint: listPulls, error }]);
    await assert.rejects(openIntakePullRequest(submission), /GitHub find intake pull request failed \(network error or timeout\)\. Retry safely\./);
  });
}

test("retry after branch creation and contents failure reuses the branch", async (t) => {
  mockGitHub(t, [
    ...newBranch(), { ...createFile(), status: 503 },
    ...existingBranch(baseSha, []), { endpoint: `${contents}?ref=${baseSha}`, status: 404 },
    createFile(), ...checkFile(), createPull(), ...verifyPull(),
  ]);
  await assert.rejects(openIntakePullRequest(submission), /create intake content.*HTTP 503/);
  assert.equal(await openIntakePullRequest(submission), prUrl);
});

test("retry after a lost contents response compares and preserves the existing file", async (t) => {
  const calls = mockGitHub(t, [
    ...newBranch(), { ...createFile(), error: new Error("Connection lost after commit") },
    ...existingBranch(), { endpoint: `${contents}?ref=${headSha}`, data: fileData() },
    ...checkFile(), createPull(), ...verifyPull(),
  ]);
  await assert.rejects(openIntakePullRequest(submission), /create intake content.*network error/);
  assert.equal(await openIntakePullRequest(submission), prUrl);
  assert.equal(calls.filter((call) => call.method === "PUT").length, 1);
});

test("retry after a lost PR response recovers a now-closed PR instead of recreating it", async (t) => {
  const calls = mockGitHub(t, [
    ...newBranch(), createFile(), ...checkFile(), { ...createPull(), error: new Error("Connection lost after PR creation") },
    { endpoint: listPulls, data: [{ ...pullData(), state: "closed" }] }, ...verifyPull(),
  ]);
  await assert.rejects(openIntakePullRequest(submission), /create intake pull request.*network error/);
  assert.equal(await openIntakePullRequest(submission), prUrl);
  assert.equal(calls.filter((call) => call.method === "POST" && call.endpoint === "/pulls").length, 1);
});

for (const status of [409, 422]) {
  test(`duplicate race recovers branch 422, contents ${status}, and PR 422 by rereading`, async (t) => {
    const start = newBranch();
    start[3] = { ...start[3], status: 422, data: { message: "Reference already exists" } };
    const calls = mockGitHub(t, [
      ...start, { ...createFile(), status }, ...checkFile(), { ...createPull(), status: 422 },
      { endpoint: listPulls, data: [pullData()] }, ...verifyPull(),
    ]);
    assert.equal(await openIntakePullRequest(submission), prUrl);
    assert.equal(calls.filter((call) => call.method === "PUT").length, 1);
    assert.ok(calls.every((call) => call.method !== "PATCH"));
  });
}

test("two concurrent calls converge on one branch, one file, and one PR", async (t) => {
  let currentHead: string | null = null;
  let hasPull = false;
  const creations = { branch: 0, file: 0, pull: 0 };
  const conflicts = { branch: 0, file: 0, pull: 0 };
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.github.com");
    const endpoint = url.pathname.replace(`/repos/${repository}`, "") + url.search;
    const method = init?.method ?? "GET";
    const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
    if (method === "GET") {
      if (endpoint === listPulls) return reply(hasPull ? [pullData()] : []);
      if (endpoint === "/git/ref/heads/main") return reply(branchData("main", baseSha));
      if (endpoint === headRef) return currentHead ? reply(branchData(branch, currentHead)) : reply({}, 404);
      if (endpoint === `${contents}?ref=${baseSha}`) return reply({}, 404);
      if (endpoint === `${contents}?ref=${headSha}`) return reply(fileData());
      if (endpoint === `/compare/${baseSha}...${baseSha}`) return reply({ status: "identical", files: [] });
      if (endpoint === `/compare/${baseSha}...${headSha}`) return reply({ status: "ahead", files: changedFiles });
      if (endpoint === "/pulls/42/files?per_page=100") return reply(changedFiles);
    }
    const body: unknown = JSON.parse(String(init?.body));
    if (method === "POST" && endpoint === "/git/refs") {
      assert.deepEqual(body, { ref: `refs/heads/${branch}`, sha: baseSha });
      if (currentHead) { conflicts.branch++; return reply({}, 422); }
      creations.branch++;
      currentHead = baseSha;
      return reply(branchData(branch, baseSha), 201);
    }
    if (method === "PUT" && endpoint === contents) {
      assert.deepEqual(body, createFile().body);
      if (currentHead === headSha) { conflicts.file++; return reply({}, 409); }
      creations.file++;
      currentHead = headSha;
      return reply(createFile().data, 201);
    }
    if (method === "POST" && endpoint === "/pulls") {
      assert.deepEqual(body, createPull().body);
      if (hasPull) { conflicts.pull++; return reply({}, 422); }
      creations.pull++;
      hasPull = true;
      return reply(pullData(), 201);
    }
    assert.fail(`Unexpected ${method} ${endpoint}`);
  });
  assert.deepEqual(await Promise.all([openIntakePullRequest(submission), openIntakePullRequest(submission)]), [prUrl, prUrl]);
  assert.deepEqual(creations, { branch: 1, file: 1, pull: 1 });
  assert.deepEqual(conflicts, { branch: 1, file: 1, pull: 1 });
});

test("rechecks all PR states before creation when another caller already opened and closed the PR", async (t) => {
  const checks = checkFile();
  checks[3] = { endpoint: listPulls, data: [{ ...pullData(), state: "closed" }] };
  const calls = mockGitHub(t, [...newBranch(), createFile(), ...checks, ...verifyPull()]);
  assert.equal(await openIntakePullRequest(submission), prUrl);
  assert.ok(!calls.some((call) => call.endpoint === "/pulls" && call.method === "POST"));
});

test("an existing file mismatch refuses to overwrite any edits", async (t) => {
  const calls = mockGitHub(t, [...existingBranch(), { endpoint: `${contents}?ref=${headSha}`, data: fileData("Someone else's edits") }]);
  await assert.rejects(openIntakePullRequest(submission), /differs.*refusing to overwrite/);
  assert.ok(calls.every((call) => call.method === "GET"));
});

test("a conflicting contents creator is compared, not overwritten or published", async (t) => {
  mockGitHub(t, [
    ...newBranch(), { ...createFile(), status: 409 },
    { endpoint: headRef, data: branchData(branch, headSha) },
    { endpoint: `${contents}?ref=${headSha}`, data: fileData("Different frozen text") },
  ]);
  await assert.rejects(openIntakePullRequest(submission), /differs.*refusing to overwrite/);
});

test("a branch with unrelated or workflow changes is refused before any write", async (t) => {
  const calls = mockGitHub(t, existingBranch(headSha, [...changedFiles, { filename: ".github/workflows/unsafe.yml", status: "added" }]));
  await assert.rejects(openIntakePullRequest(submission), /unexpected changes/);
  assert.ok(calls.every((call) => call.method === "GET"));
});

test("rechecks branch changes after content creation before opening a PR", async (t) => {
  mockGitHub(t, [
    ...newBranch(), createFile(),
    { endpoint: headRef, data: branchData(branch, headSha) },
    { endpoint: `${contents}?ref=${headSha}`, data: fileData() },
    compare(headSha, [...changedFiles, { filename: "unrelated.md", status: "modified" }]),
  ]);
  await assert.rejects(openIntakePullRequest(submission), /unexpected changes/);
});

for (const [name, change] of [
  ["wrong base", { base: { ...pullData().base, ref: "other-base" } }],
  ["wrong head", { head: { ...pullData().head, ref: "other-head" } }],
  ["fork head", { head: { ...pullData().head, repo: { full_name: "attacker/trusted-repo" } } }],
  ["wrong base repository", { base: { ...pullData().base, repo: { full_name: "attacker/trusted-repo" } } }],
  ["deleted head repository", { head: { ...pullData().head, repo: null } }],
  ["untrusted URL", { html_url: "https://attacker.invalid/pull/42" }],
  ["wrong PR number in URL", { number: 43 }],
  ["invalid head SHA", { head: { ...pullData().head, sha: "main?ref=untrusted" } }],
] as const) {
  test(`existing PR recovery rejects ${name} without creating a replacement`, async (t) => {
    mockGitHub(t, [{ endpoint: listPulls, data: [{ ...pullData(), ...change }] }]);
    await assert.rejects(openIntakePullRequest(submission), /does not match/);
  });
}

test("existing PR recovery rejects altered publication text", async (t) => {
  mockGitHub(t, [{ endpoint: listPulls, data: [pullData()] }, { endpoint: `${contents}?ref=${headSha}`, data: fileData("Altered publication") }]);
  await assert.rejects(openIntakePullRequest(submission), /differs.*refusing to overwrite/);
});

for (const files of [[], [...changedFiles, { filename: ".github/workflows/unsafe.yml", status: "modified" }], [{ filename: path, status: "modified" }]]) {
  test(`existing PR recovery requires exactly one added intake file: ${JSON.stringify(files)}`, async (t) => {
    mockGitHub(t, [
      { endpoint: listPulls, data: [pullData()] },
      { endpoint: `${contents}?ref=${headSha}`, data: fileData() },
      { endpoint: "/pulls/42/files?per_page=100", data: files },
    ]);
    await assert.rejects(openIntakePullRequest(submission), /unexpected changes/);
  });
}

test("branch 422 is not assumed to be a successful duplicate", async (t) => {
  const steps = newBranch().slice(0, 5);
  steps[3] = { ...steps[3], status: 422 };
  steps[4] = { endpoint: headRef, status: 404 };
  mockGitHub(t, steps);
  await assert.rejects(openIntakePullRequest(submission), /could not create or recover the intake branch/);
});

test("contents 422 is not accepted if the expected file is still absent", async (t) => {
  mockGitHub(t, [
    ...newBranch(), { ...createFile(), status: 422 },
    { endpoint: headRef, data: branchData(branch, baseSha) },
    { endpoint: `${contents}?ref=${baseSha}`, status: 404 },
  ]);
  await assert.rejects(openIntakePullRequest(submission), /could not create or recover the approved intake file/);
});

test("PR 422 without a recoverable PR fails without retrying creation", async (t) => {
  mockGitHub(t, [...newBranch(), createFile(), ...checkFile(), { ...createPull(), status: 422 }, { endpoint: listPulls, data: [] }]);
  await assert.rejects(openIntakePullRequest(submission), /HTTP 422.*no existing PR/);
});

test("missing configured base branch fails without writes", async (t) => {
  mockGitHub(t, [{ endpoint: listPulls, data: [] }, { endpoint: "/git/ref/heads/main", status: 404 }]);
  await assert.rejects(openIntakePullRequest(submission), /base branch does not exist/);
});

for (const [name, value] of [
  ["GITHUB_INTAKE_TOKEN", undefined], ["GITHUB_INTAKE_TOKEN", ""], ["GITHUB_INTAKE_TOKEN", "secret\nheader"],
    ["GITHUB_INTAKE_TOKEN", "secret\n"], ["GITHUB_REPOSITORY", "owner/repo\n"],
  ["GITHUB_REPOSITORY", undefined], ["GITHUB_REPOSITORY", ""], ["GITHUB_REPOSITORY", "owner"],
  ["GITHUB_REPOSITORY", "https://github.com/owner/repo"], ["GITHUB_REPOSITORY", "owner/repo/extra"],
  ["GITHUB_REPOSITORY", "owner/.."], ["GITHUB_REPOSITORY", "owner/."], ["GITHUB_REPOSITORY", "owner%2frepo/repo"],
  ["GITHUB_REPOSITORY", "owner/repo?redirect=attacker"], ["GITHUB_REPOSITORY", " owner/repo"],
  ["GITHUB_BASE_BRANCH", ""], ["GITHUB_BASE_BRANCH", "main\n"], ["GITHUB_BASE_BRANCH", "../main"],
  ["GITHUB_BASE_BRANCH", "main?ref=attacker"], ["GITHUB_BASE_BRANCH", "feature//review"],
  ["GITHUB_BASE_BRANCH", "feature/.hidden"], ["GITHUB_BASE_BRANCH", "feature.lock"],
  ["GITHUB_BASE_BRANCH", "main@{1}"], ["GITHUB_BASE_BRANCH", "main\\other"],
  ["GITHUB_BASE_BRANCH", branch],
] as const) {
  test(`malformed or missing configuration fails before fetch: ${name}=${JSON.stringify(value)}`, async (t) => {
    mockGitHub(t, []);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
    await assert.rejects(openIntakePullRequest(submission), /GITHUB_|cannot be the configured base/);
  });
}

for (const change of [
  { publication_text: null }, { publication_text: " \n\t " },
  { id: "../main" }, { id: `${id}\n` }, { created_at: `${submission.created_at}\n` },
    { created_at: "2026-09-20\nstatus: approved" }, { created_at: "2026-99-99T00:00:00Z" },
  { kind: "client\nstatus: approved" },
]) {
  test(`invalid or unapproved submission fails before fetch: ${JSON.stringify(change)}`, async (t) => {
    mockGitHub(t, []);
    await assert.rejects(openIntakePullRequest({ ...submission, ...change } as Submission), /metadata is invalid|publication_text is required/);
  });
}

for (const data of [{ items: [] }, [null], [pullData(), pullData()]]) {
  test(`rejects malformed or ambiguous PR lists: ${JSON.stringify(data)}`, async (t) => {
    mockGitHub(t, [{ endpoint: listPulls, data }]);
    await assert.rejects(openIntakePullRequest(submission), /invalid|ambiguous/);
  });
}

test("invalid JSON is reported without including response text", async (t) => {
  mockGitHub(t, [{ endpoint: listPulls, raw: token + privateText }]);
  await assert.rejects(openIntakePullRequest(submission), /returned invalid JSON or timed out/);
});

test("malformed branch references are rejected before a branch is created", async (t) => {
  mockGitHub(t, [{ endpoint: listPulls, data: [] }, { endpoint: "/git/ref/heads/main", data: { ref: "refs/heads/main", object: { type: "tag", sha: baseSha } } }]);
  await assert.rejects(openIntakePullRequest(submission), /invalid branch reference/);
});

for (const data of [
  { ...fileData(), type: "symlink" }, { ...fileData(), encoding: "none" },
  { ...fileData(), path: "other.md" }, { ...fileData(), sha: "invalid" },
  { ...fileData(), content: `${fileData().content}%%%` },
]) {
  test(`rejects unsafe contents responses: ${JSON.stringify({ ...data, content: "[omitted]" })}`, async (t) => {
    mockGitHub(t, [...existingBranch(), { endpoint: `${contents}?ref=${headSha}`, data }]);
    await assert.rejects(openIntakePullRequest(submission), /invalid intake file content|differs/);
  });
}

test("PR file changes racing content verification are rejected by blob SHA", async (t) => {
  mockGitHub(t, [
    { endpoint: listPulls, data: [pullData()] },
    { endpoint: `${contents}?ref=${headSha}`, data: fileData() },
    { endpoint: "/pulls/42/files?per_page=100", data: [{ ...changedFiles[0], sha: "d".repeat(40) }] },
  ]);
  await assert.rejects(openIntakePullRequest(submission), /unexpected changes/);
});

test("normalizes UUID casing to one deterministic branch and path", async (t) => {
  mockGitHub(t, [{ endpoint: listPulls, data: [pullData()] }, ...verifyPull()]);
  assert.equal(await openIntakePullRequest({ ...submission, id: id.toUpperCase() }), prUrl);
});

test("refuses execution in a browser before accessing configuration or fetching", async (t) => {
  mockGitHub(t, []);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  });
  await assert.rejects(openIntakePullRequest(submission), /server-only/);
});

test("malformed comparison responses fail closed", async (t) => {
  const steps = existingBranch();
  steps[3] = { endpoint: `/compare/${baseSha}...${headSha}`, data: { status: "ahead", files: null } };
  mockGitHub(t, steps);
  await assert.rejects(openIntakePullRequest(submission), /unexpected changes/);
});
