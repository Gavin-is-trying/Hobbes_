import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { ClientPayload, IntakeKind, ProcessPayload, Submission } from "../lib/intake-types";

type SaveRequest = { id: string; kind: IntakeKind; payload: ClientPayload | ProcessPayload };
type IntakeMock = {
  authenticated: boolean;
  userId: string;
  owners: Record<string, string>;
  unavailable: boolean;
  loginFailure: boolean;
  saveFailures: number;
  saveRejections: number[];
  lostSaveResponses: number;
  publishFailures: number;
  listFailures: number;
  recordFailures: number;
  holdSave: Promise<void> | null;
  holdList: Promise<void> | null;
  holdPublish: Promise<void> | null;
  listOffsets: number[];
  recordReads: string[];
  logoutRequests: number;
  records: Submission[];
  saves: SaveRequest[];
  publications: { id: string; text: string; confirmed: boolean }[];
  sessionChecks: number;
};

async function mockIntake(page: Page, options: Partial<IntakeMock> = {}) {
  const state: IntakeMock = {
    authenticated: true, userId: "owner-a", owners: {}, unavailable: false, loginFailure: false,
    saveFailures: 0, saveRejections: [], lostSaveResponses: 0, publishFailures: 0, listFailures: 0, recordFailures: 0,
    holdSave: null, holdList: null, holdPublish: null, records: [], saves: [], publications: [], sessionChecks: 0,
    listOffsets: [], recordReads: [], logoutRequests: 0,
    ...options,
  };
  for (const record of state.records) state.owners[record.id] ??= state.userId;
  // All intake API traffic is intercepted: these tests never write to a real DB or GitHub.
  await page.route("**/api/intake/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const requestOwner = state.userId;
    const wasAuthenticated = state.authenticated;
    const ownedRecords = () => state.records.filter((entry) => state.owners[entry.id] === requestOwner);
    const reply = (body: unknown, status = 200) => route.fulfill({ status, json: body });
    if (url.pathname === "/api/intake/session") {
      if (method === "GET") state.sessionChecks += 1;
      if (state.unavailable) return reply({ error: "Intake authentication is not configured." }, 503);
      if (method === "POST") {
        if (state.loginFailure) return reply({ error: "Invalid email or password." }, 401);
        state.authenticated = true;
        return reply({ authenticated: true, userId: state.userId });
      }
      if (method === "DELETE") {
        state.logoutRequests += 1;
        state.authenticated = false;
        return reply({ authenticated: false });
      }
      return state.authenticated ? reply({ authenticated: true, userId: state.userId }) : reply({ error: "Log in required." }, 401);
    }
    if (url.pathname === "/api/intake/submissions" && method === "POST") {
      const body = request.postDataJSON() as SaveRequest;
      state.saves.push(body);
      if (!wasAuthenticated) return reply({ error: "Log in required." }, 401);
      if (state.holdSave) await state.holdSave;
      const rejection = state.saveRejections.shift();
      if (rejection) return reply({ error: "Submission rejected." }, rejection);
      if (state.saveFailures > 0) {
        state.saveFailures -= 1;
        return reply({ error: "Database unavailable." }, 503);
      }
      let submission = ownedRecords().find((entry) => entry.id === body.id);
      if (submission && (submission.kind !== body.kind || JSON.stringify(submission.payload) !== JSON.stringify(body.payload))) {
        return reply({ error: "This UUID already has a different saved snapshot." }, 409);
      }
      if (!submission) {
        submission = { ...body, created_at: new Date().toISOString(), publication_text: null, pr_url: null };
        state.owners[submission.id] = requestOwner;
        state.records.unshift(submission);
      }
      if (state.lostSaveResponses > 0) {
        state.lostSaveResponses -= 1;
        return route.abort("connectionreset");
      }
      return reply({ submission });
    }
    if (!wasAuthenticated) return reply({ error: "Log in required." }, 401);
    if (url.pathname === "/api/intake/submissions" && method === "GET") {
      const offset = Number(url.searchParams.get("offset"));
      state.listOffsets.push(offset);
      if (state.listFailures > 0) {
        state.listFailures -= 1;
        return reply({ error: "Database list unavailable." }, 503);
      }
      const records = ownedRecords().filter((entry) => entry.kind === url.searchParams.get("kind"));
      const response = structuredClone({ submissions: records.slice(offset, offset + 5), nextOffset: offset + 5 < records.length ? offset + 5 : null });
      if (state.holdList) await state.holdList;
      return reply(response);
    }
    const single = url.pathname.match(/^\/api\/intake\/submissions\/([^/]+)$/);
    if (single && method === "GET") {
      state.recordReads.push(single[1]);
      if (state.recordFailures > 0) {
        state.recordFailures -= 1;
        return reply({ error: "Record lookup unavailable." }, 503);
      }
      const submission = ownedRecords().find((entry) => entry.id === single[1]);
      return submission ? reply({ submission }) : reply({ error: "Record not found." }, 404);
    }
    const publish = url.pathname.match(/^\/api\/intake\/submissions\/([^/]+)\/publish$/);
    if (publish && method === "POST") {
      const body = request.postDataJSON() as { text: string; confirmed: boolean };
      const id = publish[1];
      state.publications.push({ id, ...body });
      const submission = ownedRecords().find((entry) => entry.id === id);
      if (!submission) return reply({ error: "Record not found." }, 404);
      if (!body.confirmed || !body.text.trim()) return reply({ error: "Review confirmation and public text required." }, 400);
      submission.publication_text ??= body.text;
      if (submission.publication_text !== body.text) return reply({ error: "Publication text is frozen." }, 409);
      if (state.publishFailures > 0) {
        state.publishFailures -= 1;
        return reply({ error: "GitHub temporarily unavailable." }, 502);
      }
      if (state.holdPublish) await state.holdPublish;
      submission.pr_url = "https://github.com/example/review-fixture/pull/1";
      return reply({ submission });
    }
    return reply({ error: `Unexpected mocked intake request: ${method} ${url.pathname}` }, 500);
  });
  return state;
}

function clientFixtures(count: number): Submission[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    kind: "client",
    payload: { firstName: `Client ${String(index + 1).padStart(2, "0")}`, lastName: `Family ${String(index + 1).padStart(2, "0")}`, phone: "", email: "", address: "", notes: "" },
    created_at: new Date(Date.UTC(2026, 0, count - index)).toISOString(), publication_text: null, pr_url: null,
  }));
}

function deferredResponse() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

async function login(page: Page) {
  await page.getByLabel("Login email").fill("owner@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

async function saveClient(page: Page, firstName = "Zoe", lastName = "Adams") {
  await page.getByLabel("First name", { exact: true }).fill(firstName);
  await page.getByLabel("Last name", { exact: true }).fill(lastName);
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Reload saved records", exact: true })).toBeEnabled();
}

test("home has real sections and fits the viewport", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Documents");
  const sectionOrder = ["Internal Customers", "External Customers", "TLC-OS"];
  await expect(page.locator(".space-card h2")).toHaveText(sectionOrder);
  await expect(page.locator(".section-nav a")).toHaveText([...sectionOrder, "Clients"]);
  await expect(page.locator(".button-primary").first()).toHaveCSS("background-color", "rgb(14, 91, 45)");
  await expect(page.locator("h1")).toHaveCSS("font-family", /Optima/);
  await expect(page.getByRole("link", { name: "Process documentation guide", exact: true })).toBeVisible();
  await expect(page.locator(".hero, .stats-strip, .guide-banner, .stages-section, .site-footer, .topbar")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("search, section changes, empty states, and browser history work", async ({ page }) => {
  await page.goto("/library/");
  await expect(page.locator(".document-card").first()).toBeVisible();
  const count = await page.locator(".document-card").count();
  expect(count).toBeGreaterThan(0);
  await page.getByRole("searchbox", { name: "Search documents" }).fill("zz-no-such-document-zz");
  await expect(page.getByRole("heading", { name: "No documents found." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".document-card")).toHaveCount(count);
  const tlcCount = await page.locator(".document-card").filter({ has: page.locator(".document-section", { hasText: /^TLC-OS$/ }) }).count();
  expect(tlcCount).toBeGreaterThan(0);
  await page.getByLabel("Section", { exact: true }).selectOption("TLC-OS");
  await expect(page.locator(".document-card")).toHaveCount(tlcCount);
  await expect(page.locator(".document-section")).toHaveText(Array(tlcCount).fill("TLC-OS"));
  await page.getByLabel("Section", { exact: true }).selectOption("External Customers");
  await expect(page.locator(".document-card").first()).toContainText("External Customers");
  await page.goBack();
  await expect(page.getByLabel("Section", { exact: true })).toHaveValue("TLC-OS");
  await expect(page.locator(".document-card")).toHaveCount(tlcCount);
  await page.getByLabel("Section", { exact: true }).selectOption("Internal Customers");
  await expect(page.getByRole("heading", { name: "No documents found." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("process intake saves edited actions and restores its journey and notes on reload", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/intake/");
  await expect(page.getByRole("heading", { name: "Turn notes into a process" })).toBeVisible();
  await page.getByRole("tab", { name: "Internal Customers" }).click();
  await expect(page.getByRole("button", { name: /01 Attraction/ })).toHaveClass(/selected/);
  await page.getByRole("button", { name: /04 Onboarding/ }).click();
  await expect(page.locator(".selected-step strong")).toHaveText("Onboarding");
  const source = "Manager sends the private welcome plan.\nTeammate completes access setup.";
  await page.getByLabel("Paste notes, a transcript, or an existing procedure").fill(source);
  await page.getByRole("button", { name: "Build process draft" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding process draft" })).toBeVisible();
  await expect(page.getByText("Who owns this step from start to finish?")).toBeVisible();
  await page.getByLabel("Process action 1", { exact: true }).fill("Manager reviews the edited welcome plan.");
  await page.getByRole("button", { name: "Save process", exact: true }).click();
  await expect(page.locator(".process-entry")).toHaveCount(1);
  await expect(page.getByLabel("Paste notes, a transcript, or an existing procedure")).toHaveValue("");
  expect(api.saves[0].payload).toEqual({ customerType: "Internal Customers", selectedStep: "04", sourceText: source, actions: ["Manager reviews the edited welcome plan.", "Teammate completes access setup."] });
  await page.reload();
  await expect(page.locator(".process-entry h3").first()).toHaveText("Internal Customers · 04 Onboarding");
  await expect(page.locator(".saved-process-actions li")).toHaveText(["Manager reviews the edited welcome plan.", "Teammate completes access setup."]);
  await page.getByText("Private source notes", { exact: true }).click();
  await expect(page.locator(".intake-source-text")).toHaveText(source);
  await expect(page.getByLabel("Public publication text")).toHaveValue("");
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("button", { name: "Create pull request", exact: true })).toBeDisabled();
  expect(api.publications).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("clients keep fixed fields, persist after refresh, and sort latest records A to Z", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await expect(page.getByRole("heading", { name: "Add a client" })).toBeVisible();
  await page.getByLabel("Phone", { exact: true }).fill("555-0101");
  await saveClient(page, "Amy", "Young");
  await saveClient(page, "Zoe", "Adams");
  await expect(page.locator(".client-entry-head strong")).toHaveText(["Adams, Zoe", "Young, Amy"]);
  await page.reload();
  await expect(page.locator(".client-entry-head strong")).toHaveText(["Adams, Zoe", "Young, Amy"]);
  await expect(page.getByText(/2 loaded client records/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Remove/ })).toHaveCount(0);
  expect(api.saves).toHaveLength(2);
  expect(api.saves[0].payload).toEqual({ firstName: "Amy", lastName: "Young", phone: "555-0101", email: "", address: "", notes: "" });
  expect(api.sessionChecks).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("owner login gates forms, reports invalid credentials, and logs out", async ({ page }) => {
  const api = await mockIntake(page, { authenticated: false, loginFailure: true });
  await page.goto("/clients/");
  await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
  await expect(page.getByLabel("First name", { exact: true })).toHaveCount(0);
  await login(page);
  await expect(page.getByRole("alert")).toContainText("Invalid email or password");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  api.loginFailure = false;
  await login(page);
  await expect(page.getByLabel("First name", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("First name", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
  await expect(page.getByLabel("First name", { exact: true })).toHaveCount(0);
  const storedValues = await page.evaluate(() => JSON.stringify([Object.values(localStorage), Object.values(sessionStorage)]));
  expect(storedValues).not.toContain("test-only-not-a-real-password");
  expect(storedValues).not.toContain("owner@example.test");
  expect(api.saves).toHaveLength(0);
});

test("unconfigured authentication fails closed without exposing intake forms", async ({ page }) => {
  const api = await mockIntake(page, { authenticated: false, unavailable: true });
  await page.goto("/intake/");
  await expect(page.getByRole("alert")).toContainText("Intake authentication is not configured.");
  await login(page);
  await expect(page.getByRole("alert")).toContainText("Intake authentication is not configured.");
  await expect(page.getByRole("button", { name: "Build process draft" })).toHaveCount(0);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  expect(api.saves).toHaveLength(0);
});

test("pending DB saves lock fields and do not show optimistic records", async ({ page }) => {
  let release!: () => void;
  const holdSave = new Promise<void>((resolve) => { release = resolve; });
  const api = await mockIntake(page, { holdSave });
  await page.goto("/clients/");
  await page.getByLabel("First name", { exact: true }).fill("Pending");
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  try {
    await expect(page.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
    await expect(page.getByLabel("First name", { exact: true })).toBeDisabled();
    await expect(page.locator(".client-entry")).toHaveCount(0);
    await expect(page.getByText(/Saved to the private database/)).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.locator(".client-entry")).toHaveCount(1);
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  expect(api.saves).toHaveLength(1);
});

test("DB failure retains client fields and retries the same UUID and snapshot", async ({ page }) => {
  const api = await mockIntake(page, { saveFailures: 1 });
  await page.goto("/clients/");
  await page.getByLabel("First name", { exact: true }).fill("Private");
  await page.getByLabel("Last name", { exact: true }).fill("Client");
  await page.getByLabel("Notes", { exact: true }).fill("Retain this private note.");
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Save not confirmed. Database unavailable.");
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Private");
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("Retain this private note.");
  await expect(page.getByLabel("Notes", { exact: true })).toBeDisabled();
  await expect(page.locator(".client-entry")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator(".client-entry")).toHaveCount(1);
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("");
  expect(api.saves).toHaveLength(2);
  expect(api.saves[1]).toEqual(api.saves[0]);
  expect(api.saves[0].id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
});

test("lost save responses recover the saved record without creating a duplicate", async ({ page }) => {
  const api = await mockIntake(page, { lostSaveResponses: 1 });
  await page.goto("/clients/");
  await page.getByLabel("First name", { exact: true }).fill("Recovered");
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Save not confirmed");
  await expect(page.locator(".client-entry")).toHaveCount(1);
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Recovered");
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  expect(api.saves[1]).toEqual(api.saves[0]);
  expect(api.records).toHaveLength(1);
  await page.reload();
  await expect(page.locator(".client-entry-head strong")).toHaveText(["—, Recovered"]);
});

test("process DB failure retains edited actions and source for an identical retry", async ({ page }) => {
  const api = await mockIntake(page, { saveFailures: 1 });
  await page.goto("/intake/");
  const notes = page.getByLabel("Paste notes, a transcript, or an existing procedure");
  await notes.fill("Original private action.");
  await page.getByRole("button", { name: "Build process draft" }).click();
  await page.getByLabel("Process action 1", { exact: true }).fill("Edited private action.");
  await page.getByRole("button", { name: "Save process", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Save not confirmed");
  await expect(notes).toHaveValue("Original private action.");
  await expect(notes).toBeDisabled();
  await expect(page.getByLabel("Process action 1", { exact: true })).toHaveValue("Edited private action.");
  await expect(page.getByLabel("Process action 1", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator(".saved-process-actions li")).toHaveText(["Edited private action."]);
  expect(api.saves[1]).toEqual(api.saves[0]);
});

test("expired authentication preserves an uncertain draft across login and retry", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await page.getByLabel("First name", { exact: true }).fill("Retained");
  api.authenticated = false;
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
  await login(page);
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Retained");
  await expect(page.getByLabel("First name", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator(".client-entry")).toHaveCount(1);
  expect(api.saves[1]).toEqual(api.saves[0]);
});

test("publication requires explicit review and starts with an anonymized client stub", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await page.getByLabel("Phone", { exact: true }).fill("555-999-1234");
  await page.getByLabel("Email", { exact: true }).fill("private@example.test");
  await page.getByLabel("Address", { exact: true }).fill("123 Private Lane");
  await page.getByLabel("Notes", { exact: true }).fill("Confidential source material");
  await saveClient(page, "SecretFirst", "SecretLast");
  const text = page.getByLabel("Public publication text");
  await expect(text).toHaveValue("Client intake received. Identifying details remain in the private intake database.");
  const publish = page.getByRole("button", { name: "Create pull request", exact: true });
  const confirmation = page.getByRole("checkbox", { name: "I reviewed this text for public Git history and website publication" });
  await expect(publish).toBeDisabled();
  await confirmation.check();
  await text.fill("A manually reviewed public summary.");
  await expect(confirmation).not.toBeChecked();
  await expect(publish).toBeDisabled();
  await confirmation.check();
  await publish.click();
  await expect(page.getByRole("link", { name: "View pull request" })).toHaveAttribute("href", "https://github.com/example/review-fixture/pull/1");
  expect(api.publications).toEqual([{ id: api.records[0].id, text: "A manually reviewed public summary.", confirmed: true }]);
  expect(api.saves).toHaveLength(1);
});

test("GitHub failure keeps the DB record and freezes publication text across reload and retry", async ({ page }) => {
  const api = await mockIntake(page, { publishFailures: 1 });
  await page.goto("/clients/");
  await saveClient(page);
  await page.getByLabel("Public publication text").fill("Reviewed, redacted snapshot.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("The record is still saved");
  await expect(page.locator(".client-entry")).toHaveCount(1);
  await expect(page.getByLabel("Public publication text")).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Public publication text")).toHaveValue("Reviewed, redacted snapshot.");
  await expect(page.getByRole("button", { name: "Create pull request", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("Public publication text")).toHaveValue("Reviewed, redacted snapshot.");
  await expect(page.getByLabel("Public publication text")).toHaveAttribute("readonly", "");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByRole("link", { name: "View pull request" })).toBeVisible();
  expect(api.publications).toHaveLength(2);
  expect(api.publications[1]).toEqual(api.publications[0]);
  expect(api.saves).toHaveLength(1);
  expect(api.records).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole("link", { name: "View pull request" })).toBeVisible();
});

test("publication retry stays blocked when frozen text cannot be reloaded", async ({ page }) => {
  const api = await mockIntake(page, { publishFailures: 1 });
  await page.goto("/clients/");
  await saveClient(page);
  api.recordFailures = 1;
  await page.getByLabel("Public publication text").fill("Public snapshot that must not change.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByLabel("Public publication text")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create pull request", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Check publication status", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check publication status", exact: true }).click();
  await expect(page.getByLabel("Public publication text")).toBeEnabled();
  await expect(page.getByLabel("Public publication text")).toHaveAttribute("readonly", "");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByRole("link", { name: "View pull request" })).toBeVisible();
  expect(api.publications[1]).toEqual(api.publications[0]);
  expect(api.saves).toHaveLength(1);
});

test("saved list failures are explicit and reload recovers existing records", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await saveClient(page);
  api.listFailures = 1;
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Saved records could not be reloaded");
  await expect(page.getByText("No saved clients yet.", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Reload saved records", exact: true }).click();
  await expect(page.locator(".client-entry-head strong")).toHaveText(["Adams, Zoe"]);
  expect(api.saves).toHaveLength(1);
});

for (const status of [400, 413, 415]) {
  test(`pre-write ${status} rejection retains an editable draft and correction uses a new UUID`, async ({ page }) => {
    const api = await mockIntake(page, { saveRejections: [status] });
    await page.goto("/clients/");
    await page.getByLabel("First name", { exact: true }).fill("Needs correction");
    await page.getByLabel("Notes", { exact: true }).fill("Retain this draft.");
    await page.getByRole("button", { name: "Save client", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Save rejected before writing");
    await expect(page.getByLabel("First name", { exact: true })).toBeEnabled();
    await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("Retain this draft.");
    await expect(page.locator(".client-entry")).toHaveCount(0);
    await saveClient(page, "Corrected", "Record");
    expect(api.saves).toHaveLength(2);
    expect(api.saves[1].id).not.toBe(api.saves[0].id);
    expect(api.records).toHaveLength(1);
    expect((api.saves[1].payload as ClientPayload).firstName).toBe("Corrected");
  });
}

test("409 is uncertain and keeps the UUID and draft locked", async ({ page }) => {
  const api = await mockIntake(page, { saveRejections: [409] });
  await page.goto("/clients/");
  await page.getByLabel("First name", { exact: true }).fill("Conflict");
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Save not confirmed");
  await expect(page.getByLabel("First name", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator(".client-entry")).toHaveCount(1);
  expect(api.saves[1]).toEqual(api.saves[0]);
});

test("process validation rejection permits correcting the controlled actions", async ({ page }) => {
  const api = await mockIntake(page, { saveRejections: [400] });
  await page.goto("/intake/");
  await page.getByLabel("Paste notes, a transcript, or an existing procedure").fill("Private source to retain.");
  await page.getByRole("button", { name: "Build process draft" }).click();
  await page.getByRole("button", { name: "Save process", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Save rejected before writing");
  await page.getByLabel("Process action 1", { exact: true }).fill("Corrected action.");
  await page.getByRole("button", { name: "Save process", exact: true }).click();
  await expect(page.locator(".saved-process-actions li")).toHaveText(["Corrected action."]);
  expect(api.saves[1].id).not.toBe(api.saves[0].id);
  expect((api.saves[1].payload as ProcessPayload).sourceText).toBe("Private source to retain.");
});

test("pagination deduplicates overlapping pages and recovers older publications by ID", async ({ page }) => {
  const fixtures = clientFixtures(7);
  const api = await mockIntake(page, { records: [...fixtures], publishFailures: 1 });
  await page.goto("/clients/");
  await expect(page.locator(".client-entry")).toHaveCount(5);
  // A concurrent insertion shifts offset pagination by one record.
  const inserted = { ...fixtures[0], id: "10000000-0000-4000-8000-000000000001", created_at: "2026-02-01T00:00:00.000Z" };
  api.owners[inserted.id] = api.userId;
  api.records.unshift(inserted);
  await page.getByRole("button", { name: "Load older records", exact: true }).click();
  await expect(page.locator(".client-entry")).toHaveCount(7);
  await expect(page.locator(".client-entry-head strong")).toHaveText(fixtures.map((entry) => {
    const payload = entry.payload as ClientPayload;
    return `${payload.lastName}, ${payload.firstName}`;
  }));
  const older = page.locator(".client-entry").last();
  await older.getByLabel("Public publication text").fill("Redacted summary for an older record.");
  await older.getByRole("checkbox").check();
  await older.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(older.getByLabel("Public publication text")).toHaveAttribute("readonly", "");
  expect(api.recordReads).toEqual([fixtures[6].id]);
  expect(api.listOffsets).toEqual([0, 5]);
  await page.getByRole("button", { name: "Reload saved records", exact: true }).click();
  await expect(page.locator(".client-entry")).toHaveCount(5);
  expect(api.listOffsets).toEqual([0, 5, 0]);
});

test("successful saves and publication merge locally without repeatedly listing records", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await expect(page.getByText("No saved clients yet.", { exact: false })).toBeVisible();
  await saveClient(page);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByRole("link", { name: "View pull request" })).toBeVisible();
  expect(api.listOffsets).toEqual([0]);
  await expect(page.getByText(/may also appear in a Vercel preview before merge/)).toBeVisible();
});

test("an edited publication draft cancels native sidebar navigation without being lost", async ({ page }) => {
  await mockIntake(page);
  await page.goto("/clients/");
  await saveClient(page);
  await page.getByLabel("Public publication text").fill("Still reviewing this public summary.");
  const dialogPromise = page.waitForEvent("dialog");
  const navigation = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Home", exact: true }).click();
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await navigation;
  await expect(page).toHaveURL(/\/clients\/?$/);
  await expect(page.getByLabel("Public publication text")).toHaveValue("Still reviewing this public summary.");
});

test("session expiry hides but preserves a publication draft for the same verified owner", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await saveClient(page);
  await page.getByLabel("Public publication text").fill("Retained owner-only review text.");
  await page.getByRole("checkbox").check();
  api.authenticated = false;
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
  await expect(page.getByLabel("Public publication text")).toHaveCount(0);
  await expect(page.locator(".client-entry")).toHaveCount(0);
  await login(page);
  await expect(page.getByLabel("Public publication text")).toHaveValue("Retained owner-only review text.");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("button", { name: "Check publication status", exact: true }).click();
  await expect(page.getByLabel("Public publication text")).toBeEditable();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  await expect(page.getByRole("link", { name: "View pull request" })).toBeVisible();
  expect(api.publications[0].text).toBe("Retained owner-only review text.");
  expect(api.saves).toHaveLength(1);
});

test("a different verified account cannot see retained intake or publication drafts", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await saveClient(page, "PreviousOwner", "PrivateRecord");
  await page.getByLabel("First name", { exact: true }).fill("Unsaved previous-owner draft");
  await page.getByLabel("Public publication text").fill("Previous owner's unfinished summary.");
  api.authenticated = false;
  await page.getByRole("button", { name: "Reload saved records", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
  api.userId = "owner-b";
  await login(page);
  await expect(page.getByRole("heading", { name: "Different account detected" })).toBeVisible();
  await expect(page.getByLabel("First name", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Public publication text")).toHaveCount(0);
  await expect(page.locator(".client-entry")).toHaveCount(0);
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Discard drafts and reload", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  await expect(page.getByText("No saved clients yet.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Public publication text")).toHaveCount(0);
});

test("explicit logout confirms discard and clears both intake and publication drafts", async ({ page }) => {
  const api = await mockIntake(page);
  await page.goto("/clients/");
  await saveClient(page);
  await page.getByLabel("First name", { exact: true }).fill("Discard this client draft");
  await page.getByLabel("Public publication text").fill("Discard this publication draft");
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Discard this client draft");
  expect(api.logoutRequests).toBe(0);
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
  await login(page);
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Public publication text")).toHaveValue("Client intake received. Identifying details remain in the private intake database.");
  expect(api.logoutRequests).toBe(1);
});

test("logout stays disabled while publication is pending", async ({ page }) => {
  const delayed = deferredResponse();
  const api = await mockIntake(page, { holdPublish: delayed.wait });
  await page.goto("/clients/");
  await saveClient(page);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create pull request", exact: true }).click();
  try {
    await expect(page.getByRole("button", { name: "Creating pull request…", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeDisabled();
    expect(api.logoutRequests).toBe(0);
  } finally {
    delayed.release();
  }
  await expect(page.getByRole("link", { name: "View pull request" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeEnabled();
});

test("late list results cannot restore the previous owner's records after logout", async ({ page }) => {
  const api = await mockIntake(page, { records: clientFixtures(1) });
  await page.goto("/clients/");
  await expect(page.locator(".client-entry")).toHaveCount(1);
  const delayed = deferredResponse();
  api.holdList = delayed.wait;
  await page.getByRole("button", { name: "Reload saved records", exact: true }).click();
  await expect.poll(() => api.listOffsets.length).toBe(2);
  let completion!: Promise<unknown>;
  try {
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
    api.holdList = null;
    api.userId = "owner-b";
    await login(page);
    await expect(page.getByText("No saved clients yet.", { exact: false })).toBeVisible();
    completion = page.waitForResponse((response) => response.url().includes("/api/intake/submissions?")).then((response) => response.finished());
  } finally {
    delayed.release();
  }
  await completion;
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator(".client-entry")).toHaveCount(0);
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
});

for (const pending of ["save", "publish"] as const) {
  test(`late ${pending} completion after expiry is fenced from a different account`, async ({ page }) => {
    const api = await mockIntake(page);
    await page.goto("/clients/");
    await saveClient(page, "PreviousOwner", "Record");
    const delayed = deferredResponse();
    if (pending === "save") {
      api.holdSave = delayed.wait;
      await page.getByLabel("First name", { exact: true }).fill("Late save from previous owner");
      await page.getByRole("button", { name: "Save client", exact: true }).click();
      await expect.poll(() => api.saves.length).toBe(2);
    } else {
      api.holdPublish = delayed.wait;
      await page.getByLabel("Public publication text").fill("Previous owner's pending publication.");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Create pull request", exact: true }).click();
      await expect.poll(() => api.publications.length).toBe(1);
    }
    let completion!: Promise<unknown>;
    try {
      api.authenticated = false;
      await page.getByRole("button", { name: "Reload saved records", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Owner login" })).toBeVisible();
      api.userId = "owner-b";
      await login(page);
      await expect(page.getByRole("heading", { name: "Different account detected" })).toBeVisible();
      completion = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/api/intake/submissions")).then((response) => response.finished());
    } finally {
      delayed.release();
    }
    await completion;
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole("heading", { name: "Different account detected" })).toBeVisible();
    await expect(page.getByLabel("Public publication text")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "View pull request" })).toHaveCount(0);
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Discard drafts and reload", exact: true }).click();
    await expect(page.getByText("No saved clients yet.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  });
}

test("document headings and local Mermaid previews render", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/docs/process-documentation-guide/#folder-model");
  await expect(page.locator("#folder-model")).toBeVisible();
  await page.goto("/docs/tlc-os/03-org-chart/org-chart/");
  const diagram = page.getByRole("img", { name: "Flowchart rendered from the Mermaid source available below." });
  await expect(diagram).toBeVisible({ timeout: 20000 });
  expect(await diagram.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
