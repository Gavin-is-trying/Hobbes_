import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type Section = { name: string; stages: string[] };

export function SiteShell({ sections, children }: { sections: Section[]; children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <div className="sidebar-body">
            <nav aria-label="Main navigation" className="primary-nav">
             <Link href="/">Home</Link>
             <Link href="/library">Search</Link>
             <Link className="nav-highlight" href="/intake">Build a process</Link>
            </nav>
          <div className="section-nav">
            <nav aria-label="Sections">{sections.map((section) => <Fragment key={section.name}><Link href={`/library?section=${encodeURIComponent(section.name)}`}>{section.name}</Link>{section.stages.includes("Clients") && <Link className="nav-sub" href="/clients">Clients</Link>}</Fragment>)}</nav>
          </div>
        </div>
      </aside>
      <div className="workspace"><main id="main-content" tabIndex={-1}>{children}</main></div>
    </div>
  );
}
