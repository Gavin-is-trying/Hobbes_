import Link from "next/link";
import { docHref, getDocuments, getSections } from "../lib/content";

const segmentKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

export default function HomePage() {
  const documents = getDocuments();
  const sections = getSections();
  const guide = documents.find((doc) => /(^|\/)process-documentation-guide\.md$/i.test(doc.path));
  return (
    <div className="page home-page">
      <section className="hero">
        <div className="eyebrow"><span className="status-dot" /> THE WAY WE WORK</div>
        <h1>Good work starts with<br /><em>shared understanding.</em></h1>
        <p className="hero-description">Our principles, processes, and practical know-how. All in one place, so you can spend less time searching and more time moving things forward.</p>
        <div className="hero-actions"><Link className="button button-primary" href="/library">Explore the library <span aria-hidden="true">↗</span></Link><span className="hero-footnote">A reference for the everyday.</span></div>
        <div className="hero-index" aria-hidden="true"><span>H / 01</span><div className="index-lines" /><span>KNOWLEDGE, IN PRACTICE.</span></div>
      </section>
      <div className="stats-strip"><div><strong>{String(documents.length).padStart(2, "0")}</strong><span>Documents to explore</span></div><div><strong>{String(sections.length).padStart(2, "0")}</strong><span>Knowledge spaces</span></div><div className="stats-message"><span className="status-dot" /><span>A living collection.<br /><b>Room to keep growing.</b></span></div></div>
      <section className="spaces-section" aria-labelledby="spaces-title">
        <div className="section-heading"><div><p className="eyebrow">FIND YOUR CONTEXT</p><h2 id="spaces-title">A space for every part of the work.</h2></div><Link className="text-link" href="/library">View all documents <span aria-hidden="true">↗</span></Link></div>
        <div className="space-grid">{sections.map((section, index) => {
          const count = documents.filter((doc) => doc.section === section.name).length;
          return <Link className="space-card" href={`/library?section=${encodeURIComponent(section.name)}`} key={section.name}><div className="card-top"><span className="card-index">{String(index + 1).padStart(2, "0")}</span><span className="card-arrow" aria-hidden="true">↗</span></div><h3>{section.name}</h3><p>{section.description || "Explore the knowledge and practices in this space."}</p><div className="card-bottom"><span>{count} {count === 1 ? "document" : "documents"}</span><span>{count ? "Explore space" : "Taking shape"}</span></div></Link>;
        })}</div>
        {sections.length === 0 && <div className="empty-state"><h3>A fresh starting point.</h3><p>Knowledge spaces will appear here as the collection takes shape.</p></div>}
      </section>
      <section className="guide-banner" aria-labelledby="guide-title"><div className="guide-symbol" aria-hidden="true">↗</div><div><p className="eyebrow">MAKE KNOWLEDGE REPEATABLE</p><h2 id="guide-title">A little structure goes a long way.</h2><p>{guide ? "Turn the way you work into something others can build on. Start with our process documentation guide." : "Explore the collection to see how shared principles and documented processes support the work."}</p></div><Link className="button button-light" href={guide ? docHref(guide) : "/library"}>{guide ? "Read the writing guide" : "Browse the library"}<span aria-hidden="true">↗</span></Link></section>
      {sections.some((section) => section.stages.length > 0) && <section className="stages-section" aria-labelledby="stages-title"><div className="section-heading"><div><p className="eyebrow">THE BIGGER PICTURE</p><h2 id="stages-title">Built one practice at a time.</h2><p className="muted">The structure is here. Stages without documents are marked below.</p></div></div><div className="stage-groups">{sections.filter((section) => section.stages.length > 0).map((section) => <div className="stage-group" key={section.name}><h3>{section.name}</h3><ul>{section.stages.map((stage) => {
        const count = documents.filter((doc) => doc.section === section.name && doc.path.split("/").slice(0, -1).some((part) => segmentKey(part) === segmentKey(stage))).length;
        return <li key={stage}><span>{stage}</span><span className={`stage-status ${count ? "has-docs" : ""}`}>{count ? `${count} ${count === 1 ? "document" : "documents"}` : "No documents yet"}</span></li>;
      })}</ul></div>)}</div></section>}
    </div>
  );
}
