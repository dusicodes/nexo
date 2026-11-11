# nexo - Architecture

> **Document status:** initial comprehensive draft, updated as the foundation lands. The
> repository now holds product documentation (`PRD.md`, `README.md`) plus the first
> foundation slice: the application scaffold, the local data layer, the auth
> configuration, and the AI/MCP seams. No product features exist yet. Status markers are
> the contract: treat no `selected`/`proposed`/`deferred` item as a claim that working
> code exists.

## 1. Purpose and audience

This document is the durable technical reference for nexo: what the system is built from,
where its boundaries are, and how its architecture evolves. It is the entry point for
implementation, design, and review work, for humans and AI agents alike.

- **Owns structure.** How nexo is built: modules, data ownership, seams, security model.
- **Does not own product scope.** What nexo does and why lives in `PRD.md`. This document
  references it; it does not restate or extend it. If the two conflict, the PRD wins on
  product scope and this document wins on technical structure, and the discrepancy is
  fixed in the PR that notices it.
- **Carries decisions.** Selected directions, open questions, and risks are recorded here
  so future work starts from a shared picture instead of re-deriving it.
- **Initial direction** synthesizes `PRD.md` and the project's technical research. This
  document keeps the distilled decisions, not the raw exploration.

## 2. Status vocabulary and update rules

Every claim in this document carries one of four markers. Use them in code review as
strictly as types.

| Marker | Meaning | Evidence bar |
| --- | --- | --- |
| `implemented` | Exists in the codebase today. | Verifiable in the repository. |
| `selected` | Decided architecture direction; may be unbuilt. | A decision exists (PRD, issue, or this document). |
| `proposed` | Option under consideration; may still change. | Under discussion; no decision recorded. |
| `deferred` | Deliberately out of scope for now. | Re-evaluate at the checkpoint named where it appears. |

Rules:

1. Never mark unimplemented work as `implemented`. A `selected` item is a decision, not
   proof of existence.
2. A PR that implements a `selected` item updates its marker to `implemented` in the same PR.
3. A PR that changes the architecture updates this document in the same PR. Such a PR is
   incomplete without the update.
4. Sections with no implemented content say so plainly, as the status note above does.

## 3. Product and system context

nexo is a calm, local-first, AI-assisted workspace for a single person: notes, tasks,
calendar, email, reading, and code in one quiet place, plus an assistant that turns the
day's inputs into a plan. One user, one data set, no sharing or team machinery. Source of
truth: `PRD.md`.

**v1 direction (selected):** the daily planning loop with GitHub and reading inputs. The
assistant plans the day from the todo list and produces a daily summary; a git dashboard
surfaces unfinished PRs, reviews waiting on the user, and "what to build next"; a reading
list captures and organizes saved articles. Everything else in the PRD is deferred beyond
v1. Nothing in this paragraph is implemented; it is the selected direction for v1.

## 4. Architectural principles

These principles gate every design decision. When a proposal conflicts with one, the
proposal must change or the principle must be deliberately revisited.

1. **Local-first.** User data lives on the user's machine and is the system of record
   wherever possible. Local features work without a network; providers are sources and
   sinks, never the system of record.
2. **Privacy by default.** User content leaves the device only through an explicit,
   user-initiated call to a specific provider. No content telemetry, no engagement
   analytics on user data.
3. **Calm, modern, minimal UI.** Quiet by design, no engagement dark patterns. The
   interface presents a plan, not a feed of interruptions.
4. **Web-first with a Tauri 2 desktop path.** The Next.js web app is the primary surface
   and must run standalone in a browser. Tauri 2 wraps it as a thin desktop shell.
   Capabilities must have a web fallback or a clearly marked desktop-only path.
5. **Provider-neutral AI.** Model choice sits behind an adapter boundary. DeepSeek is the
   selected first provider, not a lock-in; application code must not depend on one
   vendor's quirks.
6. **Explicit confirmation for consequential actions.** Anything that changes external
   state (sends email, creates calendar events, writes to a connected account) requires
   explicit per-action user confirmation. Integrations are read-only by default.

## 5. System context and boundaries

```
+-------------------------------------------------------------------+
|  nexo web app (Next.js 16, React 19, TypeScript)                  |
|  runs in: browser (web app)  or  Tauri 2 webview (desktop app)    |
|  +--------------+  +-------------------+  +---------------------+  |
|  | UI layer     |  | agent layer       |  | data layer          |  |
|  | calm UI      |  | AI SDK + MCP      |  | repositories over   |  |
|  |              |  | tool registry     |  | Drizzle schema      |  |
|  +--------------+  +-------------------+  +---------------------+  |
+----------|-------------------|--------------------|----------------+
           |                   |                    |
  +--------+---------+  +------+--------+  +--------+------------------+
  | Tauri 2 shell    |  | Next.js server|  | local DB                    |
  | desktop only:    |  | routes: OAuth,|  | PGlite (browser, WASM)      |
  | window, tray,    |  | provider      |  | SQLite (desktop, via shell) |
  | notifications,   |  | proxies, AI   |  +-----------------------------+
  | keychain, SQLite |  | provider calls|          |
  +--------+---------+  +------+--------+          | (server data path:
           |                   |                   |  optional Postgres)
  +--------+-------------------+-------------------+
  | external providers: GitHub, DeepSeek, Google OAuth;   |
  | future: email, calendar/CalDAV/Notion, feeds, finance |
  +-------------------------------------------------------+
```

Boundary rules:

- The browser/desktop client never holds provider secrets or OAuth client secrets.
- Secret-backed calls go through Next.js server routes; the server is the only place
  secrets live (desktop keychain tokens are the one exception, see section 9).
- The local database is the system of record for user content; provider data is cached
  into it, never the reverse.
- The Tauri shell duplicates no application logic. It exposes native capabilities
  (windowing, tray, notifications, keychain, local persistence) through a narrow bridge.
- Web and desktop share one codebase. Desktop-specific code lives behind a capability
  seam, and the web app must build and run without the desktop shell.

## 6. Storage and data architecture

| Aspect | Direction | Status |
| --- | --- | --- |
| Schema source of truth | Drizzle ORM; migrations generated and committed from it | `implemented` |
| Browser persistence | PGlite (Postgres in WASM) | `selected` |
| Desktop persistence | SQLite managed by the Tauri shell, exposed to the app | `selected` |
| Server data path | Same Drizzle schema against a real Postgres (self-hosted single-user deployment or future sync hub). Connection path implemented; not yet exercised against a live server | `implemented` |
| Schema portability | Keep SQL within Drizzle's portable subset so one schema serves all three backends. The committed schema already stays within the subset | `implemented` |
| Multi-device sync | None; seam reserved. Options: self-hosted Postgres hub, E2EE sync service, file-based snapshot sync | `deferred` (revisit after v1) |

- **Data ownership:** each module writes its entities only through repositories. The UI
  and the AI tool layer mutate data through the same repositories; no ad-hoc SQL anywhere.
- **Sync-ready by construction:** because every read and write passes through
  repositories, a future sync layer can be introduced without touching UI or agent code.
  Until then, nexo is explicitly single-machine; the architecture does not pretend
  otherwise.

## 7. Frontend and backend module boundaries

**Frontend owns:** UI state (views, filters, open items), interaction, and ephemeral
session state; PGlite persistence in the browser.

**Backend (Next.js server) owns:** OAuth flows and session validation (Better Auth);
provider adapters that need secrets (GitHub, DeepSeek, future email/calendar); shaping
provider data before it is cached into the local database.

**Provider access modes:**

- *Server-mediated* (`selected`): provider tokens held server-side; used by the web app
  and the desktop app when signed in. Consequence: GitHub and AI features require the
  server; local-only features work without it.
- *Desktop-local* (`proposed`): the Tauri shell holds user-scoped provider tokens in the
  OS keychain and proxies provider calls, letting the desktop app run with no server.
  Not selected yet; both modes share the same provider adapter interfaces.

**Testing seams** (deliberate places where fakes substitute for real systems):

- Repository interface: in-memory fake for unit tests; no real database, no network.
- Provider adapters: fake providers return fixtures and record calls; CI never touches
  real providers.
- Agent layer: mocked model responses and recorded tool invocations; the tool permission
  policy is tested without any model in the loop.
- UI: component tests; E2E for the core loop (triage inputs -> proposed plan -> confirmed
  day) in a browser. The Tauri shell gets focused integration tests at the capability seam.

## 8. AI architecture

> **Status:** This section describes selected and proposed design. The AI SDK seams are
> implemented: the DeepSeek provider adapter, a single-step assistant hook, the MCP
> client, and the MCP-to-AI-tools bridge (all verified with mocks). The tool registry,
> permission enforcement, and any product agent are not.

| Aspect | Direction | Status |
| --- | --- | --- |
| Orchestration | Vercel AI SDK for chat, streaming, and tool calling | `implemented` |
| Tool protocol | MCP exposes assistant tools; tools wrap repositories and provider adapters, so the assistant mutates only through the same data paths as the UI | `selected` |
| Provider | DeepSeek API, called server-side; the key never reaches the client | `implemented` |
| Provider neutrality | Application code depends on the AI SDK abstraction only; provider choice is configuration | `implemented` |
| Local models | Run on-device models through a compatible provider path (e.g. Ollama or similar runtimes) | `proposed` |

**Tool permission classes and the confirmation boundary:**

- **Class R (read):** read local data or read-only provider views (GitHub status, calendar
  events). Runs without per-action confirmation within the current session.
- **Class L (local mutation):** create/update/delete local data (tasks, notes, reading
  list). Runs with lightweight confirmation or an undo affordance; the exact UX is `proposed`.
- **Class W (external write):** anything that changes an external account (send email,
  create a calendar event, comment on or merge a PR). Requires explicit per-action
  confirmation rendered by the UI, and is disabled by default until the user enables the
  integration's write scope.

**Enforcement:** the tool registry enforces these classes mechanically. Prompts are not
the enforcement layer: model output is untrusted input, and no prompt can elevate a tool
beyond its class. The assistant proposes; the UI renders the proposal with per-action
approve/reject; nothing in class W executes without approval. This proposal-then-confirm
pattern is the same one the daily planning loop uses.

## 9. Authentication and security

> **Status:** This section describes selected and proposed security design. Better Auth is
> configured with the Drizzle adapter and its tables are migrated (no sign-in flow or
> OAuth route yet); the local database exists; provider secret handling and the desktop
> keychain remain to be built.

| Aspect | Direction | Status |
| --- | --- | --- |
| Auth | Better Auth with Google OAuth for server capabilities and provider integrations (instance configured and auth tables migrated; OAuth flow and route pending) | `selected` |
| Auth scope | The local-first core (tasks, notes, reading) works without signing in; auth is only for server-mediated capabilities | `selected` |
| Sessions | Managed by Better Auth with httpOnly cookies; the client never sees OAuth tokens | `selected` |
| Secrets | Provider API keys and OAuth client secrets live only in server environment variables, never in client bundles or the desktop binary; the server proxies all secret-backed calls | `selected` |
| Desktop tokens | User-scoped provider tokens in the OS keychain, held by the shell; never written to app data or localStorage | `proposed` |

**OAuth redirect boundaries:** the flow runs entirely through Next.js server routes.
Callback URLs are an allow-list of the app's own origins only: the web app origin and the
Tauri custom protocol origin for the desktop shell. Arbitrary redirect targets are
rejected (open-redirect protection), and the OAuth state parameter is validated against
the session.

**Privacy:** user content is not sent anywhere except to a provider the user explicitly
configured for that content. No content analytics, no third-party trackers. Local data
stays in PGlite/SQLite on the device; server-side data is limited to what a feature needs
(session metadata and provider caches).

**Threat considerations:**

- *Prompt injection from ingested content:* email bodies, article text, and feed content
  are untrusted input to the assistant. Mitigations: tool classes enforced mechanically
  regardless of model output; class W always shows the concrete action and target to the
  user; read tools never express dangerous operations. Sandboxed parsing of untrusted
  content is `proposed`.
- *Secret leakage:* mitigated by server-side secrets, keychain-held desktop tokens, and
  environment linting that separates public from server env vars.
- *OAuth abuse:* minimal scopes, read-only defaults, state validation, allow-listed
  redirects.
- *Data loss:* the local DB is the system of record, so a scheduled snapshot backup of
  the local database is a desktop-shell concern to address in the foundation phase (`proposed`).

**Read-only defaults:** every integration starts read-only. Finance integrations are
permanently read-only with no write actions of any kind (product decision). Email and
calendar start read-only and gain write scope only behind explicit per-action
confirmation. The GitHub dashboard is read-first; any write actions are confirm-gated.

## 10. Integration boundaries

No integration is implemented. Each integration gets: a provider adapter interface,
minimal OAuth scopes, a local cache of fetched data, and no background writes.

| Integration | Purpose | Status | Write posture |
| --- | --- | --- | --- |
| GitHub | Unfinished PRs, reviews waiting on the user, activity feeding "what to build next" | `selected` for v1 | Read-first dashboard; any write actions `proposed` and per-action confirmed |
| Reading list | Save, organize, and read later; web articles first, PDF/EPUB later | `selected` for v1 | Local data; formats beyond web `proposed` |
| Email (Gmail / Microsoft) | Aggregate inbox streams into one triage view | `deferred` (post-v1) | Read-first; sending is per-action confirmed |
| Calendar (Google Calendar / CalDAV / Notion) | Events plus AI time-blocking proposals | `deferred` (post-v1) | Read events; writes per-action confirmed |
| Feeds (RSS, news, curated YouTube) | Tech digest | `deferred` (post-v1) | Read |
| Finance | Read-only view of accounts and balances | `deferred` (post-v1) | Permanently read-only; no write actions of any kind |

## 11. Deployment, environment, observability, development workflow

**Deployment:** the web app runs in two honest shapes. (a) Locally in a browser with
PGlite; local features need no server. (b) With the Next.js server for provider-mediated
features (auth, GitHub, AI). A self-hosted single-user Node deployment fits the
local-first, single-user product; managed hosting is `proposed`, not selected.

**Environment configuration:** environment variables hold provider credentials and the
optional server Postgres URL. `.env` files per environment, gitignored; a committed
`.env.example` documents variable names (`implemented`). Public-vs-server env separation
is enforced so secrets never reach the client bundle - the enforcement lint is not
built yet (`selected`).

**Desktop packaging:** Tauri 2 bundles the web frontend with the shell for macOS,
Windows, and Linux. Code signing and auto-update are later-stage items (`proposed`).

**Observability:** structured server logs for provider calls and failures; client error
reporting scoped to errors only, never content. Provider failures surface in the UI as
degraded states: the core planning loop works without AI, and the calm product shows
partial failure quietly. No user-content telemetry, ever.

**Development workflow:**

- Repository layout (`implemented`): the Next.js app at the root; the Tauri 2 project
  in `src-tauri/` alongside `src/`. This is Tauri's standard layout for a root-level web
  app and replaces the earlier `desktop/` plan: the shell is a single directory, and a
  `desktop/` wrapper would only add an empty layer. Shared code moves to `packages/`
  only when the shell genuinely needs it (`proposed`).
- Local loop: run the web app in a browser against PGlite for fast iteration; Tauri dev
  mode for desktop-specific work.
- Quality gates (`selected`, as code appears): typecheck, lint, unit tests at the seams
  from section 7, and E2E for the v1 loop, all in CI on PRs.
- Migrations (`implemented`): Drizzle-generated migrations are committed and applied
  with `npm run db:migrate` (PGlite or Postgres). Automatic application at app start
  arrives with the repository layer.

## 12. Current foundation versus planned product

**Implemented today:** `PRD.md`, `README.md`, this document, and the first part of
Phase 0: the Next.js 16 + React 19 app scaffold with Tailwind 4 and shadcn/ui; the
Tauri 2 shell scaffold at `src-tauri/` (no native capabilities yet); the Drizzle schema
with committed migrations and a local PGlite dev path (browser PGlite and desktop
SQLite still pending); the Better Auth configuration with migrated auth tables (route
and sign-in still pending); and the AI SDK seams - DeepSeek provider, single-step
assistant hook, MCP client and tool bridge (registry and enforcement still pending).

**Selected v1 direction (from `PRD.md`):** the daily planning loop with GitHub and
reading inputs: the assistant plans the day from the todo list, produces a daily summary;
the git dashboard surfaces unfinished PRs and pending reviews; the reading list captures
and organizes saved articles. Unbuilt; do not read "selected for v1" as "shipped".

**Phased evolution path** (order `selected`; contents mirror the PRD's scope and
out-of-scope sections, and change only with the PRD):

- **Phase 0, foundation (now):** this document; project scaffold; Drizzle schema and
  repositories over PGlite/SQLite; auth for server capabilities; AI orchestration behind
  the provider adapter; the tool permission registry and confirmation UI; CI. The first
  part landed with the foundation slice (issue #2); repositories, the registry,
  confirmation UI, and CI remain.
- **Phase 1, v1:** the daily planning loop, todo list, read-first GitHub dashboard, and
  reading list from the PRD's v1 scope.
- **Phase 2 (deferred):** calendar with AI time-blocking (Google Calendar / Notion) and
  email inbox aggregation.
- **Phase 3 (deferred):** feeds/digest, read-only finance widgets, multi-device sync, and
  local models if the desktop path warrants them.

## 13. Key decisions

- **D1** Local-first data ownership: the local database is the system of record (`selected`).
- **D2** Drizzle ORM as schema source of truth; PGlite in the browser, SQLite under
  Tauri, Postgres server path behind the one schema (`selected`; schema and migrations
  committed, browser PGlite and desktop SQLite still pending).
- **D3** Vercel AI SDK as the AI orchestration layer (`implemented`).
- **D4** MCP as the tool integration protocol; assistant tools wrap the same repositories
  the UI uses (`selected`; MCP client and tool bridge landed, registry pending).
- **D5** DeepSeek API as the initial provider, behind a provider-neutral adapter (`implemented`).
- **D6** Better Auth with Google OAuth for server capabilities; the local core needs no
  account (`selected`; configuration and tables landed, flow pending).
- **D7** Web-first with a thin Tauri 2 desktop shell (`implemented`; shell scaffolded,
  native capabilities pending).
- **D8** Confirmation model: read / local-mutation / external-write tool classes, enforced
  by the registry; integrations read-only by default (`selected`).
- **D9** Finance integrations permanently read-only, no write actions ever (`selected`).
- **D10** Sync deferred until v1 works on one machine; the repository seam keeps the
  option cheap (`selected`).

**Recording further decisions:** significant decisions beyond this list get a dated entry
in the change log below; decisions with long-term consequences also get a short ADR in
`docs/architecture/decisions/` once the docs tree exists.

## 14. Open questions

- **Sync mechanism** (D10): self-hosted Postgres hub vs E2EE sync service vs file-based
  snapshot sync. Revisit after v1.
- **AI runtime long-term:** server-mediated is selected for now; whether the desktop app
  later runs local models depends on offline-AI priority, latency, and cost.
- **Class L confirmation UX:** how much friction keeps the calm UI calm without making
  local mutations unsafe.
- **Email integration order:** Gmail first vs Microsoft first when inbox aggregation lands.
- **Server at all?** Whether a hosted or self-hosted server remains in the product, or
  the desktop app becomes the primary shape. Decides how much to invest in the Postgres
  server path.
- **Provider cache lifecycle:** retention and deletion semantics for cached provider data.

## 15. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Prompt injection from ingested content (email, articles, feeds) | High | Mechanical tool-class enforcement; class W always shows action and target; read tools never express dangerous operations |
| Provider lock-in leaking into prompts and tools | Medium | AI SDK abstraction; provider adapters; no vendor-specific calls outside adapters |
| Local-first vs server-mediated AI tension (offline use, latency, cost) | Medium | Core loop works without AI; degraded states in the UI; local-model path reserved (D5) |
| Sync conflicts when multi-device arrives | Deferred | Repository seam (D10); single-machine assumption stated until revisited |
| Desktop/web drift, Tauri shell duplicating logic | Medium | Thin-shell rule; capability seam; web is the primary test surface |
| Secret leakage through client bundles or desktop packaging | High | Server-side secrets only; keychain for desktop tokens; env separation enforced |
| Scope creep against the calm, minimal product | Medium | PRD owns scope; phased roadmap; deferred items stay deferred |
| Framework recency (Next.js 16 / React 19) | Low | Dependency updates tracked in CI; foundation phase is deliberately small |

## 16. Change log and update convention

**When to edit this file:** in the same PR that changes the architecture or implements a
`selected` item. Marker updates from `selected`/`proposed` to `implemented` are mandatory
when code ships. Prose that only concerns product scope belongs in `PRD.md`, not here.
A PR that changes architecture without updating this document is incomplete, and review
should treat it that way.

**How to record decisions:** add a dated entry below (date - change - why - PR or issue
link); update section 13 for lasting decisions; write a short ADR in
`docs/architecture/decisions/` for decisions with long-term consequences.

**Change log:**

- 2026-11-11 - Foundation slice implemented from issue #2 (PR #7): Next.js 16 + React 19
  scaffold with Tailwind 4 and shadcn/ui, Drizzle schema with committed migrations and
  a local PGlite dev path, Better Auth configuration with migrated auth tables, AI SDK
  seams (DeepSeek provider, single-step assistant hook, MCP client and tool bridge),
  and the Tauri 2 shell scaffold. Marker updates in sections 6, 8, 9, 11, 12, and 13
  accompany the code. One layout deviation is recorded: the Tauri project lives in
  `src-tauri/` (Tauri's standard location for a root-level web app), replacing the
  `desktop/` plan in section 11.
- 2026-11-11 - Created as the initial comprehensive architecture record, capturing the
  selected direction from `PRD.md` and the project's technical research while the
  repository holds no application code. Origin: issue #3.
