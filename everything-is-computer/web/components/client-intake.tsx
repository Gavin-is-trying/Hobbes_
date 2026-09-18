"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { emptyClient, parseClientDraft, sortClients, type ClientDraft, type ClientRecord } from "../lib/clients";

const fields: { key: keyof ClientDraft; label: string; type: string; placeholder: string; autoComplete: string }[] = [
  { key: "firstName", label: "First name", type: "text", placeholder: "Jane", autoComplete: "given-name" },
  { key: "lastName", label: "Last name", type: "text", placeholder: "Rivera", autoComplete: "family-name" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "555-0100", autoComplete: "tel" },
  { key: "email", label: "Email", type: "email", placeholder: "jane@example.com", autoComplete: "email" },
  { key: "address", label: "Address", type: "text", placeholder: "123 Main St, City, ST 00000", autoComplete: "street-address" },
];

export function ClientIntake() {
  const [client, setClient] = useState<ClientDraft>(emptyClient);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedClients = useMemo(() => sortClients(clients), [clients]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/clients/");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load clients.");
        if (active) setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load clients.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function updateField(key: keyof ClientDraft, value: string) {
    setClient((current) => ({ ...current, [key]: value }));
  }

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseClientDraft(client);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the client.");
      setClients((current) => [...current, data.client]);
      setClient(emptyClient);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the client.");
    } finally {
      setSaving(false);
    }
  }

  async function removeClient(id: number) {
    setError("");
    try {
      const response = await fetch(`/api/clients/${id}/`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not remove the client.");
      }
      setClients((current) => current.filter((entry) => entry.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove the client.");
    }
  }

  return (
    <div className="page intake-page">
      <header className="page-heading intake-heading">
        <div>
          <span className="eyebrow">TLC-OS · Clients</span>
          <h1>Add a client</h1>
          <p className="intake-intro">One short, consistent form per customer. Entries save to the TLC-OS client database and load back on every device, sorted by last name, A to Z.</p>
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
            <span className="file-name">Saved to the client database, not to this repository.</span>
            <button className="button button-primary" type="submit" disabled={saving || (!client.firstName.trim() && !client.lastName.trim())}>{saving ? "Saving…" : "Add client"}</button>
          </div>
        </form>
        {error && <p className="result-note" role="alert">{error}</p>}
      </section>

      <section className="intake-panel" aria-labelledby="client-list-heading">
        <div className="intake-section-heading">
          <div><span className="eyebrow">02 / Sorted A–Z</span><h2 id="client-list-heading">Client entries</h2></div>
          <span className="step-count">{sortedClients.length} {sortedClients.length === 1 ? "client" : "clients"}</span>
        </div>
        {loading ? (
          <p className="result-note" role="status">Loading clients…</p>
        ) : sortedClients.length ? (
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
