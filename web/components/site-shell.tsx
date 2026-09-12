import Link from "next/link";
import type { ReactNode } from "react";

type Section = { name: string; description: string; stages: string[] };

export function SiteShell({ sections, children }: { sections: Section[]; children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Hobbes home"><span className="brand-mark" aria-hidden="true">h.</span><span>Hobbes<span className="brand-caption">THE KNOWLEDGE BASE</span></span></Link>
        <div className="sidebar-body">
          <p className="nav-label">Your starting point</p>
          <nav aria-label="Main navigation" className="primary-nav">
            <Link href="/"><span aria-hidden="true">⌂</span> Overview</Link>
            <Link href="/library"><span aria-hidden="true">▤</span> Document library</Link>
          </nav>
          <div className="section-nav">
            <p className="nav-label">Knowledge spaces</p>
            <nav aria-label="Knowledge spaces">{sections.map((section, index) => <Link href={`/library?section=${encodeURIComponent(section.name)}`} key={section.name}><span className="nav-number">{String(index + 1).padStart(2, "0")}</span>{section.name}</Link>)}</nav>
          </div>
        </div>
        <div className="sidebar-note"><span className="status-dot" /> Shared knowledge. Better work.<p>A place for the principles, processes, and practices that move us forward.</p></div>
      </aside>
      <div className="workspace">
        <header className="topbar"><span>THE HOBBES FIELD GUIDE</span><Link href="/library">Find a document <span aria-hidden="true">↗</span></Link></header>
        <main id="main-content" tabIndex={-1}>{children}</main>
        <footer className="site-footer"><span>Hobbes / Operational knowledge</span><span>Built to be useful. Written to be shared.</span></footer>
      </div>
    </div>
  );
}
