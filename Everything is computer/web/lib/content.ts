import fs from "node:fs";
import path from "node:path";
// Next commands run from Everything is computer/web; public content stays at repository root.
const root = path.resolve(process.cwd(), "../..");
const spaces = [
  { name: "Internal Customers" },
  { name: "External Customers" },
  { name: "TLC-OS" },
];

export type Doc = {
  slug: string;
  title: string;
  section: string;
  path: string;
  body: string;
  excerpt: string;
};

export function slugForPath(source: string): string {
  return source.replace(/\.md$/i, "").split("/").map((segment) =>
    segment.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document"
  ).join("/");
}

function walk(directory: string): string[] {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .flatMap((entry) => {
      if (entry.name.startsWith(".")) return [];
      const relative = `${directory}/${entry.name}`;
      // Symlinks are intentionally excluded: publishing must stay inside the allowlist.
      if (entry.isDirectory()) return walk(relative);
      return entry.isFile() && /\.md$/i.test(entry.name) ? [relative] : [];
    });
}

export function getDocuments(): Doc[] {
  // Only these explicit sources are public. Never crawl the app, secrets, or .git.
  const sources = ["PROCESS-DOCUMENTATION-GUIDE.md", ...spaces.flatMap((s) => walk(s.name))];
  const slugs = new Set<string>();
  return sources.map((source) => {
    const body = fs.readFileSync(path.join(root, source), "utf8");
    const text = body.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
    const heading = /^#{1,2}\s+(.+?)\s*#*\s*$/m.exec(text)?.[1];
    const title = heading || path.basename(source, ".md").replace(/[-_]/g, " ");
    const excerpt = text.replace(/```[\s\S]*?```/g, "")
      .replace(/^#{1,6}\s+.*$/gm, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`>|]/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
    const slug = slugForPath(source);
    if (slugs.has(slug)) throw new Error(`Duplicate document URL: ${slug}. Rename one of the source documents.`);
    slugs.add(slug);
    return { slug, title, section: source.includes("/") ? source.split("/")[0] : "Getting started", path: source, body, excerpt };
  });
}

export function getSections() {
  return spaces.map((space) => ({
    ...space,
    stages: fs.readdirSync(path.join(root, space.name), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name).sort((a, b) => a.localeCompare(b, "en")),
  }));
}

export function docHref(doc: Doc): string {
  return `/docs/${doc.slug}`;
}

export function resolveDocLink(doc: Doc, href: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return href;
  const match = /^([^?#]*)(.*)$/.exec(href)!;
  let target: string;
  try { target = decodeURIComponent(match[1]); } catch { return href; }
  const relative = target.startsWith("/")
    ? path.posix.normalize(target.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(doc.path), target));
  const linked = getDocuments().find((entry) => entry.path === relative);
  if (linked) return docHref(linked) + match[2];
  if (relative === ".." || relative.startsWith("../")) return "#";
  // Non-document references stay navigable on GitHub rather than becoming broken site routes.
  return `https://github.com/Gavin-is-trying/Hobbes_/blob/main/${relative.split("/").map(encodeURIComponent).join("/")}${match[2]}`;
}
