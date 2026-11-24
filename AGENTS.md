<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

GitHub Issues in `dusicodes/nexo`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Navigation

- Architecture change: update `architecture.md` in the same change, following its section 2 rules (status markers, change log).
- Review: `CODING_STANDARDS.md` holds the judgement rules; `npm run check` holds the mechanical ones.
- Dev server: `npm run dev` migrates, then starts pglite-server (sole owner of `.data/nexo`) running `next dev` on `http://localhost:3000`. It is often already running; check the port before starting another. Its log is `.next/dev/logs/next-development.log`. Never open `.data/nexo` from a second process while it runs (no `db:migrate`, no plain `next dev`).
- Signed-in checks: with the dev server running, `curl -c jar -L "http://localhost:3000/api/dev/session?callbackURL=/"` signs in as the first allowlisted email (development only; see `src/app/api/dev/session/route.ts`).
