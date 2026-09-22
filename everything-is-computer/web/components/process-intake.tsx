"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { ProcessPayload } from "../lib/intake-types";
import { IntakeWorkspace } from "./intake-workspace";

type CustomerType = ProcessPayload["customerType"];

type ProcessStep = {
  number: string;
  name: string;
  description: string;
};

const steps: Record<CustomerType, ProcessStep[]> = {
  "Internal Customers": [
    { number: "01", name: "Attraction", description: "Create interest and bring the right people into the organization." },
    { number: "02", name: "Selection", description: "Choose the people who are the best fit for the role and team." },
    { number: "03", name: "Hiring", description: "Make a clear, consistent offer and complete the hiring handoff." },
    { number: "04", name: "Onboarding", description: "Help a new teammate become confident, connected, and productive." },
    { number: "05", name: "Performance", description: "Set expectations, coach progress, and review outcomes." },
    { number: "06", name: "Growth", description: "Develop capability and create paths for greater responsibility." },
    { number: "07", name: "Rewards", description: "Recognize contribution with fair and timely rewards." },
    { number: "08", name: "Transitions", description: "Handle role changes and departures with care and clarity." },
  ],
  "External Customers": [
    { number: "01", name: "Leads", description: "Capture and qualify people who may benefit from the offer." },
    { number: "02", name: "Offer", description: "Explain the right offer and help the customer decide." },
    { number: "03", name: "Assessment", description: "Understand the customer’s situation, needs, and constraints." },
    { number: "04", name: "Estimate", description: "Turn the assessment into a clear scope, estimate, and next step." },
    { number: "05", name: "Follow-Up", description: "Keep commitments visible and move the opportunity forward." },
    { number: "06", name: "Approval", description: "Confirm the decision, scope, and authorization to proceed." },
    { number: "07", name: "Production", description: "Deliver the agreed work with quality and communication." },
    { number: "08", name: "Max LTV", description: "Create lasting value and earn the next opportunity." },
  ],
};

function draftFromText(text: string, step: ProcessStep) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const actions = lines.slice(0, 5);
  return {
    actions: actions.length ? actions : ["No clear actions found yet. Add the first action to this process."],
    gaps: [
      "Who owns this step from start to finish?",
      "What starts the process, and what is the expected outcome?",
      actions.length < 3 ? "What happens after the current notes end?" : "What evidence confirms this step is complete?",
    ],
    title: `${step.name} process draft`,
  };
}

export function ProcessIntake() {
  const [customerType, setCustomerType] = useState<CustomerType>("External Customers");
  const [selectedStep, setSelectedStep] = useState("01");
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof draftFromText> | null>(null);
  const fileRequest = useRef(0);
  useEffect(() => () => { ++fileRequest.current; }, []);

  function discardDraft() {
    ++fileRequest.current;
    setCustomerType("External Customers");
    setSelectedStep("01");
    setSourceText("");
    setFileName("");
    setReadingFile(false);
    setFileError("");
    setDraft(null);
  }
  const selected = useMemo(() => steps[customerType].find((step) => step.number === selectedStep) ?? steps[customerType][0], [customerType, selectedStep]);

  function changeCustomerType(type: CustomerType) {
    setCustomerType(type);
    setSelectedStep("01");
    setDraft(null);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const token = ++fileRequest.current;
    setFileError("");
    setReadingFile(true);
    try {
      if (file.size > 200000) throw new Error("Choose a plain-text file with at most 50,000 characters.");
      const text = await file.text();
      if (token !== fileRequest.current) return;
      if (text.length > 50000) throw new Error("Source notes must be at most 50,000 characters. Your previous notes have not been replaced.");
      setSourceText(text);
      setFileName(file.name);
      setDraft(null);
    } catch (error) {
      if (token !== fileRequest.current) return;
      setFileError(error instanceof Error ? error.message : "The file could not be read. Your previous notes have not been replaced.");
    } finally {
      if (token === fileRequest.current) setReadingFile(false);
    }
  }

  function generateDraft() {
    setDraft(draftFromText(sourceText, selected));
  }

  return (
    <div className="page intake-page">
      <header className="page-heading intake-heading">
        <div>
          <span className="eyebrow">Process workspace</span>
          <h1>Turn notes into a process</h1>
          <p className="intake-intro">Choose a customer journey step, paste what you know, or upload a plain-text note. Hobbes will organize the covered actions and surface the gaps to fill next.</p>
        </div>
      </header>

      <IntakeWorkspace kind="process" dirty={Boolean(sourceText || draft || readingFile)} onDiscard={discardDraft}>
        {({ submissions, save, saving, locked, publication }) => <>
          <fieldset className="intake-fields" disabled={locked || readingFile}>
            <section className="intake-panel" aria-labelledby="customer-type-heading">
              <div className="intake-section-heading">
                <div><span className="eyebrow">01 / Journey</span><h2 id="customer-type-heading">Who is this process for?</h2></div>
                <span className="step-count">{steps[customerType].length} steps</span>
              </div>
              <div className="customer-tabs" role="tablist" aria-label="Customer type">
                {(Object.keys(steps) as CustomerType[]).map((type) => <button className={customerType === type ? "customer-tab active" : "customer-tab"} key={type} onClick={() => changeCustomerType(type)} role="tab" aria-selected={customerType === type}>{type}</button>)}
              </div>
              <div className="process-steps" aria-label={`${customerType} steps`}>
                {steps[customerType].map((step) => <button className={selected.number === step.number ? "process-step selected" : "process-step"} key={step.number} onClick={() => { setSelectedStep(step.number); setDraft(null); }}><span>{step.number}</span><strong>{step.name}</strong></button>)}
              </div>
              <div className="selected-step"><span className="selected-step-number">{selected.number}</span><div><strong>{selected.name}</strong><p>{selected.description}</p></div></div>
            </section>

            <section className="intake-panel" aria-labelledby="source-heading">
              <div className="intake-section-heading"><div><span className="eyebrow">02 / Source material</span><h2 id="source-heading">Add what you know</h2></div></div>
              <label className="field-label" htmlFor="process-notes">Paste notes, a transcript, or an existing procedure</label>
              <textarea id="process-notes" value={sourceText} maxLength={50000} onChange={(event) => { setSourceText(event.target.value); setFileName(""); setFileError(""); setDraft(null); }} placeholder="Example: The lead comes in through the website. We reply within one business day, ask about their goals, and book a call..." />
              <div className="intake-actions"><label className="button button-secondary upload-button"><span>Upload .txt file</span><input type="file" accept=".txt,text/plain" onChange={handleFile} /></label><span className="file-name" aria-live="polite">{readingFile ? "Reading file…" : fileName || "Plain text · private until you choose to save"}</span><button className="button button-primary" onClick={generateDraft} disabled={!sourceText.trim()}>Build process draft</button></div>
              {fileError && <p role="alert">{fileError}</p>}
            </section>

            {draft && <section className="intake-results" aria-labelledby="draft-heading">
              <div className="draft-column">
                <span className="eyebrow">03 / Structured draft</span><h2 id="draft-heading">{draft.title}</h2>
                <p className="result-note">The first five nonempty source lines start this draft. Review and edit the actions before treating this as an approved process. Saving preserves your notes and edited actions privately; it does not publish them.</p>
                <ol className="action-list">{draft.actions.map((action, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`Process action ${index + 1}`} value={action} maxLength={2000} onChange={(event) => setDraft((current) => current && ({ ...current, actions: current.actions.map((value, actionIndex) => actionIndex === index ? event.target.value : value) }))} /></li>)}</ol>
                {draft.actions.some((action) => !action.trim() || action.length > 2000) && <p role="alert">Each action needs 1–2,000 characters. Edit empty or overlong actions before saving.</p>}
              </div>
              <div className="gaps-column"><span className="eyebrow">Open questions</span><h2>Fill the gaps</h2><p className="result-note">Answer these before publishing the process.</p><ul className="gap-list">{draft.gaps.map((gap) => <li key={gap}><span>?</span>{gap}</li>)}</ul><button className="button button-secondary" onClick={() => document.getElementById("process-notes")?.focus()}>Add more notes</button></div>
            </section>}
          </fieldset>

          {draft && <div className="intake-actions">
            <button className="button button-primary" type="button" disabled={saving || readingFile || draft.actions.some((action) => !action.trim() || action.length > 2000)} onClick={() => {
              void save({ customerType, selectedStep, sourceText, actions: draft.actions }, () => {
                setSourceText("");
                setFileName("");
                setDraft(null);
              });
            }}>{saving ? "Saving…" : locked ? "Retry save" : "Save process"}</button>
          </div>}

          <section className="intake-panel saved-processes" aria-labelledby="saved-processes-heading">
            <div className="intake-section-heading"><div><span className="eyebrow">04 / Private records</span><h2 id="saved-processes-heading">Saved processes</h2></div></div>
            {submissions === null ? <p className="result-note">Waiting for saved process records.</p> : submissions.length ? <ol className="client-list">
              {submissions.map((submission) => {
                const payload = submission.payload as ProcessPayload;
                const step = steps[payload.customerType].find((entry) => entry.number === payload.selectedStep);
                return <li className="client-entry process-entry" key={submission.id}>
                  <h3>{payload.customerType} · {payload.selectedStep} {step?.name}</h3>
                  <details><summary>Private source notes</summary><pre className="intake-source-text">{payload.sourceText}</pre></details>
                  <ol className="saved-process-actions">{payload.actions.map((action, index) => <li key={index}>{action}</li>)}</ol>
                  {publication(submission)}
                </li>;
              })}
            </ol> : <p className="result-note">No saved processes yet. Build and review a draft above, then save it.</p>}
          </section>
        </>}
      </IntakeWorkspace>
    </div>
  );
}
