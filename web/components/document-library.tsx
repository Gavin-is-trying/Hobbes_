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
    <div className="library-controls"><div className="search-field"><label htmlFor="document-search">Search the knowledge base</label><div className="input-wrap"><span aria-hidden="true">⌕</span><input id="document-search" type="search" placeholder="Search titles, topics, or a phrase…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="filter-field"><label htmlFor="section-filter">Knowledge space</label><select id="section-filter" value={section} onChange={(event) => chooseSection(event.target.value)}><option value="">All spaces</option>{options.map((name) => <option key={name} value={name}>{name}</option>)}</select></div></div>
    <div className="results-heading"><p role="status" aria-live="polite"><strong>{results.length}</strong> {results.length === 1 ? "document" : "documents"}{section ? ` in ${section}` : " in the collection"}</p>{(query || section) && <button className="reset-button" onClick={clearFilters}>Clear filters <span aria-hidden="true">×</span></button>}</div>
    <div className="document-list">{results.map((doc) => <Link href={doc.href} className="document-card" key={doc.slug}><span className="document-icon" aria-hidden="true">▤</span><div className="document-card-body"><span className="document-section">{doc.section}</span><h2>{doc.title}</h2><p>{doc.excerpt || "Open this document to read more."}</p></div><span className="document-open" aria-hidden="true">↗</span></Link>)}</div>
    {!results.length && <div className="empty-state"><span className="empty-symbol" aria-hidden="true">⌕</span><h2>{documents.length ? "No documents found." : "The collection is taking shape."}</h2><p>{documents.length ? "Try a different search or choose another knowledge space." : "Documents will appear here when they are added to the knowledge base."}</p>{(query || section) && <button className="button button-primary" onClick={clearFilters}>Show all documents</button>}</div>}
  </section>;
}
