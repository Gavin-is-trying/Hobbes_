import type { Metadata } from "next";
import { Suspense } from "react";
import { docHref, getDocuments, getSections } from "../../lib/content";
import { DocumentLibrary } from "../../components/document-library";

export const metadata: Metadata = { title: "Document library", description: "Search Hobbes operational knowledge, principles, and processes." };

export default function LibraryPage() {
  const documents = getDocuments().map((doc) => ({ ...doc, href: docHref(doc) }));
  return <div className="page"><div className="page-heading"><p className="eyebrow">KNOWLEDGE, WITHIN REACH</p><h1>Document library<span className="orange">.</span></h1><p>Find the context you need. Put it into practice.</p></div><Suspense fallback={<p role="status">Loading the document library…</p>}><DocumentLibrary documents={documents} sections={getSections().map((section) => section.name)} /></Suspense></div>;
}
