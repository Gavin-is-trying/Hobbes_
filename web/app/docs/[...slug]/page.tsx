import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeSlug from "rehype-slug";
import { MermaidDiagram } from "../../../components/mermaid-diagram";
import { getDocuments, resolveDocLink } from "../../../lib/content";

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return getDocuments().map((doc) => ({ slug: doc.slug.split("/") }));
}

async function findDocument(params: Props["params"]) {
  const { slug } = await params;
  return getDocuments().find((doc) => doc.slug === slug.join("/"));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await findDocument(params);
  return { title: doc?.title || "Document not found", description: doc?.excerpt };
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const className = isValidElement<{ className?: string }>(children) ? children.props.className : "";
  const language = /language-([^\s]+)/.exec(className || "")?.[1] || "text";
  if (language === "mermaid" && isValidElement<{ children?: ReactNode }>(children) && typeof children.props.children === "string") {
    return <MermaidDiagram source={children.props.children} />;
  }
  return <figure className="code-block"><figcaption>{language === "mermaid" ? "mermaid · diagram source" : language}</figcaption><pre tabIndex={0} aria-label={`${language} code`}>{children}</pre></figure>;
}

export default async function DocumentPage({ params }: Props) {
  const doc = await findDocument(params);
  if (!doc) notFound();
  const source = `https://github.com/Gavin-is-trying/Hobbes_/blob/HEAD/${doc.path.split("/").map(encodeURIComponent).join("/")}`;
  const minutes = Math.max(1, Math.ceil(doc.body.trim().split(/\s+/).length / 220));
  return <div className="page document-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/library">Library</Link><span aria-hidden="true">/</span><Link href={`/library?section=${encodeURIComponent(doc.section)}`}>{doc.section}</Link></nav><header className="document-header"><p className="eyebrow">{doc.section}</p><h1>{doc.title}</h1><div className="document-meta"><span>{minutes} min read</span><span aria-hidden="true">·</span><span>Operational knowledge</span><a href={source} target="_blank" rel="noopener noreferrer">View source on GitHub <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></div></header><article className="prose"><ReactMarkdown remarkPlugins={[remarkGfm, remarkFrontmatter]} rehypePlugins={[rehypeSlug]} skipHtml components={{
    a: ({ href, children, title }) => <a title={title} href={href?.startsWith("#") ? href : href ? resolveDocLink(doc, href) : undefined}>{children}</a>,
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    table: ({ children }) => <div className="table-scroll" role="region" aria-label="Document table" tabIndex={0}><table>{children}</table></div>,
    img: ({ alt }) => <span className="image-reference">[Image: {alt || "unlabelled illustration"}]</span>,
  }}>{doc.body}</ReactMarkdown></article><div className="document-end"><span>Knowledge works better when it’s shared.</span><Link className="text-link" href={`/library?section=${encodeURIComponent(doc.section)}`}>More in {doc.section} <span aria-hidden="true">↗</span></Link></div></div>;
}
