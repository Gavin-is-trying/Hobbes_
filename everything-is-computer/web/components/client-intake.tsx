"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type ClientRecord = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

type DraftRecord = Omit<ClientRecord, "id">;

const emptyClient: DraftRecord = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const fields: { key: keyof DraftRecord; label: string; type: string; placeholder: string; autoComplete: string }[] = [
  { key: "firstName", label: "First name", type: "text", placeholder: "Jane", autoComplete: "given-name" },
  { key: "lastName", label: "Last name", type: "text", placeholder: "Rivera", autoComplete: "family-name" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "555-0100", autoComplete: "tel" },
  { key: "email", label: "Email", type: "email", placeholder: "jane@example.com", autoComplete: "email" },
  { key: "address", label: "Address", type: "text", placeholder: "123 Main St, City, ST 00000", autoComplete: "street-address" },
];

export function ClientIntake() {
  const [client, setClient] = useState<DraftRecord>(emptyClient);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const nextId = useRef(1);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) =>
      a.lastName.localeCompare(b.lastName, "en", { sensitivity: "base" }) ||
      a.firstName.localeCompare(b.firstName, "en", { sensitivity: "base" })
    ),
    [clients]
  );

  function updateField(key: keyof DraftRecord, value: string) {
    setClient((current) => ({ ...current, [key]: value }));
  }

  function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client.firstName.trim() && !client.lastName.trim()) return;
    setClients((current) => [...current, { ...client, id: nextId.current++ }]);
    setClient(emptyClient);
  }

  function removeClient(id: number) {
    setClients((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <div className="page intake-page">
      <header className="page-heading intake-heading">
        <div>
          <span className="eyebrow">TLC-OS · Clients</span>
          <h1>Add a client</h1>
          <p className="intake-intro">One short, consistent form per customer. Every record keeps the same fields so client entries stay comparable and sorted by last name, A to Z.</p>
        </div>
      </header>

      <section className="intake-panel" aria-labelledby="client-form-heading">
        <div className="intake-section-heading">
          <div><span className="eyebrow">01 / Client details</span><h2 id="client-form-heading">New client record</h2></div>
        </div>
        <form onSubmit={addClient}>
          <div className="client-fields">
            {fields.map((field) => (
              <label className="client-field" key={field.key}>
                <span className="field-label">{field.label}</span>
                <input
                  type={field.type}
                  value={client[field.key]}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              </label>
            ))}
            <label className="client-field client-field-wide">
              <span className="field-label">Notes</span>
              <textarea value={client.notes} placeholder="One short, factual line. No transcripts." onChange={(event) => updateField("notes", event.target.value)} />
            </label>
          </div>
          <div className="intake-actions">
            <span className="file-name">Nothing leaves this browser.</span>
            <button className="button button-primary" type="submit" disabled={!client.firstName.trim() && !client.lastName.trim()}>Add client</button>
          </div>
        </form>
      </section>

      <section className="intake-panel" aria-labelledby="client-list-heading">
        <div className="intake-section-heading">
          <div><span className="eyebrow">02 / Sorted A–Z</span><h2 id="client-list-heading">Client entries</h2></div>
          <span className="step-count">{sortedClients.length} {sortedClients.length === 1 ? "client" : "clients"}</span>
        </div>
        {sortedClients.length ? (
          <ol className="client-list">
            {sortedClients.map((entry) => (
              <li className="client-entry" key={entry.id}>
                <div className="client-entry-head">
                  <div><strong>{entry.lastName.trim() || "—"}, {entry.firstName.trim() || "—"}</strong><span className="client-entry-contact">{entry.phone || "No phone"} · {entry.email || "No email"}</span></div>
                  <button className="reset-button" type="button" onClick={() => removeClient(entry.id)}>Remove <span aria-hidden="true">×</span></button>
                </div>
                <dl className="client-entry-fields">
                  <div><dt>Phone</dt><dd>{entry.phone || "—"}</dd></div>
                  <div><dt>Email</dt><dd>{entry.email || "—"}</dd></div>
                  <div><dt>Address</dt><dd>{entry.address || "—"}</dd></div>
                  <div><dt>Notes</dt><dd>{entry.notes.trim() || "—"}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <p className="result-note">No clients added yet. Complete the form above to add the first record.</p>
        )}
      </section>
    </div>
  );
}
