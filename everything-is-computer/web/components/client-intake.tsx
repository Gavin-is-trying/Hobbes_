"use client";

import { useState } from "react";
import type { ClientPayload } from "../lib/intake-types";
import { IntakeWorkspace } from "./intake-workspace";

const emptyClient: ClientPayload = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const fields: { key: keyof ClientPayload; label: string; type: string; placeholder: string; autoComplete: string; maxLength: number }[] = [
  { key: "firstName", label: "First name", type: "text", placeholder: "Jane", autoComplete: "given-name", maxLength: 200 },
  { key: "lastName", label: "Last name", type: "text", placeholder: "Rivera", autoComplete: "family-name", maxLength: 200 },
  { key: "phone", label: "Phone", type: "tel", placeholder: "555-0100", autoComplete: "tel", maxLength: 100 },
  { key: "email", label: "Email", type: "email", placeholder: "jane@example.com", autoComplete: "email", maxLength: 320 },
  { key: "address", label: "Address", type: "text", placeholder: "123 Main St, City, ST 00000", autoComplete: "street-address", maxLength: 1000 },
];

export function ClientIntake() {
  const [client, setClient] = useState<ClientPayload>(emptyClient);

  function updateField(key: keyof ClientPayload, value: string) {
    setClient((current) => ({ ...current, [key]: value }));
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

      <IntakeWorkspace kind="client" dirty={Object.values(client).some(Boolean)} onDiscard={() => setClient(emptyClient)}>
        {({ submissions, save, saving, locked, publication }) => {
          const sortedClients = submissions?.map((submission) => ({ submission, entry: submission.payload as ClientPayload }))
            .sort((a, b) =>
              a.entry.lastName.localeCompare(b.entry.lastName, "en", { sensitivity: "base" }) ||
              a.entry.firstName.localeCompare(b.entry.firstName, "en", { sensitivity: "base" })
            );
          return <>
            <section className="intake-panel" aria-labelledby="client-form-heading">
              <div className="intake-section-heading">
                <div><span className="eyebrow">01 / Client details</span><h2 id="client-form-heading">New client record</h2></div>
              </div>
              <form onSubmit={(event) => {
                event.preventDefault();
                if ((!client.firstName.trim() && !client.lastName.trim()) || saving) return;
                void save(client, () => setClient(emptyClient));
              }}>
                <fieldset className="intake-fields" disabled={locked}>
                  <div className="client-fields">
                    {fields.map((field) => (
                      <label className="client-field" key={field.key}>
                        <span className="field-label">{field.label}</span>
                        <input
                          type={field.type}
                          value={client[field.key]}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                          maxLength={field.maxLength}
                          onChange={(event) => updateField(field.key, event.target.value)}
                        />
                      </label>
                    ))}
                    <label className="client-field client-field-wide">
                      <span className="field-label">Notes</span>
                      <textarea value={client.notes} maxLength={10000} placeholder="One short, factual line. No transcripts." onChange={(event) => updateField("notes", event.target.value)} />
                    </label>
                  </div>
                </fieldset>
                <div className="intake-actions">
                  <span className="result-note">Saved privately only when the database confirms receipt.</span>
                  <button className="button button-primary" type="submit" disabled={saving || (!client.firstName.trim() && !client.lastName.trim())}>{saving ? "Saving…" : locked ? "Retry save" : "Save client"}</button>
                </div>
              </form>
            </section>

            <section className="intake-panel" aria-labelledby="client-list-heading">
              <div className="intake-section-heading">
                <div><span className="eyebrow">02 / Loaded clients · Sorted A–Z</span><h2 id="client-list-heading">Client entries</h2></div>
                {sortedClients && <span className="step-count">{sortedClients.length} {sortedClients.length === 1 ? "client" : "clients"}</span>}
              </div>
              {sortedClients === undefined ? <p className="result-note">Waiting for saved client records.</p> : sortedClients.length ? (
                <ol className="client-list">
                  {sortedClients.map(({ submission, entry }) => (
                    <li className="client-entry" key={submission.id}>
                      <div className="client-entry-head">
                        <div><strong>{entry.lastName.trim() || "—"}, {entry.firstName.trim() || "—"}</strong><span className="client-entry-contact">{entry.phone || "No phone"} · {entry.email || "No email"}</span></div>
                      </div>
                      <dl className="client-entry-fields">
                        <div><dt>Phone</dt><dd>{entry.phone || "—"}</dd></div>
                        <div><dt>Email</dt><dd>{entry.email || "—"}</dd></div>
                        <div><dt>Address</dt><dd>{entry.address || "—"}</dd></div>
                        <div><dt>Notes</dt><dd>{entry.notes.trim() || "—"}</dd></div>
                      </dl>
                      {publication(submission)}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="result-note">No saved clients yet. Complete the form above to save the first record.</p>
              )}
            </section>
          </>;
        }}
      </IntakeWorkspace>
    </div>
  );
}
