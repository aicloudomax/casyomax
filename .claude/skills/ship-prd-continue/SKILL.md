---
name: ship-prd-continue
description: Resume a paused /ship-prd run past a HITL gate after human review. Reads .claude/state/ship-prd-<slug>.json, marks the paused HITL slice as approved (or rejected), and re-invokes the workflow with resumeFromRunId so already-completed slices return from cache. Use after /ship-prd reports "Paused at HITL slice X" and you've reviewed the diff.
---

# Ship PRD: Continue

Resume a paused PRD execution past a HITL gate. The paired skill to `/ship-prd`.

## When to use

- `/ship-prd` paused and reported `status: "paused-at-hitl"`
- You reviewed the HITL slice's diff and decided: approve (advance) or reject (re-run)

## When NOT to use

- No state file exists for the PRD (run `/ship-prd` instead)
- The state file is `status: "completed"` (PRD is done)
- The state file is `status: "aborted"` (fix the abort cause manually, then run `/ship-prd` fresh)

## Workflow

### Step 1: Parse the user's input

User invokes: `/ship-prd-continue <prdFile> [--approve|--reject]`

- `prdFile` is the path the user passed (same as the original `/ship-prd` call)
- `--approve` (default if neither flag given): the paused HITL slice gets added to `approvedHITL` and the workflow advances past the gate
- `--reject`: the paused HITL slice is removed from approval (it'll re-run on next workflow invocation with the same prompt — the user is presumably going to edit the issue file first to clarify what they want)

Derive `slug` from the PRD filename: strip `prd-` prefix and `.md` suffix. State file: `.claude/state/ship-prd-<slug>.json`.

### Step 2: Read the state file

If the state file doesn't exist: tell the user to run `/ship-prd` first. STOP.

If state.status is `"completed"`: tell the user the PRD is done. STOP.

If state.status is `"aborted"`: tell the user to investigate the abort and re-run `/ship-prd` fresh (after deleting the state file). STOP.

If state.status is `"paused-at-hitl"`: proceed.

### Step 3: Update approval list

- On `--approve`: add `state.pausedAt` to `state.approvedHITL` (deduplicated).
- On `--reject`: ensure `state.pausedAt` is NOT in `state.approvedHITL` (it shouldn't be, but be defensive).

### Step 4: Invoke the workflow with resumeFromRunId

Invoke the Workflow tool with:

- `scriptPath`: `.claude/workflows/ship-prd.js`
- `resumeFromRunId`: `state.runId`
- `args`: `{ prdFile: state.prdFile, issuesDir: state.issuesDir, approvedHITL: state.approvedHITL }`

Because `resumeFromRunId` is set, all the previously-completed `agent()` calls in the workflow will return their cached results instantly. Only the HITL gate check that previously paused — now finding the slice in `approvedHITL` — will let the workflow advance past it. The next slice (if any) runs fresh; if it's another HITL, the workflow pauses again.

**Capture the new runId from the launch response.** Even though we're resuming, the harness assigns a new runId to this run. Subsequent `/ship-prd-continue` calls will need the new runId.

### Step 5: When the workflow returns, branch on `result.status`

Same as `/ship-prd` step 3, but **updating** the state file rather than creating it fresh:

- `status: "completed"` → Update state file `status: "completed"`. Tell user the PRD is done. Optionally delete the state file (or leave for audit).
- `status: "paused-at-hitl"` → Update state file with new `runId`, new `pausedAt`, new `completedThisRun` (cumulative or this-run-only — your choice; cumulative is more useful). Tell the user the new pause point.
- `status: "blocked"` → Report.
- `abortedAt` set → Update state to `status: "aborted"`. Report.

## Safety constraints

- **Always read the state file first.** Never guess the runId or approvedHITL.
- **The state file is the source of truth** for what's been approved across multiple resumes.
- **If a HITL slice keeps failing tests**, do not auto-approve. The workflow aborts on test failure regardless of approvedHITL.

## Example pause-resume cycle

```
User: /ship-prd issues/mobile/prd-foo.md
Skill: invokes Workflow. After ~3 minutes:
  Workflow returns: status="paused-at-hitl", pausedAt="003-checkout-ui.md"
  Skill writes: .claude/state/ship-prd-foo.json with runId=wf_aaa, approvedHITL=[]
  Skill tells user: "Paused at 003-checkout-ui.md. Review git diff. When ready, /ship-prd-continue issues/mobile/prd-foo.md"

User reviews `git diff` (or specific files). Likes what they see.

User: /ship-prd-continue issues/mobile/prd-foo.md
Skill: reads state, sees pausedAt=003. Adds "003-checkout-ui.md" to approvedHITL.
  Invokes Workflow with resumeFromRunId=wf_aaa, approvedHITL=["003-checkout-ui.md"]
  All previously-completed slices (001, 002, 003) return from cache instantly.
  Workflow advances past the gate, runs 004, 005, hits 006 (another HITL), pauses.
  Skill updates state: runId=wf_bbb (new), approvedHITL=["003-checkout-ui.md"], pausedAt="006-..."
  Tells user: "Paused at 006-..."

User reviews 006. Decides the wording is wrong. Edits the issue file manually to clarify, OR edits the resulting code, then:

User: /ship-prd-continue issues/mobile/prd-foo.md --reject
Skill: reads state, ensures "006-..." is NOT in approvedHITL.
  Invokes Workflow with resumeFromRunId=wf_bbb (or fresh — either works since 003 is cached).
  Cached results for 001-005. Workflow re-runs 006 with the updated issue file. Pauses again.
  Loop until user is happy.

User: /ship-prd-continue issues/mobile/prd-foo.md --approve
Skill: adds 006 to approvedHITL. Invokes workflow.
  Cached 001-006. No more layers. Workflow returns status="completed".
  Skill writes status="completed" to state. Tells user PRD is done.
```

## Example developer workflow commands

```bash
# Start a fresh PRD execution
/ship-prd issues/mobile/prd-checkout.md

# (review the diff manually — e.g. `git diff`)

# Approve the paused HITL slice and continue
/ship-prd-continue issues/mobile/prd-checkout.md

# Reject and re-run the paused HITL slice (after editing the issue file or code)
/ship-prd-continue issues/mobile/prd-checkout.md --reject

# Restart from scratch (delete state, re-run from beginning — only do this if you really want to redo all completed work too)
rm .claude/state/ship-prd-checkout.json
/ship-prd issues/mobile/prd-checkout.md
```
