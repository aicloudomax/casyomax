export const meta = {
  name: 'ship-prd',
  description: 'Topo-sort and implement remaining slices of a PRD. Reads Status field per issue, skips done. AFK siblings run in parallel via worktree isolation when files are disjoint; HITL slices serialize. Args: { prdFile, issuesDir }',
  phases: [
    { title: 'Parse', detail: 'read all issues + extract Type, Status, Blocked by' },
    { title: 'Plan', detail: 'topo-sort into dependency layers, drop done issues' },
    { title: 'Implement', detail: 'one TDD subagent per remaining slice' },
  ],
};

const PARSE_SCHEMA = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'basename only, e.g. "004-foo.md"' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['HITL', 'AFK'] },
          status: { type: 'string', enum: ['draft', 'in-progress', 'done'] },
          blockedBy: {
            type: 'array',
            items: { type: 'string' },
            description: 'Basenames of blocker issues. Empty array if "None — can start immediately".',
          },
        },
        required: ['filename', 'title', 'type', 'status', 'blockedBy'],
        additionalProperties: false,
      },
    },
  },
  required: ['issues'],
  additionalProperties: false,
};

const SLICE_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Concise: what landed + what tests are passing. 2-4 sentences.' },
    testsAdded: { type: 'string', description: 'New tests added, e.g. "7 rate-limit tests" or "none"' },
    allTestsPassing: { type: 'boolean', description: 'Are backend + frontend tests all green at the end?' },
    statusUpdatedToDone: { type: 'boolean', description: 'Did you update the issue file Status to done?' },
    manualVerificationNeeded: {
      type: 'array',
      items: { type: 'string' },
      description: 'Things the user must verify manually (UI, infra, integration)',
    },
  },
  required: ['summary', 'testsAdded', 'allTestsPassing', 'statusUpdatedToDone', 'manualVerificationNeeded'],
  additionalProperties: false,
};

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {});
const issuesDir = parsedArgs.issuesDir;
const prdFile = parsedArgs.prdFile;
const approvedHITL = new Set(parsedArgs.approvedHITL || []);

log('ship-prd args: ' + JSON.stringify({ issuesDir, prdFile, approvedCount: approvedHITL.size }));

if (!issuesDir || !prdFile) {
  return { error: 'Missing required args: issuesDir, prdFile', receivedArgs: parsedArgs };
}

phase('Parse');
// Parse is pattern-matching over markdown files. Haiku is plenty for this and ~10x cheaper than Opus.
const parsed = await agent(
  'List all files in ' + issuesDir + ' matching the pattern 00*.md (NOT prd-*.md). For each file: read it, extract the filename (basename only), the H1 title (strip leading "# "), the Type (must be "HITL" or "AFK"), the Status (default "draft" if the field is absent — must be one of "draft", "in-progress", "done"), and the blockedBy array (basenames listed under "## Blocked by"; if "None — can start immediately" or the section is missing, return []). Use Glob and Read tools. Return ALL issues regardless of status — the workflow filters later.',
  { label: 'parse', schema: PARSE_SCHEMA, model: 'claude-haiku-4-5-20251001' }
);

log('Found ' + parsed.issues.length + ' issues in ' + issuesDir);
log('Status breakdown: ' + parsed.issues.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {}));

phase('Plan');

const todo = parsed.issues.filter(i => i.status !== 'done');
const doneSet = new Set(parsed.issues.filter(i => i.status === 'done').map(i => i.filename));

if (todo.length === 0) {
  log('No remaining issues — all slices are Status: done. Nothing to ship.');
  return {
    status: 'no-op',
    completed: 0,
    totalIssues: parsed.issues.length,
    alreadyDone: doneSet.size,
    message: 'PRD is fully implemented (all issues Status: done).',
  };
}

log('Will implement ' + todo.length + ' issues: ' + todo.map(i => i.filename + ' (' + i.type + ')').join(', '));

// Build topo layers. Layer N = all issues whose blockers are all in done or in layers 0..N-1.
const layers = [];
const completed = new Set(doneSet);
let remaining = [...todo];

while (remaining.length > 0) {
  const ready = remaining.filter(i => i.blockedBy.every(b => completed.has(b)));
  if (ready.length === 0) {
    log('Stuck — these issues have unsatisfied blockers and cannot be scheduled: ' + remaining.map(i => i.filename).join(', '));
    return {
      status: 'blocked',
      completed: 0,
      blocked: remaining.map(i => ({ filename: i.filename, unfinishedBlockers: i.blockedBy.filter(b => !completed.has(b)) })),
      message: 'Dependency graph has unsatisfiable blockers.',
    };
  }
  layers.push(ready);
  ready.forEach(i => completed.add(i.filename));
  remaining = remaining.filter(i => !ready.includes(i));
}

log('Planned ' + layers.length + ' execution layer(s)');
layers.forEach((layer, idx) => {
  log('  Layer ' + (idx + 1) + ': ' + layer.map(i => i.filename + ' (' + i.type + ')').join(', '));
});

phase('Implement');

const implementPrompt = (issue) => [
  'Implement this PRD slice using TDD: ' + issuesDir + '/' + issue.filename,
  '',
  'Process:',
  '1. Read the issue file at ' + issuesDir + '/' + issue.filename,
  '2. Read the parent PRD at ' + prdFile + ' for full context',
  '3. From the issue\'s "Acceptance criteria", identify which behaviors should be TDD-covered (the issue states this explicitly). Build the rest non-TDD with manual verification.',
  '4. For TDD-covered behaviors: ONE failing test (RED) → minimal code to pass (GREEN) → repeat. Run tests after every cycle. Never write all tests first.',
  '5. Build any non-TDD parts to satisfy all remaining acceptance criteria.',
  '6. Run ALL tests at the end and verify they pass.',
  '7. AFTER all tests pass and acceptance criteria are met, update the issue file\'s "**Status:**" line from "draft" (or "in-progress") to "done".',
  '',
  'Codebase conventions (Casyomax — pnpm + Turborepo monorepo, package names @casyomax/<app>):',
  '- backend (apps/backend): Express + PostgreSQL, CommonJS (require/module.exports). Code under src/{config,controllers,middleware,models,routes,services,utils}/; scheduled work under jobs/. Routers are src/routes/<domain>Routes.js, data access is src/models/<domain>Model.js, business logic is src/services/. DB config in src/config/db.js. Run the API with `pnpm dev:backend` (port 5000).',
  '- mobile (apps/mobile): Expo React Native with Expo Router. Screens under app/{admin,auth,caretaker,patient}/; shared code in components/, hooks/, services/ (ApiHelper.js, AuthService.js, AzureService.js, notifications.js). Styling via NativeWind/Tailwind. Run with `pnpm dev:mobile`.',
  '- web (apps/web): React + Vite marketing site. Pages under src/pages/, API helper at src/services/apiHelper.js. Run with `pnpm dev:web` (port 5173), build with `pnpm build:web`.',
  '- TESTS (backend): Jest is configured (CommonJS, no babel). Specs live in __tests__/ folders named *.test.js (e.g. apps/backend/src/models/__tests__/contactModel.test.js). Run from repo root with `pnpm --filter @casyomax/backend test` or `pnpm test` (Turborepo). jest.setup.js seeds dummy DB env vars; stub the single I/O point (pool.query) instead of hitting a real DB — see the contactModel sample test. The legacy test_*.js probes at the backend root are NOT Jest specs (excluded by testMatch).',
  '- TESTS (mobile/web): no runner configured yet. If a slice needs tests here, agree on and wire up a runner FIRST (Jest + React Native Testing Library for mobile; Vitest for the Vite web app), add the `test` script, then do red-green. If no runner can be added for a slice, build to the acceptance criteria and list everything under manual verification instead of claiming tests pass.',
  '- Run scripts from the repo root via pnpm filters, e.g. `pnpm --filter @casyomax/backend <script>`, or the root aliases (`pnpm dev:backend`, `pnpm dev:web`, `pnpm dev:mobile`, `pnpm lint`).',
  '',
  'Be careful:',
  '- Do not add features beyond what the issue requires.',
  '- Do not commit — the user reviews and commits.',
  '- If tests fail and you cannot fix within ~3 attempts, STOP and report.',
  '- If existing code conflicts with this slice, STOP and report.',
  '',
  'Report concisely: summary, tests added, allTestsPassing, statusUpdatedToDone, manual verification items.',
].join('\n');

const results = [];

for (let layerIdx = 0; layerIdx < layers.length; layerIdx += 1) {
  const layer = layers[layerIdx];
  log('LAYER ' + (layerIdx + 1) + '/' + layers.length + ' — ' + layer.length + ' issue(s)');

  const afkInLayer = layer.filter(i => i.type === 'AFK');
  const hitlInLayer = layer.filter(i => i.type === 'HITL');

  // AFK slices in this layer: run in parallel with worktree isolation IF more than one.
  // (Single AFK slice: skip worktree overhead, run in main tree.)
  // AFK = mechanical TDD against well-specified acceptance criteria. Sonnet is plenty and ~3x cheaper than Opus.
  if (afkInLayer.length === 1) {
    log('  AFK (serial): ' + afkInLayer[0].filename);
    const result = await agent(implementPrompt(afkInLayer[0]), {
      label: 'afk:' + afkInLayer[0].filename.slice(0, 3),
      schema: SLICE_RESULT_SCHEMA,
      model: 'claude-sonnet-4-6',
    });
    if (!result) {
      log('  FAILED ' + afkInLayer[0].filename + ' — aborting workflow');
      return { completed: results.length, results, abortedAt: afkInLayer[0].filename };
    }
    results.push({ filename: afkInLayer[0].filename, type: 'AFK', ...result });
    if (!result.allTestsPassing) {
      log('  WARNING ' + afkInLayer[0].filename + ' reports failing tests — aborting');
      return { completed: results.length, results, abortedAt: afkInLayer[0].filename, reason: 'tests-failing' };
    }
  } else if (afkInLayer.length > 1) {
    log('  AFK (parallel worktrees): ' + afkInLayer.map(i => i.filename).join(', '));
    const parallelResults = await parallel(
      afkInLayer.map(issue => () => agent(implementPrompt(issue), {
        label: 'afk:' + issue.filename.slice(0, 3),
        schema: SLICE_RESULT_SCHEMA,
        isolation: 'worktree',
        model: 'claude-sonnet-4-6',
      }))
    );
    for (let i = 0; i < afkInLayer.length; i += 1) {
      const result = parallelResults[i];
      const issue = afkInLayer[i];
      if (!result) {
        log('  FAILED ' + issue.filename + ' (parallel)');
        return { completed: results.length, results, abortedAt: issue.filename };
      }
      results.push({ filename: issue.filename, type: 'AFK', ...result });
    }
  }

  // HITL slices in this layer: run in series. After each, pause for human review
  // unless the slice's filename has been pre-approved via approvedHITL arg (set on resume).
  // HITL = user-facing wording, UX, judgment calls. Keep on Opus (default inherit, no model override).
  for (const issue of hitlInLayer) {
    log('  HITL: ' + issue.filename);
    const result = await agent(implementPrompt(issue) + '\n\nThis is a HITL slice — your output will be reviewed by a human. Be especially careful with user-facing wording, error messages, and UX decisions.', {
      label: 'hitl:' + issue.filename.slice(0, 3),
      schema: SLICE_RESULT_SCHEMA,
    });
    if (!result) {
      log('  FAILED ' + issue.filename);
      return { completed: results.length, results, abortedAt: issue.filename };
    }
    results.push({ filename: issue.filename, type: 'HITL', ...result, needsHumanReview: true });
    if (!result.allTestsPassing) {
      return { completed: results.length, results, abortedAt: issue.filename, reason: 'tests-failing' };
    }

    // Pause here unless the user has pre-approved this HITL slice via approvedHITL.
    // The skill that launched this workflow captures the result and writes state so the
    // user can review, then invoke /ship-prd-continue to resume from the cache.
    if (!approvedHITL.has(issue.filename)) {
      log('  PAUSE at HITL: ' + issue.filename + ' — awaiting human approval before continuing');
      return {
        status: 'paused-at-hitl',
        pausedAt: issue.filename,
        completedThisRun: results,
        approvedHITL: Array.from(approvedHITL),
        message: 'HITL slice ' + issue.filename + ' implemented. Review the changes, then invoke /ship-prd-continue with --approve ' + issue.filename + ' to resume past this gate. To reject, leave the approvedHITL list as-is and the workflow will re-run this slice on next invocation.',
      };
    }
    log('  HITL ' + issue.filename + ' was pre-approved — continuing past gate');
  }
}

return {
  status: 'completed',
  completed: results.length,
  results,
  hitlSlicesCompleted: results.filter(r => r.type === 'HITL').map(r => r.filename),
  layersExecuted: layers.length,
};
