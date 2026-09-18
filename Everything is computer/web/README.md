# Hobbes public knowledge site

A Next.js documentation portal backed by this repository's Markdown files, plus a small Postgres-backed database for the Clients intake form. Markdown pages stay statically generated at build time; only the Clients API runs on the server. No login or API keys are required, but the Clients form needs a `DATABASE_URL`.

## Local development

Install Node.js 22, then run these commands from `Everything is computer/web/`:

```sh
npm ci
cp .env.example .env.local   # set DATABASE_URL to a Postgres connection string
npm run dev
```

Any Postgres database works. The `clients` table is created automatically on the first request, so no migration step is required. Without `DATABASE_URL`, the document site still runs and the Clients page reports that the database is unavailable.

Validation:

```sh
npm test
npm run build
npm run typecheck
```

Browser regression tests require Playwright Chromium. After installing the browser:

```sh
npx playwright install chromium
npm run test:e2e
```

The test runner starts and stops a local Next.js development server automatically and checks desktop and mobile layouts, search, filtering, history, heading anchors, Mermaid rendering, and the Clients form. The Clients test intercepts the API so it does not need a database. Screenshots are saved under the ignored `test-results/` directory.

`npm run build` generates a normal Next.js server build in `Everything is computer/web/.next/`. Start it with `npm run start` and visit http://localhost:3000 (the document pages are still pre-rendered; only the Clients API is dynamic).

## Deploy to Vercel

1. Push the website files and `package-lock.json` to GitHub.
2. In Vercel, choose **Add New → Project** and import `Gavin-is-trying/Hobbes_`.
3. Choose **Next.js** and set **Root Directory** to `Everything is computer/web`. Update this setting on the existing Vercel project before deploying the relocation.
4. Enable **Include source files outside of the Root Directory in the Build Step**. The original documents live two levels above `Everything is computer/web/`.
5. Use Node.js **22.x**, install command `npm ci`, and build command `npm run build`. Leave **Output Directory** at the Next.js default; do not set a static `out` directory. `vercel.json` declares the Next.js framework so Vercel deploys the server build and the `/api/clients` routes. The document pages remain pre-rendered at build time.
6. Add a Postgres database (for example Neon, Supabase, or any hosted Postgres) and set the `DATABASE_URL` environment variable for Production and Preview. The `clients` table is created automatically on first use. Do **not** copy `HOBBES_API_KEY` into this project, and do not commit the connection string.
7. Under project Git settings, use `main` as the production branch. New pushes deploy automatically; pull requests receive previews. Ensure builds are not skipped for changes to the source documents outside `Everything is computer/web/`.
8. Deploy. The Clients page now stores customer records in that database only; the repository and published Markdown stay free of customer data. Vercel account access, the database, and the actual deployment are separate from scaffolding the code. Add a custom domain later under **Settings → Domains**.

## Publishing content

The build publishes all non-hidden `.md` files recursively inside:

- `TLC-OS/`
- `External Customers/`
- `Internal Customers/`

The guide lives at `TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md` and is published through the `TLC-OS/` scan. These sources are explicitly allowlisted in `lib/content.ts`; the entire `Everything is computer/` tree (including skills), dotfiles, symlinks, and `.gitkeep` placeholders are excluded. Existing documents are not copied or modified.

**Everything in this allowlist is public**, including intake transcripts, decisions, templates, and documents in `Internal Customers`. Search also sends these documents to the browser. Review content before merging; neither an obscure URL nor a hidden navigation link makes it private.

Add or edit Markdown and redeploy to update the site. URLs derive from the full source path, so moving or renaming a document changes its URL. The explicit legacy exception in `lib/content.ts` is `TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md`, which preserves `/docs/process-documentation-guide`. Duplicate normalized URLs fail the build rather than silently overwriting pages. Empty sections remain selectable and show "No documents found." in search; lifecycle stage directories are discovered but not rendered as separate navigation, except the `Clients` category under `TLC-OS`, which links to the `/clients` intake form.

GFM tables, lists, task lists, code blocks, and heading anchors are supported. YAML frontmatter and raw HTML are not rendered. Relative document links route to the corresponding website page; other repository references link to GitHub. Images are displayed as text references rather than loading remote tracking URLs. Supported Mermaid diagrams are rendered locally with a visible source fallback; unsupported syntax remains readable as source.

## Brand styling

`app/globals.css` uses lawn green `#0E5B2D` and forest green `#153619`, sampled from the JPEGs in the repository's `TLC-OS/04 Brand Assets/` (JPEG compression introduces minor variations). White and pale-green supporting surfaces retain readable contrast. Display text uses an Optima/Candara/Trebuchet MS system-font stack to approximate the upright, flared wordmark; it is not an exact font identification and varies by platform. Body text stays in Arial/Helvetica for long-document readability. No remote fonts are loaded.

## Clients database

The `/clients` page is the only server-backed feature. It reads and writes a `clients` table in the Postgres database named by `DATABASE_URL`. The table is created automatically on the first request:

```sql
CREATE TABLE IF NOT EXISTS clients (
  id serial PRIMARY KEY,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Routes: `GET /api/clients/` lists records, `POST /api/clients/` validates and inserts one, and `DELETE /api/clients/:id/` removes one. Input is trimmed and length-limited by `lib/clients.ts`; invalid input returns `400`. Customer records live only in the database: never commit real names, phone numbers, email addresses, or street addresses to this repository, and never copy connection strings into source.

## Project structure

- `app/`: home, library, intake, clients, document pages, and shared styles
- `app/api/clients/`: the Clients list/create/delete route handlers
- `components/`: navigation, browser-side search, the Clients form, and diagram rendering
- `lib/content.ts`: allowlisted build-time document discovery and links
- `lib/clients.ts`: shared client types, validation, and last-name sort
- `lib/db.ts`: Postgres pool, automatic schema, and client queries
- `lib/*.test.ts`: document discovery, routing, and client validation regression tests

The owner-only OpenCode workflow's canonical definition is at `Everything is computer/workflows/opencode.yml` and is mirrored to `.github/workflows/opencode.yml`, where GitHub Actions runs it. It is independent of this website.
