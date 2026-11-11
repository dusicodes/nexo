# nexo

**A calm, local-first, AI-powered personal workspace and second brain that brings your daily context together in one quiet place.**

nexo is a personal productivity workspace for a single user. It gathers the pieces of your day - tasks, notes, calendar, email, reading, and code work - into one private, local-first space. An AI assistant then organizes that context and turns it into a plan for the day, so you spend less time triaging across tools and more time doing the work that matters.

> **Status:** nexo is in its prototype and foundation stage. The product direction is defined, research and early prototypes exist, and the application foundation is being built. No production feature set has shipped yet. This README describes where nexo is going, what exists today, and what is still planned.

## What nexo is

- **A second brain.** One home for the context you collect across work, school, and personal life.
- **A daily workspace.** Notes, tasks, calendar, email, reading, and code activity in one calm surface.
- **A planning assistant.** AI organizes incoming context and turns it into a plan for the day.
- **Local-first and private.** Your data lives with you by default, not on someone else's server.

## Who it's for

nexo is built for one person managing a full life across fragmented tools: work, school, personal life, learning, coding, reading, and finances.

- **A single user, one dataset, their own accounts.** No sharing, no roles, no permissions machinery.
- **Someone who juggles many streams.** Inboxes, todo lists, calendars, feeds, git forges, and saved articles that never quite connect.
- **Someone who wants an AI assistant with real context.** Not a chatbot that only knows the current conversation, but an assistant grounded in your tasks, your reading, and your day.

nexo is a personal product, not a team or enterprise tool.

## The problem nexo solves

### Fragmented context

Day-to-day information is scattered across inboxes, todo lists, calendars, feeds, and git forges. Related things live in different tools, and the connections between them are lost. The context for a single decision can be spread across five apps.

### Scattered tasks and commitments

Tasks land in todo apps, promises in email threads, deadlines in a calendar, code work in pull requests. Nothing holds the complete list, so things slip through the cracks.

### Difficult prioritization

Triaging and planning across all these tools is manual, repetitive, and noisy. Deciding what to do today means opening every app, re-reading everything, and holding the whole picture in your head.

### AI assistants without a personal data layer

Most workspace and AI assistant tools are cloud-first and team-oriented. They answer from general knowledge or a cloud profile, and they have no owned layer of your personal data - your tasks, reading, code, and commitments - to plan with. nexo builds that layer, and keeps it yours.

## Use cases and user journeys

These journeys describe the product nexo is building toward. Each one notes its status; see the feature map below for the full picture.

### The daily planning loop

*Status: planned, v1 focus.*

The core of nexo. In the morning, the assistant reviews what is due from your todo list and what changed overnight - merged pull requests, new saved articles, new commitments - and proposes a plan for the day. You confirm or adjust, and one quiet summary replaces the morning app-hopping. The loop repeats: capture during the day, plan in the morning.

### A unified inbox for work, school, and personal life

*Status: planned, after v1.*

Work, school, and personal streams aggregate into a single triage view. Instead of checking three inboxes and two message apps, you triage everything in one place and file each item as a task, reading, or noise.

### AI todo summaries

*Status: planned, v1 focus.*

Tasks are captured and organized in one list, and the assistant generates a daily summary of what is due and what changed. The summary is drafted by the AI and owned by you: you decide what lands on the plan.

### Calendar and AI time-blocking

*Status: planned, after v1.*

The assistant proposes when to do the day's tasks: a draft schedule, not a silent rearrangement. Integrations with Google Calendar and Notion bring existing commitments into view. You approve the blocks; nothing moves without you.

### GitHub: pull requests, reviews, and what to build next

*Status: planned, v1 focus.*

A git dashboard shows unfinished pull requests and reviews waiting on you, and suggests what to build next. Code work gets a first-class seat in the daily plan instead of living only in notifications.

### Reading and saved content

*Status: planned, v1 focus.*

Save articles to read later. The reading list captures and organizes saved content and feeds it into the daily plan, so reading gets time instead of leaving tabs open forever.

### Technology and news digest

*Status: planned, after v1.*

One feed for RSS, news, and curated YouTube, delivered as a quiet digest rather than an endless stream. You catch up in one sitting instead of many interruptions.

### Read-only finance context

*Status: planned, after v1.*

A read-only view of accounts and balances, so money has context in the day's plan. There are no write actions of any kind: nexo can show you a balance, and it can never move money.

### Future: autonomous actions with explicit confirmation

*Status: direction only, not started.*

As the assistant matures, it may take actions on your behalf - drafting replies, filing tasks, scheduling blocks, preparing summaries. Every consequential action happens only after explicit confirmation. The assistant proposes; you decide.

## Feature map

Each area is labeled with its current status. Nothing in the "planned" rows is shipped yet.

| Area | What it does | Status |
| --- | --- | --- |
| Product research | Explored the problem space and validated the direction | Current prototype |
| Early prototypes | Throwaway explorations of the workspace concept | Current prototype |
| Application foundation | The runnable app shell, local data layer, and auth | Foundation, in progress |
| Architecture documentation | `architecture.md` describing the technical design | Foundation, in progress |
| Daily planning loop | Assistant plans the day from todos and produces a daily summary | Planned, v1 focus |
| AI todo list | Capture, organize, and summarize tasks | Planned, v1 focus |
| GitHub dashboard | Unfinished PRs, pending reviews, next-build suggestions | Planned, v1 focus |
| Reading list | Save and organize articles to read later | Planned, v1 focus |
| Unified inbox | One triage view for work, school, and personal streams | Planned, after v1 |
| Calendar and time-blocking | AI-proposed schedule with Google Calendar and Notion | Planned, after v1 |
| Tech digest | One feed for RSS, news, and curated YouTube | Planned, after v1 |
| Read-only finance widgets | Accounts and balances, read-only | Planned, after v1 |
| Deeper integrations and imports | More GitHub and reading depth, imports from existing tools, agent connections | Planned, after v1 |
| Full email client | Reading and composing email inside nexo | Deferred |
| Original news | nexo curates news; it does not create it | Deferred |
| Banking actions | Any write access to financial accounts | Out of scope, permanently |

## Product principles

1. **Local-first and private.** User data lives locally where possible; privacy by default. nexo is not a hosted multi-tenant service.
2. **Calm and minimal UI.** Quiet by design: no engagement dark patterns, no notification anxiety, no endless feeds.
3. **User-owned context.** Your data is yours. The assistant works from a personal data layer you own, not a cloud profile you rent.
4. **Confirmation before consequential actions.** The assistant drafts, suggests, and proposes. Anything consequential - sending, scheduling, mutating external tools - happens only after explicit confirmation.
5. **Modular integrations.** GitHub, calendar, feeds, finance: each integration is a module that can be added, removed, or left out, without taking the whole system with it.
6. **Single-user simplicity.** No sharing, roles, or permissions machinery.

## v1 direction and roadmap

### v1: the daily planning loop

The selected v1 direction is the daily planning loop, fed first by GitHub and reading inputs:

- The assistant plans the day from the todo list and produces a daily summary.
- The git dashboard surfaces unfinished PRs, pending reviews, and next-build suggestions.
- The reading list captures and organizes saved articles.

### After v1

Once the loop works, depth follows:

- Deeper GitHub and reading integrations.
- Feeds: the tech digest (RSS, news, curated YouTube).
- Read-only finance context.
- Imports from existing tools.
- Agent connections via MCP tool integrations.

### Deferred

- A full email client.
- Banking: any write access to financial accounts is permanently out of scope; the finance surface is read-only context.
- Original news: nexo curates news, it does not produce it.

## Current development status

| Milestone | Status |
| --- | --- |
| Product research | Complete |
| Early prototypes | Available |
| Initial PRD | Merged, see `PRD.md` ([PR #1](https://github.com/dusicodes/nexo/pull/1)) |
| Application foundation | In progress ([issue #2](https://github.com/dusicodes/nexo/issues/2)) |
| Technical architecture documentation | In progress ([issue #3](https://github.com/dusicodes/nexo/issues/3)) |
| Production feature set | Not shipped |

To be clear: nexo has not shipped a production feature set yet. What exists today is the direction, the research and prototypes, and the beginnings of the foundation. The roadmap below is the path forward.

## Technical direction

The selected technical direction from `PRD.md` and the foundation work. These are choices of direction, not descriptions of shipped code, and they may be adjusted as the foundation takes shape.

| Layer | Direction |
| --- | --- |
| Application | Next.js (16), React (19), TypeScript |
| UI | shadcn/ui with Tailwind |
| Desktop | Tauri 2 |
| Data | Drizzle ORM with Postgres-shaped data (Postgres/PGlite) and local storage |
| Agent | Vercel AI SDK with MCP tool integrations |
| Auth | Better Auth with Google OAuth |
| AI model | DeepSeek API |

## Repository map and links

- **`PRD.md`** - the product requirements document: vision, scope, and requirements in detail. The authoritative description of what nexo is.
- **`architecture.md`** - planned, not yet in the repository; tracked in [issue #3](https://github.com/dusicodes/nexo/issues/3). This README does not depend on it.
- **Issues and roadmap** - https://github.com/dusicodes/nexo/issues

## Preview and development

The runnable application is not in this repository yet. Today the repository holds the product direction (`PRD.md`) and this README. The application foundation ([issue #2](https://github.com/dusicodes/nexo/issues/2)) will bring the app shell, the local data layer, and the first run instructions; this section will carry real setup and preview steps once it lands.

For now, the best way to explore nexo is to read `PRD.md`.

## Feedback

nexo is an early personal project, and feedback is welcome:

- Ideas, questions, and corrections: open an issue at https://github.com/dusicodes/nexo/issues
- Found something wrong or outdated in this README? An issue is the best place for that too.
- Keep expectations honest: this is a prototype-stage project, not a shipped product.

## Roadmap board

The roadmap lives in GitHub issues:

- [Issue #2](https://github.com/dusicodes/nexo/issues/2) - initialize the nexo application foundation
- [Issue #3](https://github.com/dusicodes/nexo/issues/3) - document the nexo technical architecture
- [Issue #5](https://github.com/dusicodes/nexo/issues/5) - this README
- Full board: https://github.com/dusicodes/nexo/issues
