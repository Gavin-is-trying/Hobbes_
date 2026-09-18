# everything-is-computer

Machine-facing material lives here; human-facing process evidence, decisions, and
SOPs stay in the root customer/TLC-OS folders. This folder was initially named
`EIC` during the move; the live workspace rename back to this name was preserved.

- [AGENTS.md](AGENTS.md): shared agent instructions.
- `skills/`: canonical process and complexity-review skills; edit these, not copies.
- [web/README.md](web/README.md): website development, tests, publication, and deployment.
- `tools/`: ignored local Node/browser/cache downloads, not required repository dependencies.
- [workflows/opencode.yml](workflows/opencode.yml): canonical OpenCode workflow definition, mirrored to the active root GitHub Actions location.
- [Process Documentation Guide](../TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md): shared process-document rules under `TLC-OS/`.

Explicitly load `everything-is-computer/AGENTS.md` and the relevant canonical
skill when starting an agent task; root discovery pointers are not provided.
GitHub discovers active workflows only in root `.github/workflows/`. The canonical
definition in `everything-is-computer/workflows/opencode.yml` is mirrored to
`.github/workflows/opencode.yml`, where GitHub Actions runs it.
This folder is excluded from website document discovery, not a secret store.

## Maintenance path

1. Edit the canonical source and affected links. Use only the requested skill/phase;
   do not regenerate a full process package for an editorial correction.
2. Check document links/evidence or run the existing website validation gate, as
   appropriate. Follow [web/README.md](web/README.md), not a second set of commands.
3. Review the diff and obtain required human approval before publishing or treating
   a proposed process as approved. If a cut loses necessary behavior, restore the
   smallest missing control and append a superseding decision below.

## Consolidation decisions — 2026-09-14

Scope: the repository owner's requested agent/document/workflow cleanup and website
relocation. Outcome: one maintenance location without changing public document
URLs, losing source evidence, or weakening execution/security controls. This is an
implementation record, not approval of any business SOP. Repository owner remains
the decision authority; hosted deployment and live skill discovery need verification.

Current state: root instructions → discovery stubs → three process skills → overlapping
orchestration/references/templates; website and local tooling in separate root trees.
Future state: root pointers → canonical skills here → only needed evidence/templates;
website and tooling alongside them. No additional handoff or automation service.

| Algorithm step | Decision and evidence | Validation / add-back condition |
|---|---|---|
| 1. Challenge | RETAIN public allowlist, stable content paths, raw evidence/history, human approval, tests, and owner-only workflow controls: each protects a documented consumer or boundary. RETAIN root discovery entry points because runners/GitHub use conventional locations. | Content/link tests, preserved source files, link checks; verify discovery in each runner and hosted settings before deployment. |
| 2. Delete | COMBINE repeated orchestration, requirement guidance, readiness scoring, and mapping references into specialized skill entry points. DELETE redundant numeric scores, examples, and generic mapping scaffold. DELETE unused website styles after checking all TSX consumers. | Three process skills: 14 → 6 files, 987 → 303 lines. Stylesheet: 1,469 → 933 lines. Restore only demonstrated missing guidance or styles, not a deletion quota. |
| 3. Simplify | One shared guide owns folder/evidence/status/privacy rules. Three distinct process skills retain redesign, mapping-only, and executable-document boundaries. Keep three purposeful intake/review/decision templates. Move web and local tools here; remove unused section descriptions. | Local links and safety/scope review pass; content URLs and rendering remain covered by existing tests. |
| 4. Accelerate | Remove eight reference/template files and repeated reading paths; use existing tests and local Node/browser tools. No new review meetings, scores, or mandatory artifacts. | File/line changes are measured above; elapsed-time or token savings were not measured. Review at the next real process task for missing context or extra navigation. |
| 5. Automate last | RETAIN the single owner-triggered OpenCode workflow unchanged, including secret checks, timeout, non-persisted checkout credentials, and disabled sharing. REJECT a new plugin, copied platform adapters, hooks, sync scripts, and extra CI pipelines without demonstrated need. | Workflow diff unchanged. Owner can stop/disable Actions and use the local agent if automation fails; actual hosted execution was not tested. |

Ponytail's simplicity ladder, whole-repo audit, and diff-review skills were read
from a pinned revision and used in this cleanup. [Source links and the existing
review procedure](skills/complexity-review/SKILL.md#ponytail-sources) avoid vendoring
an overlapping plugin. No runtime dependency was added or removed.

Validation: five content tests, production build, TypeScript check, and six
Playwright desktop/mobile tests passed. Local documentation links and retained
safety rules were reviewed. Historical customer intake and decision/SOP/review
files were not rewritten; their old invocation text is evidence, not current setup.

### Superseding decision — 2026-09-14

At the repository owner's request, remove root `AGENTS.md` and `.agents/skills/`,
superseding the earlier decision to retain agent discovery pointers. Keep this
folder's `AGENTS.md` and all canonical skills. Explicit loading replaces root
discovery; automatic loading in Zed/OpenCode is not assumed. The root GitHub
workflow remains unchanged.

### Path relocation follow-up — 2026-09-14

The owner moved the process guide to `TLC-OS/PROCESS-DOCUMENTATION-GUIDE.md`
and retained the canonical workflow definition at
`everything-is-computer/workflows/opencode.yml`. It is mirrored to
`.github/workflows/opencode.yml` so GitHub Actions can run it. Guide links use
the new source path, while the website retains `/docs/process-documentation-guide`
for existing links. Empty lifecycle workspaces are now created on demand, not
pre-scaffolded.

## Deployment and remaining checks

- Set the existing Vercel project's **Root Directory** to `everything-is-computer/web`.
  Keep outside-root source inclusion enabled and ensure root content edits trigger builds.
  Public routes have no new prefix. No hosted deployment was performed.
- In new Zed/OpenCode sessions, explicitly load this folder's `AGENTS.md` and the
  relevant canonical skill. Verify they are in context before relying on them.
- The pre-existing root `.gitignore` deletion was preserved. This folder's
  `.gitignore` excludes local tools, web dependencies/build/test artifacts, Vercel
  state, and `.env*`; it does not protect secrets elsewhere in the repository.
  Review the root ignore-policy change before staging; never blanket-add secrets.
- Review this consolidation on the next actual process task and before deployment;
  append a dated correction if evidence requires restoring a removed element.
