"use client";

import { useEffect, useId, useState } from "react";

// Mermaid uses shared configuration and temporary DOM IDs. Serialize rendering,
// including Strict Mode's repeated effects, so diagrams cannot interfere.
let renderQueue: Promise<void> = Promise.resolve();

function renderFlowchart(id: string, source: string): Promise<string> {
  const task = renderQueue.then(async () => {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      deterministicIds: true,
      deterministicIDSeed: id,
      maxTextSize: 30000,
      maxEdges: 300,
      theme: "neutral",
      fontFamily: "Arial, Helvetica, sans-serif",
      htmlLabels: false,
      flowchart: { htmlLabels: false, useMaxWidth: true },
      secure: ["secure", "securityLevel", "startOnLoad", "suppressErrorRendering", "maxTextSize", "maxEdges", "htmlLabels", "flowchart", "fontFamily"],
    });
    const container = document.createElement("div");
    container.className = "mermaid-measure";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);
    try {
      const { svg } = await mermaid.render(id, source, container);
      return svg;
    } finally {
      // Also remove Mermaid's temporary error output after a parser failure.
      container.remove();
    }
  });
  renderQueue = task.then(() => undefined, () => undefined);
  return task;
}

function fallbackReason(source: string): string | null {
  if (source.length > 30000) return "This diagram is too large to preview safely.";
  // Only the local flowchart renderer is enabled. Other diagram types may load
  // icons/images or have different configuration and interaction surfaces.
  if (!/^\s*(?:(?:%%[^\n]*\n)\s*)*(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b/.test(source)) {
    return "Preview is available for flowcharts only. The original source is below.";
  }
  // Conservative plain-text subset: no directives/frontmatter, HTML, image
  // shapes, CSS escapes/URLs, or click handlers. Rejected input stays as text.
  if (/%%\s*\{|^\s*---|@\s*\{|\\|<\s*[a-z!\/]|(?:https?|data|javascript|file):|url\s*\(|@import|\b(?:click|classDef|style|linkStyle)\b/im.test(source)) {
    return "This diagram uses features disabled by the local preview security policy.";
  }
  return null;
}

type Preview = { source: string; image?: string; error?: string };

export function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId();
  // Encode rather than strip characters: distinct React IDs remain distinct,
  // and the result is deterministic across server rendering and hydration.
  const id = `hobbes-mermaid-${Array.from(reactId, (char) => char.codePointAt(0)!.toString(16)).join("-")}`;
  const [preview, setPreview] = useState<Preview | null>(null);
  const current = preview?.source === source ? preview : null;

  useEffect(() => {
    let cancelled = false;
    const reason = fallbackReason(source);
    if (reason) {
      setPreview({ source, error: reason });
      return;
    }
    renderFlowchart(id, source).then(
      (svg) => {
        if (!cancelled) {
          // SVG in an image is inert: no scripts, clickable links, embedded
          // HTML, or external subresource loading. Never inject it into the DOM
          // as markup or call Mermaid's bindFunctions.
          setPreview({ source, image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` });
        }
      },
      () => {
        if (!cancelled) setPreview({ source, error: "The diagram could not be rendered. You can still read its original source below." });
      },
    );
    return () => { cancelled = true; };
  }, [id, source]);

  return (
    <figure className="mermaid-diagram" aria-labelledby={`${id}-caption`}>
      <figcaption id={`${id}-caption`}>Mermaid · diagram</figcaption>
      {current?.image ? (
        <div className="mermaid-preview" role="region" aria-label="Diagram preview" tabIndex={0}>
          {/* A plain image deliberately isolates Mermaid's SVG from the page DOM. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.image} alt="Flowchart rendered from the Mermaid source available below." onError={() => setPreview({ source, error: "The diagram image could not be displayed. The original source is below." })} />
        </div>
      ) : (
        <p className="mermaid-status" role="status">{current?.error || "Rendering diagram locally…"}</p>
      )}
      <details className="mermaid-source" open={!current?.image}>
        <summary>Mermaid source</summary>
        <pre tabIndex={0} aria-label="Mermaid diagram source"><code>{source}</code></pre>
      </details>
    </figure>
  );
}
