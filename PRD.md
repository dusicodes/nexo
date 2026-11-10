# nexo - Product Requirements Document

> Initial draft. nexo is in the early design and prototype stage; this document captures the current vision and scope and will evolve as the system is built.

## Product vision

nexo is a calm, local-first, AI-powered workspace that combines a second brain with daily tools - notes, tasks, calendar, email, reading, and code - plus an assistant that plans the day.

## Goal

Replace a scattered stack of personal productivity apps with one quiet, private workspace: information lands in one place, the assistant organizes it and turns it into a plan for the day, and the user spends less time triaging and more time doing.

## Target user

A single user, for personal use. nexo is a personal product, not a team or enterprise tool: one person, one data set, their own accounts.

## Problem

- Day-to-day information is scattered across inboxes, todo lists, calendars, feeds, and git forges.
- Triaging and planning across all of them is manual, repetitive, and noisy.
- Most workspace and AI assistant tools are cloud-first and team-oriented rather than calm, private, personal tools.

## Functional requirements

### Unified inbox

- Aggregate work, school, and personal streams into a single triage view.

### AI-powered todo list

- Capture and organize tasks.
- Generate a daily summary of what is due and what changed.

### Personal calendar

- AI time-blocking: the assistant proposes when to do the day's tasks.
- Integration with Google Calendar and Notion.

### Tech digest

- One feed for RSS, news, and curated YouTube.

### Git dashboard

- Show unfinished pull requests.
- Show reviews waiting on the user.
- Suggest "what to build next".

### Reading list

- Save articles to read later.

### Finance widgets

- Read-only view of accounts and balances.
- No write actions of any kind.

## Non-functional requirements

- **Local-first** - user data lives locally where possible; privacy by default.
- **Calm, modern, minimal UI** - quiet by design, no engagement dark patterns.
- **Single-user simplicity** - no sharing, roles, or permissions machinery.

## v1 scope

The first slice is the daily planning loop plus the git dashboard and reading list:

- The assistant plans the day from the todo list and produces a daily summary.
- The git dashboard surfaces unfinished PRs, pending reviews, and next-build suggestions.
- The reading list captures and organizes saved articles.

## Out of scope

Deferred beyond v1:

- Unified inbox for work, school, and personal streams.
- Calendar with AI time-blocking and Google Calendar / Notion integration.
- Tech digest (RSS, news, curated YouTube).
- Read-only finance widgets.

Out of scope for the product:

- Multi-user support, sharing, or team collaboration features.
- Any write access to financial accounts.
- Hosted multi-tenant service: nexo stays a single-user, local-first workspace.

## Tech stack

- **App** - Next.js 16, React 19, TypeScript
- **Desktop** - Tauri 2
- **Data** - Postgres / PGlite with Drizzle ORM
- **Agent** - Vercel AI SDK with MCP tool integrations
- **Auth** - Better Auth with Google OAuth
- **AI** - DeepSeek API

## Status

Early design and prototype stage. Nothing is implemented yet; this PRD is the starting point for the build.
