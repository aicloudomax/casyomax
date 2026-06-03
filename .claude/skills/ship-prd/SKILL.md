---
name: ship-prd
description: Autonomously implement all remaining slices of a PRD via topo-sorted dependency execution with HITL pause-resume. AFK siblings run in parallel via worktree isolation; HITL slices implement then PAUSE for human review. Reads Status field per issue, skips done. Use when the user wants to "ship the PRD," "run all remaining slices," or "orchestrate the PRD implementation." Pass a PRD path as the argument.
---

# Ship PRD

Autonomous PRD execution with human-in-the-loop pause-resume. Reads a PRD's issues, builds the dependency graph from `Blocked by` lines, topo-sorts into layers, and implements each remaining slice via a TDD subagent. AFK siblings within a layer parallelize via git worktrees; HITL slices implement and then **pause** for human review.

## When to use

- User says "ship issues/<app>/prd-<name>.md" or "run all remaining slices" or "Ralph Wiggum the rest"
- User wants to kick off a batch run after manually implementing the first slice or two
- User wants to start the orchestrated implementation of a fresh PRD

For *continuing* a paused PRD past a HITL gate, use `/ship-prd-continue` instead.

## When NOT to use

- A single slice (use `/tdd` directly)
- The PRD doesn't exist yet (use `/write-a-prd` then `/prd-to-issues` first)
- Resuming a paused PRD after HITL review (use `/ship-prd-continue`)

## Prerequisites

The PRD's issue files must include a `**Status:**` line in their frontmatter (`draft` / `in-progress` / `done`). See [../../../issues/README.md](../../../issues/README.md). Issues without the field are treated as `draft`.

## Workflow

### Step 1: Derive args from the user's input

The user passes a PRD file path (e.g. `issues/mobile/prd-medication-reminders.md`). From it:

- `prdFile` = the path as given
- `issuesDir` = parent directory of `prdFile`
- `slug` = the PRD filename with `prd-` stripped and `.md` removed (e.g. `medication-reminders`)
- `stateFile` = `.claude/state/ship-prd-<slug>.json`

If a state file already exists, **STOP** and tell the user to either delete it (to restart from scratch) or use `/ship-prd-continue` (to resume past the recorded HITL gate). Do not overwrite an in-progress run silently.

### Step 2: Invoke the workflow

Invoke the saved workflow at `.claude/workflows/ship-prd.js` via the Workflow tool, passing args:

```json
{
  "prdFile": "<the PRD path>",
  "issuesDir": "<parent dir>",
  "approvedHITL": []
}
```

**Important:** capture the `runId` from the launch response — you'll need it for state persistence.

### Step 3: When the workflow returns, branch on `result.status`

- **`status: "no-op"`** → All issues already done. Don't write a state file. Tell the user the PRD is complete.

- **`status: "completed"`** → All issues implemented (the PRD had no HITL slices, or all HITL slices were pre-approved). Write a final state file with `status: "completed"` so the user has the audit trail, but the run is over.

- **`status: "paused-at-hitl"`** → The workflow paused at a HITL gate after implementing that slice. Write state to `.claude/state/ship-prd-<slug>.json` with this shape:
  ```json
  {
    "status": "paused-at-hitl",
    "prdFile": "<prdFile>",
    "issuesDir": "<issuesDir>",
    "runId": "<runId from launch response>",
    "approvedHITL": [],
    "pausedAt": "<slice filename>",
    "completedThisRun": [<list of slice results from workflow>],
    "lastUpdatedISO": "<current ISO timestamp via 'date' bash command, NOT Date.now() — workflow scripts can't use Date.now() but skills can>"
  }
  ```
  Then tell the user clearly: "Paused at HITL slice `<filename>`. Review the changes (git diff). When ready, run `/ship-prd-continue <prdFile>` to advance past this gate, or edit the slice and re-run `/ship-prd` to retry."

- **`status: "blocked"`** → Dependency graph has an unsatisfiable cycle. Report the blocked issues to the user. No state file needed.

- **No `status` field but `abortedAt`** → A slice's tests failed or the subagent failed. Report which slice and why. Write a state file marked `status: "aborted"` so the user can re-invoke after fixing.

### Step 4: Create state directory if needed

Before writing the state file, ensure `.claude/state/` exists (Bash: `mkdir -p .claude/state`). Then `Write` the JSON.

## Safety constraints

- **No commits.** Subagents implement and run tests. The user reviews and commits.
- **Refuse to overwrite an active state file.** If `.claude/state/ship-prd-<slug>.json` exists with `status: "paused-at-hitl"` or `"aborted"`, redirect the user to `/ship-prd-continue` or have them manually delete the state file to restart.
- **First test failure aborts.** No compounding errors into later slices.
- **HITL pauses are mandatory by default.** A HITL slice will always pause unless its filename has been added to `approvedHITL` (which only happens via `/ship-prd-continue`).

## V1 limits

- **Worktree merging is naive.** Workflow tool handles cleanup but doesn't do explicit merge orchestration. For non-overlapping changes this is fine; overlapping files surface as conflicts the user resolves manually.
- **No cross-PRD orchestration.** One PRD at a time.
- **State files are local.** Don't sync them via git; they're ephemeral run state.

## Example execution

User: `/ship-prd issues/mobile/prd-medication-reminders.md`

Skill action:
1. Derive args: prdFile, issuesDir = `issues/mobile`, slug = `medication-reminders`.
2. Check `.claude/state/ship-prd-medication-reminders.json` — doesn't exist. Proceed.
3. Invoke Workflow with `{ prdFile, issuesDir, approvedHITL: [] }`. Capture runId from launch response.
4. Workflow runs: parses 8 issues, 5 are `draft`. Topo-sorts: Layer 1 (3 AFK), Layer 2 (1 HITL), Layer 3 (1 AFK).
5. Workflow implements Layer 1 in parallel worktrees, then Layer 2's HITL, then pauses.
6. Workflow returns `status: "paused-at-hitl", pausedAt: "004-reminder-form.md", ...`.
7. Skill writes `.claude/state/ship-prd-medication-reminders.json`.
8. Skill reports to user: "Paused at HITL slice `004-reminder-form.md`. Review the changes (git diff). When ready, run `/ship-prd-continue issues/mobile/prd-medication-reminders.md` to advance."
