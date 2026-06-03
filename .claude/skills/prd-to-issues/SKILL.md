---
name: prd-to-issues
description: Break a PRD into independently-workable vertical-slice (tracer bullet) issues and write each as a local markdown file in issues/. Use when the user wants to turn a PRD into a list of concrete tasks ready for implementation.
---

# PRD to Issues

Break a PRD into independently-grabbable issues using **vertical slices (tracer bullets)**, written as local markdown files.

## Process

### 1. Locate the PRD

Ask the user for the PRD file path (e.g. `issues/mobile/prd-medication-reminders.md`).

If the PRD is not already in your context window, read it from the file.

### 2. Explore the codebase

If you have not already explored the relevant app(s) under `apps/<app>/`, do so now. Look at:

- `apps/backend/src/` — `routes/`, `controllers/`, `services/`, `models/` (PostgreSQL data access), `config/db.js`
- `apps/mobile/` — `app/` (Expo Router screens by role), `components/`, `services/` (ApiHelper, AuthService, AzureService)
- `apps/web/src/` — `pages/`, `services/apiHelper.js`
- Any existing test patterns (note: no shared test runner is configured yet — see the [[tdd]] skill)

### 3. Draft vertical slices

Break the PRD into **tracer bullet** issues. A tracer bullet is a thin vertical slice that cuts through ALL integration layers end-to-end — NOT a horizontal slice of one layer.

**WRONG** (horizontal — do not do this):

- Issue 1: schema changes
- Issue 2: backend API
- Issue 3: frontend UI
- Issue 4: tests

**RIGHT** (vertical tracer bullets):

- Issue 1: end-to-end happy path with one minimal field (schema + API + UI + 1 test)
- Issue 2: add validation (schema + API + UI + tests)
- Issue 3: add edge case (schema + API + UI + tests)

Mark each slice as **HITL** or **AFK**:

- **HITL** (human-in-the-loop): needs an architectural decision, design review, sensitive config change, or anything visible to users
- **AFK** (away-from-keyboard): can be implemented and merged autonomously by an agent loop without human review of every step

Prefer AFK where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
- Each slice should be ≤1 day of work for a focused agent
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title** — short descriptive name
- **Type** — HITL or AFK
- **Blocked by** — which other slices (if any) must complete first
- **User stories covered** — which user stories from the PRD this addresses

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the HITL / AFK tags right?

Iterate until the user approves the breakdown.

### 5. Create the issue files

For each approved slice, write a markdown file in `issues/<app>/` using the naming pattern:

```
issues/<app>/NNN-short-title.md
```

Examples:
- `issues/mobile/001-add-medication-reminder-happy-path.md`
- `issues/mobile/002-add-reminder-validation.md`

Number issues starting from the next available number for that app (check what files already exist under `issues/<app>/`).

Create files in dependency order (blockers first) so you can reference real filenames in the "Blocked by" field.

Do NOT use `gh issue create`, `jira` CLI, or any external ticketing service. Do NOT reference Jira keys or GitHub issue numbers in the filename. Use local filenames for all cross-references.

<issue-template>

# <Issue title>

**Parent PRD:** `issues/<app>/prd-<slug>.md`
**Type:** HITL | AFK
**Status:** draft
**App:** backend | mobile | web (list all that apply)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- Blocked by `issues/<app>/NNN-<title>.md` (if any)

Or "None — can start immediately" if no blockers.

## User stories addressed

Reference by number from the parent PRD:

- User story 3
- User story 7

</issue-template>

Do NOT close or modify the parent PRD file.

### 6. Next step

After writing the issues, suggest the user pick one and implement it using the [[tdd]] skill.
