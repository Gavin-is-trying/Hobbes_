import assert from "node:assert/strict";
import test from "node:test";
import { parseClientDraft, sortClients, type ClientRecord } from "./clients.ts";

function record(id: number, firstName: string, lastName: string): ClientRecord {
  return { id, firstName, lastName, phone: "", email: "", address: "", notes: "" };
}

test("sorts by last name then first name, case-insensitively", () => {
  const sorted = sortClients([
    record(1, "Zoe", "adams"),
    record(2, "Amy", "Young"),
    record(3, "Bob", "Adams"),
    record(4, "Ana", "de la Cruz"),
  ]);
  assert.deepEqual(sorted.map((client) => client.id), [3, 1, 4, 2]);
});

test("sortClients does not mutate its input", () => {
  const clients = [record(1, "Zoe", "Adams"), record(2, "Amy", "Young")];
  sortClients(clients);
  assert.deepEqual(clients.map((client) => client.id), [1, 2]);
});

test("parseClientDraft trims fields and ignores unknown keys", () => {
  const parsed = parseClientDraft({ firstName: "  Jane ", lastName: "Rivera", phone: " 555-0100 ", extra: "ignored" });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, {
    firstName: "Jane",
    lastName: "Rivera",
    phone: "555-0100",
    email: "",
    address: "",
    notes: "",
  });
});

test("parseClientDraft requires a name", () => {
  const parsed = parseClientDraft({ phone: "555-0100" });
  assert.ok(!parsed.ok);
  assert.match(parsed.error, /name/i);
});

test("parseClientDraft rejects invalid input and overlong fields", () => {
  assert.ok(!parseClientDraft(null).ok);
  assert.ok(!parseClientDraft("Jane").ok);
  assert.ok(!parseClientDraft({ firstName: "Jane", notes: "x".repeat(501) }).ok);
  const badEmail = parseClientDraft({ firstName: "Jane", email: "not-an-email" });
  assert.ok(!badEmail.ok);
  assert.match(badEmail.error, /email/i);
});
