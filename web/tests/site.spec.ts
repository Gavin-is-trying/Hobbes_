import { expect, test } from "@playwright/test";

test("home has real sections and fits the viewport", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("shared understanding");
  await expect(page.locator(".space-card")).toHaveCount(4);
  await expect(page.getByText("No documents yet").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("search, section changes, empty states, and browser history work", async ({ page }) => {
  await page.goto("/library/");
  await expect(page.locator(".document-card").first()).toBeVisible();
  const count = await page.locator(".document-card").count();
  expect(count).toBeGreaterThan(0);
  await page.getByLabel("Search the knowledge base").fill("zz-no-such-document-zz");
  await expect(page.getByRole("heading", { name: "No documents found." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".document-card")).toHaveCount(count);
  await page.getByLabel("Knowledge space", { exact: true }).selectOption("TLC-OS");
  await expect(page.locator(".document-card")).toHaveCount(1);
  await page.getByLabel("Knowledge space", { exact: true }).selectOption("Agents");
  await expect(page.locator(".document-card").first()).toContainText("Agents");
  await page.goBack();
  await expect(page.getByLabel("Knowledge space", { exact: true })).toHaveValue("TLC-OS");
  await expect(page.locator(".document-card")).toHaveCount(1);
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
