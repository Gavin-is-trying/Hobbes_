import { Fragment, type ReactNode } from "react";

type Section = { name: string; stages: string[] };

export function SiteShell({ sections, children }: { sections: Section[]; children: ReactNode }) {
  // Document navigation lets the intake's native beforeunload guard protect unsaved work, including browser Back.
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <div className="sidebar-body">
          <nav aria-label="Main navigation" className="primary-nav">
            <a href="/">Home</a>
            <a href="/library">Search</a>
            <a className="nav-highlight" href="/intake">Build a process</a>
          </nav>
          <div className="section-nav">
            <nav aria-label="Sections">{sections.map((section) => <Fragment key={section.name}><a href={`/library?section=${encodeURIComponent(section.name)}`}>{section.name}</a>{section.stages.includes("Clients") && <a className="nav-sub" href="/clients">Clients</a>}</Fragment>)}</nav>
          </div>
        </div>
      </aside>
      <div className="workspace"><main id="main-content" tabIndex={-1}>{children}</main></div>
    </div>
  );
}
