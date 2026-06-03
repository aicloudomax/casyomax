---
name: write-a-prd
description: Generate a Product Requirements Document (PRD) from a client brief, Slack message, Jira ticket, or grilling session, and write it as a local markdown file under issues/. Use when the user wants to turn a request into a structured PRD for any Casyomax app (backend, mobile, web).
---

# Write a PRD

This skill converts a client request, internal idea, or grilling session into a written PRD stored locally in the repo. You may skip steps if they are not necessary for the situation.

## Process

### 1. Get the raw request

Ask the user for a long, detailed description of the problem they want to solve and any solution ideas they already have. If they reference a Slack message, Jira ticket, or external doc, ask them to paste it in.

### 2. Identify the target app(s)

The Casyomax monorepo (pnpm + Turborepo) contains 3 apps under `apps/`:

- `backend` — `apps/backend/` — Express + PostgreSQL API (CommonJS). Code under `src/{config,controllers,middleware,models,routes,services,utils}/`, scheduled work under `jobs/`. Integrates Azure OpenAI/Speech, email, and Expo push reminders.
- `mobile`  — `apps/mobile/` — Expo React Native app (Expo Router). Roles Admin/Caregiver/Patient under `app/{admin,auth,caretaker,patient}/`; shared `components/`, `hooks/`, `services/` (ApiHelper, AuthService, AzureService, notifications).
- `web`     — `apps/web/` — React + Vite marketing site. Pages under `src/pages/` (Home, PrivacyPolicy), API helper under `src/services/`.

Confirm which app(s) the PRD targets. Keep a PRD as narrowly scoped as possible, but note that user-facing features commonly span **backend + mobile** (API change plus the screen that consumes it) — that is normal and expected here, not "cross-cutting."

### 3. Explore the repo

Verify the user's assertions against the actual code. For backend changes read the relevant `src/routes/*Routes.js`, `src/controllers/`, `src/services/`, and `src/models/` files; check `src/config/db.js` and the PostgreSQL schema. For mobile changes read the relevant route under `app/` plus the `components/` and `services/` it uses. For web changes read `src/pages/`.

### 4. Grill the user

Use the [[grill-me]] skill. Walk the decision tree depth-first until ambiguity is resolved. For each question, provide your recommended answer.

### 5. Sketch the modules

Identify the major modules to build or modify. Actively look for opportunities to extract **deep modules** — modules with a small interface hiding a large implementation, which can be tested in isolation.

Check with the user that the module breakdown matches their expectations. Ask which modules they want test coverage for.

### 6. Write the PRD

Write the PRD as a local markdown file at:

```
issues/<app>/prd-<short-slug>.md
```

For example: `issues/mobile/prd-medication-reminders.md`. Create the `issues/<app>/` directory if it doesn't exist. (Use the primary app for the folder; a backend+mobile feature can live under whichever app leads it.)

Do NOT submit a Jira ticket, GitHub issue, or any external service.

<prd-template>

# PRD: <feature name>

**App:** backend | mobile | web (list all that apply)
**Created:** <YYYY-MM-DD>
**Status:** draft | approved | in-progress | done

## Problem Statement

The problem from the user's perspective.

## Solution

The solution from the user's perspective.

## User Stories

A long, numbered list. Format: `As a <actor>, I want <feature>, so that <benefit>`.

1. As a <actor>, I want <feature>, so that <benefit>
2. ...

Be extensive. Cover all aspects of the feature.

## Implementation Decisions

- Modules to build/modify
- Public interfaces of those modules
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets — they rot fast.

## Testing Decisions

- A description of what makes a good test (test external behavior, not implementation details)
- Which modules will be tested
- Prior art in the codebase (similar test patterns to follow)

## Out of Scope

What is explicitly NOT part of this PRD.

## Further Notes

Anything else relevant.

</prd-template>

### 7. Next step

After writing the PRD, suggest the user run the [[prd-to-issues]] skill to break it into tracer-bullet slices.
