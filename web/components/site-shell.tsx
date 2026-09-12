import Link from "next/link";
import type { ReactNode } from "react";

type Section = { name: string; description: string; stages: string[] };

export function SiteShell({ sections, children }: { sections: Section[]; children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Hobbes home"><span className="brand-mark" aria-hidden="true">h.</span>Hobbes</Link>
        <div className="sidebar-body">
          <nav aria-label="Main navigation" className="primary-nav">
            <Link href="/">Home</Link>
            <Link href="/library">Search</Link>
          </nav>
          <div className="section-nav">
            <nav aria-label="Sections">{sections.map((section) => <Link href={`/library?section=${encodeURIComponent(section.name)}`} key={section.name}>{section.name}</Link>)}</nav>
          </div>
        </div>
      </aside>
      <div className="workspace"><main id="main-content" tabIndex={-1}>{children}</main></div>
    </div>
  );
}
