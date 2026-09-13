"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Doc } from "../lib/content";

type LibraryDoc = Doc & { href: string };

export function DocumentLibrary({ documents, sections }: { documents: LibraryDoc[]; sections: string[] }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const section = searchParams.get("section") || "";
  const options = Array.from(new Set([...sections, ...documents.map((doc) => doc.section), ...(section ? [section] : [])]));
  const results = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return documents.filter((doc) => (!section || doc.section === section) && terms.every((term) => `${doc.title} ${doc.excerpt} ${doc.section} ${doc.body}`.toLowerCase().includes(term)));
  }, [documents, query, section]);
  function setQuery(value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
    // Preserve searches when returning from a document without a history entry per keystroke.
    window.history.replaceState(null, "", url);
  }
  function clearFilters() {
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.delete("section");
    window.history.pushState(null, "", url);
  }
  function chooseSection(value: string) {
    if (value === section) return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("section", value); else url.searchParams.delete("section");
    // Next subscribes to native history updates; each selection is reversible with Back.
    window.history.pushState(null, "", url);
  }
  return <section aria-label="Search documents">
    <div className="library-controls"><div className="search-field"><label htmlFor="document-search">Search documents</label><div className="input-wrap"><span aria-hidden="true">⌕</span><input id="document-search" type="search" placeholder="Search…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="filter-field"><label htmlFor="section-filter">Section</label><select id="section-filter" value={section} onChange={(event) => chooseSection(event.target.value)}><option value="">All sections</option>{options.map((name) => <option key={name} value={name}>{name}</option>)}</select></div></div>
    <div className="results-heading"><p role="status" aria-live="polite"><strong>{results.length}</strong> {results.length === 1 ? "document" : "documents"}{section ? ` in ${section}` : ""}</p>{(query || section) && <button className="reset-button" onClick={clearFilters}>Clear filters <span aria-hidden="true">×</span></button>}</div>
    <div className="document-list">{results.map((doc) => <Link href={doc.href} className="document-card" key={doc.slug}><div className="document-card-body"><span className="document-section">{doc.section}</span><h2>{doc.title}</h2></div></Link>)}</div>
    {!results.length && <div className="empty-state"><span className="empty-symbol" aria-hidden="true">⌕</span><h2>{documents.length ? "No documents found." : "No documents yet."}</h2><p>{documents.length ? "Try another search or section." : ""}</p>{(query || section) && <button className="button button-primary" onClick={clearFilters}>Show all documents</button>}</div>}
  </section>;
}
