import Link from "next/link";
import { docHref, getDocuments, getSections } from "../lib/content";

export default function HomePage() {
  const documents = getDocuments();
  const guide = documents.find((doc) => doc.path === "PROCESS-DOCUMENTATION-GUIDE.md");

  return (
    <div className="page home-page">
      <header className="page-heading">
        <h1>Documents</h1>
        <Link className="button button-primary" href="/library">Search documents</Link>
      </header>
      <section className="space-grid" aria-label="Sections">
        {getSections().map((section) => {
          const count = documents.filter((doc) => doc.section === section.name).length;
          return (
            <Link className="space-card" href={`/library?section=${encodeURIComponent(section.name)}`} key={section.name}>
              <h2>{section.name}</h2>
              <div className="card-bottom"><span>{count} {count === 1 ? "document" : "documents"}</span></div>
            </Link>
          );
        })}
      </section>
      {guide && <div className="document-end"><Link className="text-link" href={docHref(guide)}>Process documentation guide</Link></div>}
    </div>
  );
}
