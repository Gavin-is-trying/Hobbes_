# Hobbes public knowledge site

A static Next.js documentation portal backed by this repository's Markdown files. No database, login, or API keys are required.

## Local development

Install Node.js 22, then run these commands from `Everything is computer/web/`:

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

`npm run build` generates a static site in `Everything is computer/web/out/`. To preview the export, run `python3 -m http.server 3000 --directory out` from `Everything is computer/web/` and visit http://localhost:3000. `next start` is not supported for static exports.

## Deploy to Vercel

1. Push the website files and `package-lock.json` to GitHub.
2. In Vercel, choose **Add New → Project** and import `Gavin-is-trying/Hobbes_`.
3. Choose **Next.js** and set **Root Directory** to `Everything is computer/web`. Update this setting on the existing Vercel project before deploying the relocation.
4. Enable **Include source files outside of the Root Directory in the Build Step**. The original documents live two levels above `Everything is computer/web/`.
5. Use Node.js **22.x**, install command `npm ci`, and build command `npm run build`. Leave **Output Directory** at the Next.js default; disable any dashboard override set to `out`. Vercel auto-detects the Next.js framework; `vercel.json` intentionally does not override dashboard framework or build settings. Vercel's Next.js integration reads build metadata from `.next` and handles `output: "export"` automatically. The local static export still lives in `out/`.
6. Deploy. No environment variables are needed; do **not** copy `HOBBES_API_KEY` into this project.
7. Under project Git settings, use `main` as the production branch. New pushes deploy automatically; pull requests receive previews. Ensure builds are not skipped for changes to the source documents outside `Everything is computer/web/`.

Vercel account access and the actual deployment are separate from scaffolding the code. Add a custom domain later under **Settings → Domains**.

## Publishing content

The build publishes all non-hidden `.md` files recursively inside:

- `TLC-OS/`
- `External Customers/`
- `Internal Customers/`

The guide lives at `TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md` and is published through the `TLC-OS/` scan. These sources are explicitly allowlisted in `lib/content.ts`; the entire `Everything is computer/` tree (including skills), dotfiles, symlinks, and `.gitkeep` placeholders are excluded. Existing documents are not copied or modified.

**Everything in this allowlist is public**, including intake transcripts, decisions, templates, and documents in `Internal Customers`. Search also sends these documents to the browser. Review content before merging; neither an obscure URL nor a hidden navigation link makes it private.

Add or edit Markdown and redeploy to update the site. URLs derive from the full source path, so moving or renaming a document changes its URL. The explicit legacy exception in `lib/content.ts` is `TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md`, which preserves `/docs/process-documentation-guide`. Duplicate normalized URLs fail the build rather than silently overwriting pages. Empty sections remain selectable and show "No documents found." in search; lifecycle stage directories are discovered but not rendered as separate navigation.

GFM tables, lists, task lists, code blocks, and heading anchors are supported. YAML frontmatter and raw HTML are not rendered. Relative document links route to the corresponding website page; other repository references link to GitHub. Images are displayed as text references rather than loading remote tracking URLs. Supported Mermaid diagrams are rendered locally with a visible source fallback; unsupported syntax remains readable as source.

## Brand styling

`app/globals.css` uses lawn green `#0E5B2D` and forest green `#153619`, sampled from the JPEGs in the repository's `TLC-OS/04 Brand Assets/` (JPEG compression introduces minor variations). White and pale-green supporting surfaces retain readable contrast. Display text uses an Optima/Candara/Trebuchet MS system-font stack to approximate the upright, flared wordmark; it is not an exact font identification and varies by platform. Body text stays in Arial/Helvetica for long-document readability. No remote fonts are loaded.

## Project structure

- `app/`: home, library, document pages, and shared styles
- `components/`: navigation, browser-side search, and diagram rendering
- `lib/content.ts`: allowlisted build-time document discovery and links
- `lib/content.test.ts`: document discovery and routing regression tests

The owner-only OpenCode workflow's canonical definition is at `Everything is computer/workflows/opencode.yml` and is mirrored to `.github/workflows/opencode.yml`, where GitHub Actions runs it. It is independent of this website.
