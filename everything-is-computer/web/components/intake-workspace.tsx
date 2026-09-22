"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { ClientPayload, IntakeKind, ProcessPayload, Submission } from "../lib/intake-types";

type Payload = ClientPayload | ProcessPayload;
type Session = { authenticated: true; userId: string };
type PublicationDraft = {
  text: string;
  reviewedText: string | null;
  dirty: boolean;
  busy: boolean;
  uncertain: boolean;
  error: string;
};
type WorkspaceState = {
  submissions: Submission[] | null;
  save: (payload: Payload, onSaved: () => void) => Promise<void>;
  saving: boolean;
  locked: boolean;
  publication: (submission: Submission) => ReactNode;
};

class IntakeError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const json = body === undefined ? undefined : JSON.stringify(body);
  if (json && new TextEncoder().encode(json).byteLength > 400000) {
    throw new IntakeError("The request exceeds 400,000 bytes. Shorten the notes or actions before saving.", 413);
  }
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
    ...(json === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: json }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new IntakeError(data?.error || `Request failed (${response.status}).`, response.status);
  if (response.status !== 204 && data === null) throw new IntakeError("The server returned an unexpected response.", response.status);
  return data as T;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function rejectedBeforeWrite(error: unknown) {
  return error instanceof IntakeError && [400, 413, 415].includes(error.status);
}

function mergeRecords(current: Submission[], incoming: Submission[]) {
  return Array.from(new Map([...current, ...incoming].map((entry) => [entry.id, entry])).values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
}

function initialPublication(submission: Submission): PublicationDraft {
  return {
    text: submission.publication_text ?? (submission.kind === "client"
      ? "Client intake received. Identifying details remain in the private intake database."
      : ""),
    reviewedText: null, dirty: false, busy: false, uncertain: false, error: "",
  };
}

export function IntakeWorkspace({ kind, dirty, onDiscard, children }: {
  kind: IntakeKind;
  dirty: boolean;
  onDiscard: () => void;
  children: (state: WorkspaceState) => ReactNode;
}) {
  const [session, setSession] = useState<"checking" | "signed-out" | "authenticated" | "account-changed">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "uncertain">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [publications, setPublications] = useState<Record<string, PublicationDraft>>({});
  const records = useRef<Submission[] | null>(null);
  const drafts = useRef<Record<string, PublicationDraft>>({});
  const pendingSave = useRef<{ id: string; kind: IntakeKind; payload: Payload } | null>(null);
  const saveBusy = useRef(false);
  const publicationRequests = useRef(new Set<string>());
  const authRequest = useRef(false);
  const listRequest = useRef(0);
  const generation = useRef(0);
  const retainedOwner = useRef<string | null>(null);
  const activeOwner = useRef<string | null>(null);
  const skipUnload = useRef(false);

  const isCurrent = useCallback((token: number) => generation.current === token && activeOwner.current !== null, []);
  const storeRecords = useCallback((value: Submission[] | null) => {
    records.current = value;
    setSubmissions(value);
  }, []);
  const storeDrafts = useCallback((value: Record<string, PublicationDraft>) => {
    drafts.current = value;
    setPublications(value);
  }, []);
  const updatePublication = useCallback((submission: Submission, patch: Partial<PublicationDraft>) => {
    storeDrafts({ ...drafts.current, [submission.id]: { ...(drafts.current[submission.id] ?? initialPublication(submission)), ...patch } });
  }, [storeDrafts]);

  const reconcilePublications = useCallback((incoming: Submission[]) => {
    const updated = { ...drafts.current };
    for (const record of incoming) {
      const draft = updated[record.id];
      if (draft && record.publication_text !== null) {
        updated[record.id] = { ...draft, text: record.publication_text, dirty: false, uncertain: false,
          reviewedText: draft.reviewedText === record.publication_text ? draft.reviewedText : null,
          error: record.pr_url ? "" : draft.error };
      }
    }
    storeDrafts(updated);
  }, [storeDrafts]);

  const requireLogin = useCallback((error: unknown, token: number) => {
    if (!isCurrent(token) || !(error instanceof IntakeError && error.status === 401)) return;
    // Invalidate every old completion, while retaining only this owner's in-memory drafts.
    ++generation.current;
    ++listRequest.current;
    activeOwner.current = null;
    saveBusy.current = false;
    publicationRequests.current.clear();
    setLoading(false);
    if (pendingSave.current) {
      setSaveState("uncertain");
      setSaveError(true);
      setSaveMessage("Save not confirmed. Log in as the same owner to retry the retained UUID and snapshot.");
    }
    storeDrafts(Object.fromEntries(Object.entries(drafts.current).map(([id, draft]) => [id, {
      ...draft, reviewedText: null, busy: false, uncertain: draft.uncertain || draft.busy,
    }])));
    setSession("signed-out");
    setAuthError("Your session has expired. Drafts are retained only in this tab and hidden until the same owner logs in again.");
  }, [isCurrent, storeDrafts]);

  const loadPage = useCallback(async (offset = 0) => {
    const token = generation.current;
    if (!isCurrent(token)) return;
    const currentRequest = ++listRequest.current;
    setLoading(true);
    setListError("");
    try {
      const data = await request<{ submissions: Submission[]; nextOffset: number | null }>(`/api/intake/submissions?kind=${kind}&offset=${offset}`);
      if (!isCurrent(token) || currentRequest !== listRequest.current) return;
      if (!Array.isArray(data.submissions) || !(data.nextOffset === null || (Number.isInteger(data.nextOffset) && data.nextOffset > offset))) {
        throw new Error("The server returned an unexpected saved-record page.");
      }
      storeRecords(mergeRecords(offset === 0 ? [] : records.current ?? [], data.submissions));
      setNextOffset(data.nextOffset);
      reconcilePublications(data.submissions);
    } catch (error) {
      if (!isCurrent(token) || currentRequest !== listRequest.current) return;
      setListError(`Saved records could not be reloaded. ${errorMessage(error)}`);
      requireLogin(error, token);
    } finally {
      if (isCurrent(token) && currentRequest === listRequest.current) setLoading(false);
    }
  }, [kind, isCurrent, storeRecords, reconcilePublications, requireLogin]);

  const acceptSession = useCallback((data: Session) => {
    if (data.authenticated !== true || typeof data.userId !== "string" || !data.userId) throw new Error("The session identity could not be verified.");
    ++generation.current;
    if (retainedOwner.current && retainedOwner.current !== data.userId) {
      activeOwner.current = null;
      setSession("account-changed");
      return;
    }
    retainedOwner.current = data.userId;
    activeOwner.current = data.userId;
    setSession("authenticated");
    setAuthError("");
    if (records.current === null) void loadPage();
  }, [loadPage]);

  useEffect(() => {
    const token = ++generation.current;
    request<Session>("/api/intake/session").then((data) => {
      if (generation.current === token) acceptSession(data);
    }).catch((error: unknown) => {
      if (generation.current !== token) return;
      setSession("signed-out");
      if (!(error instanceof IntakeError && error.status === 401)) setAuthError(errorMessage(error));
    });
    return () => { ++generation.current; activeOwner.current = null; };
  }, [acceptSession]);

  const publicationBusy = Object.values(publications).some((draft) => draft.busy);
  const unsaved = dirty || saveState !== "idle" || Object.values(publications).some((draft) => draft.dirty || draft.busy || draft.uncertain);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (skipUnload.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authRequest.current) return;
    authRequest.current = true;
    const token = ++generation.current;
    setAuthBusy(true);
    setAuthError("");
    const credentials = { email, password };
    setPassword("");
    try {
      const data = await request<Session>("/api/intake/session", "POST", credentials);
      if (generation.current !== token) return;
      // acceptSession starts a new authenticated generation.
      authRequest.current = false;
      setAuthBusy(false);
      acceptSession(data);
    } catch (error) {
      if (generation.current === token) setAuthError(errorMessage(error));
    } finally {
      if (generation.current === token) {
        authRequest.current = false;
        setAuthBusy(false);
      }
    }
  }

  function discardDrafts() {
    pendingSave.current = null;
    saveBusy.current = false;
    publicationRequests.current.clear();
    storeDrafts({});
    storeRecords(null);
    retainedOwner.current = null;
    setNextOffset(null);
    setLoading(false);
    setListError("");
    setSaveState("idle");
    setSaveMessage("");
    setSaveError(false);
    setEmail("");
    setPassword("");
    onDiscard();
  }

  async function logout() {
    if (authRequest.current || saveBusy.current || publicationRequests.current.size) return;
    if (unsaved && !window.confirm("Discard all unsaved intake and publication drafts in this tab and log out?")) return;
    const token = ++generation.current;
    ++listRequest.current;
    activeOwner.current = null;
    authRequest.current = true;
    setAuthBusy(true);
    setAuthError("");
    setSession("signed-out");
    discardDrafts();
    try {
      await request("/api/intake/session", "DELETE");
    } catch (error) {
      if (generation.current === token) setAuthError(`Drafts were discarded, but log out could not be confirmed. ${errorMessage(error)}`);
    } finally {
      if (generation.current === token) {
        authRequest.current = false;
        setAuthBusy(false);
      }
    }
  }

  function remember(submission: Submission, token: number) {
    if (!isCurrent(token)) return;
    const listWasUnknown = records.current === null;
    // A GET started before this write must not replace its confirmed result.
    ++listRequest.current;
    setLoading(false);
    storeRecords(mergeRecords(records.current ?? [], [submission]));
    reconcilePublications([submission]);
    if (listWasUnknown) void loadPage();
  }

  async function save(payload: Payload, onSaved: () => void): Promise<void> {
    const token = generation.current;
    if (saveBusy.current || !isCurrent(token)) return;
    saveBusy.current = true;
    setSaveState("saving");
    setSaveMessage("");
    setSaveError(false);
    try {
      pendingSave.current ??= { id: crypto.randomUUID(), kind, payload: structuredClone(payload) };
      const snapshot = pendingSave.current;
      const data = await request<{ submission: Submission }>("/api/intake/submissions", "POST", snapshot);
      if (!isCurrent(token)) return;
      if (data.submission?.id !== snapshot.id) throw new Error("The saved record could not be verified.");
      remember(data.submission, token);
      pendingSave.current = null;
      setSaveState("idle");
      setSaveMessage("Saved to the private database. Nothing has been published to GitHub.");
      // Clear the caller's form in the same verified generation, not a later promise continuation.
      onSaved();
    } catch (error) {
      if (!isCurrent(token)) return;
      setSaveError(true);
      if (rejectedBeforeWrite(error)) {
        pendingSave.current = null;
        setSaveState("idle");
        setSaveMessage(`Save rejected before writing. ${errorMessage(error)} Your draft is retained and editable. Correct it, then save again.`);
      } else {
        setSaveState("uncertain");
        setSaveMessage(`Save not confirmed. ${errorMessage(error)} Your fields are retained and locked. Retry save sends the same UUID and snapshot, not a duplicate. Stay in this tab until confirmed.`);
        requireLogin(error, token);
        if (isCurrent(token)) void loadPage();
      }
    } finally {
      if (isCurrent(token)) saveBusy.current = false;
    }
  }

  async function recoverPublication(submission: Submission, token: number) {
    try {
      const data = await request<{ submission: Submission }>(`/api/intake/submissions/${submission.id}`);
      if (!isCurrent(token)) return;
      if (data.submission?.id !== submission.id) throw new Error("The publication record could not be verified.");
      remember(data.submission, token);
      updatePublication(data.submission, { uncertain: false, reviewedText: null,
        ...(data.submission.pr_url ? { error: "" } : {}) });
    } catch (error) {
      if (!isCurrent(token)) return;
      updatePublication(submission, { uncertain: true, error: `This record remains saved, but its publication status could not be verified. ${errorMessage(error)} Check its status before retrying; do not save a new copy.` });
      requireLogin(error, token);
    }
  }

  async function publicationAction(submission: Submission, recoverOnly = false) {
    const token = generation.current;
    if (!isCurrent(token) || publicationRequests.current.has(submission.id)) return;
    const draft = drafts.current[submission.id] ?? initialPublication(submission);
    const text = submission.publication_text ?? draft.text;
    if (!recoverOnly && (draft.uncertain || draft.reviewedText !== text || !text.trim() || submission.pr_url)) return;
    publicationRequests.current.add(submission.id);
    updatePublication(submission, { busy: true, ...(recoverOnly ? {} : { error: "" }) });
    try {
      if (recoverOnly) {
        await recoverPublication(submission, token);
      } else {
        const data = await request<{ submission: Submission }>(`/api/intake/submissions/${submission.id}/publish`, "POST", { text, confirmed: true });
        if (!isCurrent(token)) return;
        if (data.submission?.id !== submission.id || !data.submission.pr_url) throw new Error("The pull request could not be verified.");
        remember(data.submission, token);
      }
    } catch (error) {
      if (!isCurrent(token)) return;
      if (rejectedBeforeWrite(error)) {
        updatePublication(submission, { uncertain: false, error: `Publication rejected before writing. ${errorMessage(error)} Your publication draft is retained.` });
      } else {
        updatePublication(submission, { uncertain: true, error: `The record is still saved. Pull request creation was not confirmed. ${errorMessage(error)} Retry uses the same saved record and frozen publication text.` });
        requireLogin(error, token);
        if (isCurrent(token)) await recoverPublication(submission, token);
      }
    } finally {
      if (isCurrent(token)) {
        publicationRequests.current.delete(submission.id);
        updatePublication(submission, { busy: false, reviewedText: null });
      }
    }
  }

  if (session === "checking") return <section className="intake-panel" role="status">Checking your intake session…</section>;
  if (session === "account-changed") return <section className="intake-panel" aria-labelledby="account-changed-heading">
    <h2 id="account-changed-heading">Different account detected</h2>
    <p role="alert">Retained records and drafts belong to the previous owner and remain hidden. Discard them and reload before using this account.</p>
    <button className="button button-secondary" type="button" onClick={() => {
      if (unsaved && !window.confirm("Discard the previous owner's unsaved drafts and reload for this account?")) return;
      ++generation.current;
      skipUnload.current = true;
      discardDrafts();
      window.location.reload();
    }}>Discard drafts and reload</button>
  </section>;

  if (session === "signed-out") return (
    <section className="intake-panel" aria-labelledby="intake-login-heading">
      <div className="intake-section-heading"><h2 id="intake-login-heading">Owner login</h2></div>
      <p className="result-note">Log in with your existing owner account to save and review private intake records. There is no public signup.</p>
      {authError && <p role="alert">{authError}</p>}
      <form onSubmit={login}>
        <div className="client-fields">
          <label className="client-field"><span className="field-label">Login email</span><input type="email" autoComplete="username" required maxLength={320} value={email} disabled={authBusy} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="client-field"><span className="field-label">Password</span><input type="password" autoComplete="current-password" required value={password} disabled={authBusy} onChange={(event) => setPassword(event.target.value)} /></label>
        </div>
        <div className="intake-actions"><button className="button button-primary" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : "Log in"}</button></div>
      </form>
    </section>
  );

  return <>
    <section className="intake-panel" aria-label="Intake session">
      <p className="result-note">Private intake workspace · {submissions === null ? "loading records" : `${submissions.length} loaded ${kind} records`}. Pages load newest first, five at a time.{kind === "client" ? " Clients are sorted A–Z among loaded records." : ""} Refresh resets the list to the first page. Saving is separate from publication. Record deletion is not available here.</p>
      <div className="intake-actions">
        <button className="button button-secondary" type="button" disabled={loading || authBusy} onClick={() => void loadPage()}>{loading ? "Loading saved records…" : "Reload saved records"}</button>
        <button className="button button-secondary" type="button" disabled={authBusy || saveState === "saving" || publicationBusy} onClick={() => void logout()}>Log out</button>
      </div>
      {authError && <p role="alert">{authError}</p>}
      {listError && <p role="alert">{listError} Any records already shown remain saved.</p>}
      {saveMessage && <p role={saveError ? "alert" : "status"}>{saveMessage}</p>}
    </section>
    {children({
      submissions, save, saving: saveState === "saving", locked: saveState !== "idle",
      publication: (submission) => <PublicationReview key={submission.id} submission={submission}
        draft={publications[submission.id] ?? initialPublication(submission)}
        update={(patch) => updatePublication(submission, patch)}
        publish={() => void publicationAction(submission)} recover={() => void publicationAction(submission, true)} />,
    })}
    {nextOffset !== null && <div className="intake-actions"><button className="button button-secondary" type="button" disabled={loading} onClick={() => void loadPage(nextOffset)}>Load older records</button></div>}
  </>;
}

function PublicationReview({ submission, draft, update, publish, recover }: {
  submission: Submission;
  draft: PublicationDraft;
  update: (patch: Partial<PublicationDraft>) => void;
  publish: () => void;
  recover: () => void;
}) {
  const frozen = submission.publication_text !== null;
  const reviewText = submission.publication_text ?? draft.text;
  const confirmed = draft.reviewedText === reviewText;
  return <div className="intake-publication">
    <h3>Review for public publication</h3>
    <p className="result-note">Creating a pull request sends the text below into public GitHub history immediately; even an attempt that later fails may have written it. It may also appear in a Vercel preview before merge. The production website updates after the owner merges the pull request; this does not commit directly to main. Remove identifying, confidential, or sensitive details yourself.</p>
    {submission.pr_url && <p><a className="button button-secondary" href={submission.pr_url} target="_blank" rel="noreferrer">View pull request</a> · Owner review and merge required for production.</p>}
    {frozen && <p className="result-note">Publication text is frozen from the first attempt. Any retry uses this same snapshot, even if GitHub previously failed.</p>}
    <form onSubmit={(event) => { event.preventDefault(); publish(); }}>
      <label className="client-field"><span className="field-label">Public publication text</span><textarea maxLength={50000} value={reviewText} disabled={draft.busy || draft.uncertain} readOnly={frozen || Boolean(submission.pr_url)} placeholder="Write a redacted, public-safe process summary. Private notes and actions are not copied here." onChange={(event) => update({ text: event.target.value, reviewedText: null, dirty: event.target.value !== initialPublication(submission).text })} /></label>
      {!submission.pr_url && <>
        <label className="intake-review-confirmation"><input type="checkbox" checked={confirmed} disabled={draft.busy || draft.uncertain} onChange={(event) => update({ reviewedText: event.target.checked ? reviewText : null })} /><span>I reviewed this text for public Git history and website publication</span></label>
        <div className="intake-actions"><button className="button button-primary" type="submit" disabled={draft.busy || draft.uncertain || !confirmed || !reviewText.trim()}>{draft.busy ? "Creating pull request…" : "Create pull request"}</button></div>
      </>}
    </form>
    {draft.error && <p role="alert">{draft.error}</p>}
    {draft.uncertain && <button className="button button-secondary" type="button" disabled={draft.busy} onClick={recover}>Check publication status</button>}
  </div>;
}
