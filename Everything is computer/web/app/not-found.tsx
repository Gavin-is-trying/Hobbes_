import Link from "next/link";

export default function NotFound() {
  return <div className="page not-found"><h1>Page not found</h1><Link href="/library" className="button button-primary">Search documents</Link></div>;
}
