import assert from "node:assert/strict";
import test from "node:test";
import { docHref, getDocuments, getSections, resolveDocLink, slugForPath } from "./content.ts";

const documents = getDocuments();
const guide = documents.find((doc) => doc.path === "PROCESS-DOCUMENTATION-GUIDE.md")!;

test("loads real Markdown from only the public allowlist", () => {
  assert.ok(documents.length > 0);
  assert.equal(guide.title, "Process Documentation Guide");
  assert.ok(documents.every((doc) => /^(PROCESS-DOCUMENTATION-GUIDE\.md$|TLC-OS\/|External Customers\/|Internal Customers\/)/.test(doc.path)));
  assert.ok(documents.every((doc) => doc.body.length > 0 && !doc.path.includes(".gitkeep")));
  assert.equal(new Set(documents.map((doc) => doc.slug)).size, documents.length);
});

test("URLs preserve hierarchy and normalize spaces and punctuation", () => {
  assert.equal(slugForPath("External Customers/01 Leads/SOPs/Lead Intake SOP.md"), "external-customers/01-leads/sops/lead-intake-sop");
  assert.equal(docHref(guide), "/docs/process-documentation-guide");
});

test("empty lifecycle stages remain visible", () => {
  const section = getSections().find((s) => s.name === "Internal Customers")!;
  assert.ok(section.stages.includes("04 Onboarding"));
  assert.ok(!section.stages.includes(".gitkeep"));
});

test("relative document links retain fragments", () => {
  const target = documents.find((doc) => doc.path === "External Customers/01 Leads/SOPs/Lead Intake SOP.md")!;
  assert.equal(resolveDocLink(guide, `${target.path}#example`), `${docHref(target)}#example`);
  assert.equal(resolveDocLink(target, "../../../../PROCESS-DOCUMENTATION-GUIDE.md"), docHref(guide));
  assert.equal(resolveDocLink(guide, "#folder-model"), "#folder-model");
  assert.equal(resolveDocLink(guide, "https://example.com"), "https://example.com");
});

test("encoded source links resolve; non-document links fall back to GitHub", () => {
  const target = documents.find((doc) => doc.path.endsWith("Lead Intake SOP.md"))!;
  assert.equal(resolveDocLink(guide, encodeURI(target.path)), docHref(target));
  assert.equal(resolveDocLink(guide, "Internal Customers/"), "https://github.com/Gavin-is-trying/Hobbes_/blob/main/Internal%20Customers/");
  assert.equal(resolveDocLink(guide, "../../outside.md"), "#");
});
