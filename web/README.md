# Hobbes public knowledge site

A static Next.js documentation portal backed by this repository's Markdown files. No database, login, or API keys are required.

## Local development

Install Node.js 22, then run these commands from `web/`:

```sh
npm ci
npm run dev
```

Validation:

```sh
npm test
npm run build
npm run typecheck
```

Browser regression tests require Python 3 and Playwright Chromium. After building:

```sh
npx playwright install chromium
npm run test:e2e
```

The test runner starts and stops a local static server automatically and checks desktop and mobile layouts, search, filtering, history, heading anchors, and Mermaid rendering. Screenshots are saved under the ignored `test-results/` directory.

`npm run build` generates a static site in `web/out/`. To preview the export, run `python3 -m http.server 3000 --directory out` from `web/` and visit http://localhost:3000. `next start` is not supported for static exports.

## Deploy to Vercel

1. Push the website files and `package-lock.json` to GitHub.
2. In Vercel, choose **Add New → Project** and import `Gavin-is-trying/Hobbes_`.
3. Choose **Next.js** and set **Root Directory** to `web`.
4. Enable **Include source files outside of the Root Directory in the Build Step**. The original documents live one level above `web/`.
5. Use Node.js **22.x**, install command `npm ci`, build command `npm run build`, and output directory `out` (the last two are configured in `vercel.json`).
6. Deploy. No environment variables are needed; do **not** copy `HOBBES_API_KEY` into this project.
7. Under project Git settings, use `main` as the production branch. New pushes deploy automatically; pull requests receive previews. Ensure builds are not skipped for changes to the source documents outside `web/`.

Vercel account access and the actual deployment are separate from scaffolding the code. Add a custom domain later under **Settings → Domains**.

## Publishing content

The build publishes all non-hidden `.md` files recursively inside:

- `TLC-OS/`
- `External Customers/`
- `Internal Customers/`
- `Agents/`

It also publishes the root `PROCESS-DOCUMENTATION-GUIDE.md`. These sources are explicitly allowlisted in `lib/content.ts`; app files, dotfiles, symlinks, and `.gitkeep` placeholders are excluded. Existing documents are not copied or modified.

**Everything in this allowlist is public**, including intake transcripts, decisions, templates, and documents in `Internal Customers`. Search also sends these documents to the browser. Review content before merging; neither an obscure URL nor a hidden navigation link makes it private.

Add or edit Markdown and redeploy to update the site. URLs derive from the full source path, so moving or renaming a document changes its URL. Duplicate normalized URLs fail the build rather than silently overwriting pages. Empty lifecycle stages are displayed as "No documents yet".

GFM tables, lists, task lists, code blocks, and heading anchors are supported. YAML frontmatter and raw HTML are not rendered. Relative document links route to the corresponding website page; other repository references link to GitHub. Images are displayed as text references rather than loading remote tracking URLs. Supported Mermaid diagrams are rendered locally with a visible source fallback; unsupported syntax remains readable as source.

## Project structure

- `app/`: home, library, document pages, and shared styles
- `components/`: navigation, browser-side search, and diagram rendering
- `lib/content.ts`: allowlisted build-time document discovery and links
- `lib/content.test.ts`: document discovery and routing regression tests

The existing owner-only OpenCode GitHub workflow is independent of this website and is left unchanged.
