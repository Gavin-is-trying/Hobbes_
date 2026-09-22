import { Buffer } from "node:buffer";
import type { Submission } from "./intake-types.ts";

const timeoutMs = 8_000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSha(value: unknown): value is string {
  return typeof value === "string" && value.length === 40 && /^[0-9a-f]{40}$/.test(value);
}

function configuration() {
  const token = process.env.GITHUB_INTAKE_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const base = process.env.GITHUB_BASE_BRANCH ?? "main";
  if (!token || /[^\x21-\x7e]/.test(token)) {
    throw new Error("GITHUB_INTAKE_TOKEN is missing or invalid.");
  }
  if (!repository || repository !== repository.trim()
      || !/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?\/[a-z0-9_.-]{1,100}$/i.test(repository)
    || [".", ".."].includes(repository.split("/")[1])) {
    throw new Error("GITHUB_REPOSITORY must be a valid owner/repo.");
  }
  if (!base || base === "@" || base.startsWith("-") || base.endsWith(".")
    || /[\x00-\x20\x7f~^:?*\[\\]/.test(base) || base.includes("..") || base.includes("@{")
    || base.split("/").some((part) => !part || part.startsWith(".") || part.endsWith(".lock"))) {
    throw new Error("GITHUB_BASE_BRANCH must be a valid branch name.");
  }
  return { token, repository, base, owner: repository.split("/")[0] };
}

function publication(submission: Submission) {
  if (typeof submission.id !== "string" || submission.id.length !== 36 || !uuidPattern.test(submission.id)
    || !["client", "process"].includes(submission.kind)
    || typeof submission.created_at !== "string" || submission.created_at !== submission.created_at.trim()
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(submission.created_at)
    || !Number.isFinite(Date.parse(submission.created_at))) {
    throw new Error("Intake submission metadata is invalid.");
  }
  const text = submission.publication_text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Approved, frozen publication_text is required before GitHub publication.");
  }
  let fenceLength = 3;
  for (const match of text.matchAll(/`+/g)) fenceLength = Math.max(fenceLength, match[0].length + 1);
  const fence = "`".repeat(fenceLength);
  const id = submission.id.toLowerCase();
  const markdown = `---\nid: ${id}\nkind: ${submission.kind}\ncreated_at: "${submission.created_at}"\nstatus: raw\n---\n\n# Website intake\n\n${fence}text\n${text}${text.endsWith("\n") ? "" : "\n"}${fence}\n`;
  return { id, bytes: Buffer.from(markdown, "utf8") };
}

// The caller must persist the approved text before calling; raw payload and pr_url are never trusted here.
export async function openIntakePullRequest(submission: Submission): Promise<string> {
  if (typeof window !== "undefined") throw new Error("GitHub intake is server-only.");
  const { token, repository, owner, base } = configuration();
  const { id, bytes } = publication(submission);
  const branch = `intake/${id}`;
  if (base === branch) throw new Error("The intake branch cannot be the configured base branch.");
  const path = `TLC-OS/Website Intake/intake/${id}.md`;
  const contentsPath = `/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  const title = `Website intake: ${submission.kind} ${id}`;
  const root = `https://api.github.com/repos/${repository}`;

  async function request(endpoint: string, operation: string, method = "GET", body?: unknown, recover: number[] = []) {
    let response: Response;
    try {
      response = await fetch(`${root}${endpoint}`, {
        method,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      // Fetch errors and GitHub bodies can contain sensitive request details; never forward them.
      throw new Error(`GitHub ${operation} failed (network error or timeout). Retry safely.`);
    }
    if (recover.includes(response.status)) return { status: response.status, data: null as unknown };
    if (!response.ok) throw new Error(`GitHub ${operation} failed (HTTP ${response.status}).`);
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error(`GitHub ${operation} returned invalid JSON or timed out reading its response.`);
    }
    return { status: response.status, data };
  }

  async function ref(name: string): Promise<string | null> {
    const { status, data } = await request(`/git/ref/heads/${encodeURIComponent(name)}`, "read branch", "GET", undefined, [404]);
    if (status === 404) return null;
    if (!record(data) || data.ref !== `refs/heads/${name}` || !record(data.object)
      || data.object.type !== "commit" || !isSha(data.object.sha)) {
      throw new Error("GitHub returned an invalid branch reference.");
    }
    return data.object.sha;
  }

  async function matchingBlob(sha: string): Promise<string | null> {
    const { status, data } = await request(`${contentsPath}?ref=${sha}`, "read intake content", "GET", undefined, [404]);
    if (status === 404) return null;
    if (!record(data) || data.type !== "file" || data.path !== path || !isSha(data.sha)
      || data.encoding !== "base64" || typeof data.content !== "string") {
      throw new Error("GitHub returned invalid intake file content.");
    }
    const encoded = data.content.replace(/[\r\n]/g, "");
    const actual = Buffer.from(encoded, "base64");
    if (actual.toString("base64") !== encoded || !actual.equals(bytes)) {
      throw new Error("Intake content differs from the frozen publication; refusing to overwrite it.");
    }
    return data.sha;
  }

  function safeFiles(files: unknown, allowEmpty: boolean, blobSha?: string) {
    if (!Array.isArray(files) || files.length > 1 || (!allowEmpty && files.length !== 1)
      || files.some((file: unknown) => !record(file) || file.filename !== path || file.status !== "added"
              || (blobSha !== undefined && file.sha !== blobSha))) {
      throw new Error("The intake branch or pull request contains unexpected changes; refusing to publish.");
    }
  }

  async function checkBranch(baseSha: string, headSha: string, allowEmpty: boolean, blobSha?: string) {
    const { data } = await request(`/compare/${baseSha}...${headSha}`, "check branch changes");
    if (!record(data) || typeof data.status !== "string" || !["ahead", "behind", "identical", "diverged"].includes(data.status)) {
      throw new Error("GitHub returned an invalid branch comparison.");
    }
    safeFiles(data.files, allowEmpty, blobSha);
  }

  async function existingPull(): Promise<unknown | null> {
    // Do not filter by base: a PR for this head targeting a different base is a conflict, not permission to recreate it.
    const query = new URLSearchParams({ state: "all", head: `${owner}:${branch}`, per_page: "100" });
    const { data } = await request(`/pulls?${query}`, "find intake pull request");
    if (!Array.isArray(data) || data.length > 1) {
      throw new Error("GitHub returned an invalid or ambiguous intake pull request list.");
    }
    if (data.length === 0) return null;
    if (!record(data[0])) throw new Error("GitHub returned an invalid intake pull request.");
    return data[0];
  }

  async function verifyPull(pull: unknown): Promise<string> {
    if (!record(pull) || typeof pull.number !== "number" || !Number.isSafeInteger(pull.number) || pull.number <= 0
      || typeof pull.state !== "string" || !["open", "closed"].includes(pull.state)
      || typeof pull.html_url !== "string"
      || pull.html_url.toLowerCase() !== `https://github.com/${repository}/pull/${pull.number}`.toLowerCase()
      || !record(pull.base) || pull.base.ref !== base || !isSha(pull.base.sha)
      || !record(pull.base.repo) || typeof pull.base.repo.full_name !== "string"
      || pull.base.repo.full_name.toLowerCase() !== repository.toLowerCase()
      || !record(pull.head) || pull.head.ref !== branch || !isSha(pull.head.sha)
      || !record(pull.head.repo) || typeof pull.head.repo.full_name !== "string"
      || pull.head.repo.full_name.toLowerCase() !== repository.toLowerCase()) {
      throw new Error("GitHub pull request does not match the expected repository, base, or intake head.");
    }
    // PR heads remain readable by commit SHA after merge/closure and branch deletion.
    const blobSha = await matchingBlob(pull.head.sha);
    if (blobSha === null) throw new Error("The intake pull request is missing its approved file.");
    const { data } = await request(`/pulls/${pull.number}/files?per_page=100`, "check pull request files");
    // Also bind the PR's mutable file list to the exact blob checked at its recorded head.
    safeFiles(data, false, blobSha);
    return pull.html_url;
  }

  const existing = await existingPull();
  if (existing !== null) return verifyPull(existing);

  const baseSha = await ref(base);
  if (baseSha === null) throw new Error("The configured GitHub base branch does not exist.");
  let headSha = await ref(branch);
  if (headSha === null) {
    await request("/git/refs", "create intake branch", "POST", { ref: `refs/heads/${branch}`, sha: baseSha }, [422]);
    // Both successful creation and a concurrent creator are verified by reading the actual ref.
    headSha = await ref(branch);
    if (headSha === null) throw new Error("GitHub could not create or recover the intake branch.");
  }
  await checkBranch(baseSha, headSha, true);
  if (await matchingBlob(headSha) === null) {
    // Omitting sha intentionally makes this create-only, never an update to another writer's content.
    await request(contentsPath, "create intake content", "PUT", {
      message: title,
      content: bytes.toString("base64"),
      branch,
    }, [409, 422]);
  }

  headSha = await ref(branch);
  const blobSha = headSha === null ? null : await matchingBlob(headSha);
  if (headSha === null || blobSha === null) {
    throw new Error("GitHub could not create or recover the approved intake file.");
  }
  await checkBranch(baseSha, headSha, false, blobSha);
  const recovered = await existingPull();
  if (recovered !== null) return verifyPull(recovered);

  const { status, data } = await request("/pulls", "create intake pull request", "POST", {
    title,
    head: branch,
    base,
    body: `Approved publication for ${submission.kind} intake ${id}.\n\nStatus: raw. Review is required before merging.`,
  }, [422]);
  if (status !== 422) return verifyPull(data);
  const raced = await existingPull();
  if (raced === null) throw new Error("GitHub rejected the intake pull request (HTTP 422), and no existing PR was found.");
  return verifyPull(raced);
}
