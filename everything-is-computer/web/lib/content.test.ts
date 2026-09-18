import assert from "node:assert/strict";
import test from "node:test";
import { docHref, getDocuments, getSections, resolveDocLink, slugForPath } from "./content.ts";

const documents = getDocuments();
const guide = documents.find((doc) => doc.path === "TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md")!;

test("loads real Markdown from only the public allowlist", () => {
  assert.ok(documents.length > 0);
  assert.equal(guide.title, "Process Documentation Guide");
  assert.equal(guide.section, "TLC-OS");
  assert.equal(documents.filter((doc) => doc.path.endsWith("PROCESS-DOCUMENTATION-GUIDE.md")).length, 1);
  assert.ok(documents.every((doc) => /^(TLC-OS\/|External Customers\/|Internal Customers\/)/.test(doc.path)));
  assert.ok(documents.every((doc) => doc.body.length > 0 && !doc.path.includes(".gitkeep")));
  assert.equal(new Set(documents.map((doc) => doc.slug)).size, documents.length);
  assert.ok(!documents.some((doc) => doc.path.startsWith("everything-is-computer/")));
  assert.ok(documents.some((doc) => doc.path === "TLC-OS/03 Org Chart/org-chart.md"));
});

test("URLs preserve hierarchy and normalize spaces and punctuation", () => {
  assert.equal(slugForPath("External Customers/01 Leads/SOPs/Lead Intake SOP.md"), "external-customers/01-leads/sops/lead-intake-sop");
  assert.equal(slugForPath(guide.path), "process-documentation-guide");
  assert.equal(slugForPath("External Customers/PROCESS-DOCUMENTATION-GUIDE.md"), "external-customers/process-documentation-guide");
  assert.equal(docHref(guide), "/docs/process-documentation-guide");
});

test("section order and empty lifecycle stage discovery are preserved", () => {
  assert.deepEqual(getSections().map((s) => s.name), ["Internal Customers", "External Customers", "TLC-OS"]);
  const section = getSections().find((s) => s.name === "Internal Customers")!;
  assert.ok(section.stages.includes("04 Onboarding"));
  assert.ok(!section.stages.includes(".gitkeep"));
});

test("clients workspace is discovered under TLC-OS", () => {
  const tlc = getSections().find((s) => s.name === "TLC-OS")!;
  assert.ok(tlc.stages.includes("Clients"));
  const sop = documents.find((doc) => doc.path === "TLC-OS/Clients/SOPs/Client Intake SOP.md");
  assert.ok(sop);
  assert.equal(sop.section, "TLC-OS");
  const registry = documents.find((doc) => doc.path === "TLC-OS/Clients/Client Registry.md");
  assert.ok(registry);
  assert.match(registry.body, /last name, A to Z/i);
});

test("relative document links retain fragments", () => {
  const target = documents.find((doc) => doc.path === "External Customers/01 Leads/SOPs/Lead Intake SOP.md")!;
  assert.equal(resolveDocLink(guide, `../${target.path}#example`), `${docHref(target)}#example`);
  assert.equal(resolveDocLink(target, "../../../TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md"), docHref(guide));
  assert.equal(resolveDocLink(target, "../../../../TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md"), "#");
  assert.equal(resolveDocLink(guide, "#folder-model"), "#folder-model");
  assert.equal(resolveDocLink(guide, "https://example.com"), "https://example.com");
});

test("encoded source links resolve; non-document links fall back to GitHub", () => {
  const target = documents.find((doc) => doc.path.endsWith("Lead Intake SOP.md"))!;
  assert.equal(resolveDocLink(guide, encodeURI(`../${target.path}`)), docHref(target));
  assert.equal(resolveDocLink(guide, "../Internal Customers/"), "https://github.com/Gavin-is-trying/Hobbes_/blob/main/Internal%20Customers/");
  assert.equal(resolveDocLink(guide, "../everything-is-computer/AGENTS.md"), "https://github.com/Gavin-is-trying/Hobbes_/blob/main/everything-is-computer/AGENTS.md");
  assert.equal(resolveDocLink(guide, "../everything-is-computer/workflows/opencode.yml"), "https://github.com/Gavin-is-trying/Hobbes_/blob/main/everything-is-computer/workflows/opencode.yml");
  assert.equal(resolveDocLink(guide, "../../outside.md"), "#");
});
