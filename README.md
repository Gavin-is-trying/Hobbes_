# Hobbes

Hobbes is an operational knowledge system for documenting, reviewing, and publishing how the organization works. It combines process evidence and operating documents with a documentation website and a small database for client records.

## What is in this repository?

- `TLC-OS/` — foundational operating context, including the process documentation guide, organization chart, and brand assets.
- `External Customers/` — customer lifecycle workspaces, from leads through production and lifetime value.
- `Internal Customers/` — team-member lifecycle workspaces, from attraction through transitions.
- `Everything is computer/` — machine-facing instructions, canonical agent skills, the web application, and workflow source files.
- `.github/workflows/` — the active GitHub Actions workflow for owner-triggered OpenCode tasks.

Process workspaces use this structure when an artifact exists:

```text
stage/
├── intake/      # raw source evidence
├── reviews/     # analysis and proposed improvements
├── decisions/   # persistent decision history
└── SOPs/        # proposed or approved operating instructions
```

Raw evidence, analysis, decisions, and approved operating instructions are kept distinct. Draft SOPs remain `proposed` until the accountable human owner approves them.

## Documentation website

The website is a Next.js application in [`Everything is computer/web`](Everything%20is%20computer/web/). Document pages are generated at build time and publish only documents under these explicit source directories:

- `TLC-OS/`
- `External Customers/`
- `Internal Customers/`

This allowlist is public by design. Intake transcripts, decisions, templates, and internal-customer documents included in those directories are sent to the browser and searchable on the site. Review content for secrets and unnecessary personal or sensitive information before committing or publishing. An `internal` label does not make a document private.

The application provides:

- document navigation and search;
- Markdown rendering with GitHub-Flavored Markdown features;
- stable document routes derived from repository paths;
- heading anchors and relative document links;
- local Mermaid diagram rendering with a readable source fallback;
- responsive desktop and mobile layouts;
- a `/clients` intake form backed by a hosted Postgres database.

Customer records entered on the Clients page live only in that database. The connection string is supplied through the `DATABASE_URL` environment variable and is never committed. The published `TLC-OS/Clients/` documents define the record format and sort rule only; they contain no real customer data.

See [`Everything is computer/web/README.md`](Everything%20is%20computer/web/README.md) for the complete website and deployment guide.

## Local development

The web application requires Node.js 22.x. From the web directory:

```sh
cd "Everything is computer/web"
npm ci
cp .env.example .env.local   # set DATABASE_URL to a Postgres connection string
npm run dev
```

Open `http://localhost:3000` to use the development site. The document pages render without the database; the Clients form needs `DATABASE_URL`.

Run the validation suite with:

```sh
npm test
npm run build
npm run typecheck
```

Browser tests additionally require Playwright Chromium:

```sh
npx playwright install chromium
npm run test:e2e
```

The production build creates a Next.js server build in `Everything is computer/web/.next/`. Start it with:

```sh
npm run start
```

## Adding process documentation

1. Choose the relevant lifecycle stage.
2. Create only the needed `intake/`, `reviews/`, `decisions/`, or `SOPs/` directory.
3. Preserve raw evidence and label uncertainty rather than presenting assumptions as facts.
4. Remove passwords, API keys, tokens, unnecessary personal data, and other sensitive information before committing.
5. Use the canonical instructions in [`TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md`](TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md) and the relevant skill under [`Everything is computer/skills`](Everything%20is%20computer/skills/).
6. Review the resulting document and its links before merging; the website republishes allowlisted Markdown on the next deployment.

For process design, the repository's standard sequence is to challenge requirements, remove unnecessary work, simplify the flow, consider acceleration, and automate last. Human owners approve operating standards; agents do not approve their own work.

## Deployment

The site is configured for Vercel. Set the project root directory to `Everything is computer/web`, enable inclusion of source files outside that root, use Node.js 22.x, install with `npm ci`, and build with `npm run build`. Set `DATABASE_URL` to a hosted Postgres connection string for the Clients database; no other application environment variables are required. Never commit the connection string or real customer data.

The canonical OpenCode workflow is [`Everything is computer/workflows/opencode.yml`](Everything%20is%20computer/workflows/opencode.yml); the GitHub Actions copy is [`.github/workflows/opencode.yml`](.github/workflows/opencode.yml). It is separate from the website build and is restricted to owner-triggered comments.

## Repository guidance

Read [`Everything is computer/AGENTS.md`](Everything%20is%20computer/AGENTS.md) before making repository changes. It defines scope, document handling, privacy, and validation expectations. Keep canonical documents and skills in their designated locations rather than creating parallel copies.
