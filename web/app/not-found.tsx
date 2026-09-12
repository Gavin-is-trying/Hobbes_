import Link from "next/link";

export default function NotFound() {
  return <div className="page not-found"><p className="eyebrow">404 / A MISSING PAGE, NOT A DEAD END</p><span className="not-found-number" aria-hidden="true">404.</span><h1>Let’s get you back<br />to what matters.</h1><p>This page isn’t in the collection. It may have moved, or the address might not be quite right.</p><div className="hero-actions"><Link href="/library" className="button button-primary">Explore the library <span aria-hidden="true">↗</span></Link><Link href="/" className="text-link">Back to overview</Link></div></div>;
}
