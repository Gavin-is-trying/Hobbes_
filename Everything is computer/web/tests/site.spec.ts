import { expect, test } from "@playwright/test";

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
  await page.getByLabel("Section", { exact: true }).selectOption("TLC-OS");
  await expect(page.locator(".document-card")).toHaveCount(8);
  await page.getByLabel("Section", { exact: true }).selectOption("External Customers");
  await expect(page.locator(".document-card").first()).toContainText("External Customers");
  await page.goBack();
  await expect(page.getByLabel("Section", { exact: true })).toHaveValue("TLC-OS");
  await expect(page.locator(".document-card")).toHaveCount(8);
  await page.getByLabel("Section", { exact: true }).selectOption("Internal Customers");
  await expect(page.getByRole("heading", { name: "No documents found." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("process intake switches journeys and structures pasted notes", async ({ page }) => {
  await page.goto("/intake/");
  await expect(page.getByRole("heading", { name: "Turn notes into a process" })).toBeVisible();
  await page.getByRole("tab", { name: "Internal Customers" }).click();
  await expect(page.getByRole("button", { name: /01 Attraction/ })).toHaveClass(/selected/);
  await page.getByRole("button", { name: /04 Onboarding/ }).click();
  await expect(page.locator(".selected-step strong")).toHaveText("Onboarding");
  await page.getByLabel("Paste notes, a transcript, or an existing procedure").fill("Manager sends the welcome plan. Teammate completes access setup.");
  await page.getByRole("button", { name: "Build process draft" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding process draft" })).toBeVisible();
  await expect(page.getByText("Who owns this step from start to finish?")).toBeVisible();
});

test("clients form keeps fixed fields and sorts by last name A to Z", async ({ page }) => {
  await page.goto("/clients/");
  await expect(page.getByRole("heading", { name: "Add a client" })).toBeVisible();
  const add = page.getByRole("button", { name: "Add client" });
  await page.getByLabel("First name").fill("Zoe");
  await page.getByLabel("Last name").fill("Adams");
  await page.getByLabel("Phone").fill("555-0101");
  await add.click();
  await page.getByLabel("First name").fill("Amy");
  await page.getByLabel("Last name").fill("Young");
  await add.click();
  await expect(page.locator(".client-entry-head strong").first()).toHaveText("Adams, Zoe");
  await expect(page.locator(".client-entry-head strong").last()).toHaveText("Young, Amy");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

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
