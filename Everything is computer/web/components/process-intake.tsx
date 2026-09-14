"use client";

import { ChangeEvent, useMemo, useState } from "react";

type CustomerType = "Internal Customers" | "External Customers";

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
  const [draft, setDraft] = useState<ReturnType<typeof draftFromText> | null>(null);
  const selected = useMemo(() => steps[customerType].find((step) => step.number === selectedStep) ?? steps[customerType][0], [customerType, selectedStep]);

  function changeCustomerType(type: CustomerType) {
    setCustomerType(type);
    setSelectedStep("01");
    setDraft(null);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setSourceText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
    setDraft(null);
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
        <textarea id="process-notes" value={sourceText} onChange={(event) => { setSourceText(event.target.value); setFileName(""); setDraft(null); }} placeholder="Example: The lead comes in through the website. We reply within one business day, ask about their goals, and book a call..." />
        <div className="intake-actions"><label className="button button-secondary upload-button"><span>Upload .txt file</span><input type="file" accept=".txt,text/plain" onChange={handleFile} /></label><span className="file-name" aria-live="polite">{fileName || "Plain text only · nothing leaves this browser"}</span><button className="button button-primary" onClick={generateDraft} disabled={!sourceText.trim()}>Build process draft</button></div>
      </section>

      {draft && <section className="intake-results" aria-live="polite" aria-labelledby="draft-heading">
        <div className="draft-column"><span className="eyebrow">03 / Structured draft</span><h2 id="draft-heading">{draft.title}</h2><p className="result-note">These actions were pulled from your source. Review and edit them before treating this as an approved process.</p><ol className="action-list">{draft.actions.map((action, index) => <li key={`${action}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`Process action ${index + 1}`} defaultValue={action} /></li>)}</ol></div>
        <div className="gaps-column"><span className="eyebrow">Open questions</span><h2>Fill the gaps</h2><p className="result-note">Answer these before publishing the process.</p><ul className="gap-list">{draft.gaps.map((gap) => <li key={gap}><span>?</span>{gap}</li>)}</ul><button className="button button-secondary" onClick={() => document.getElementById("process-notes")?.focus()}>Add more notes</button></div>
      </section>}
    </div>
  );
}
