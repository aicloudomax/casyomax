---
name: tdd
description: Test-driven development with red-green-refactor loop. Use when the user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development on any Casyomax app (backend, mobile, web).
---

# Test-Driven Development

## Philosophy

**Core principle:** Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (querying the database directly instead of using the interface). Warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples, [mocking.md](mocking.md) for mocking guidelines, [deep-modules.md](deep-modules.md) for module design, [interface-design.md](interface-design.md) for testable interfaces, and [refactoring.md](refactoring.md) for refactor candidates.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" — treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, signatures) rather than user-facing behavior
- Tests become insensitive to real changes — they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach:** Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

## Workflow

### 0. Issue status check (if implementing a tracked issue)

If the user invoked `/tdd` with a path to an issue file under `issues/<app>/NNN-*.md`, read that file BEFORE any planning and check its `**Status:**` field:

- `**Status:** done` → **STOP.** Do not re-implement. Reply to the user: "Issue `<filename>` is marked `Status: done`. The implementation already exists. If you want to re-run it (e.g. to verify tests still pass, or because the status field is stale), tell me explicitly and I will proceed." Then end the turn. Do not run any tests, do not edit any files, do not write any new tests.
- `**Status:** in-progress` → Proceed but inform the user this issue is partially implemented; you'll resume from wherever you can detect existing work.
- `**Status:** draft` or absent → Proceed with normal TDD workflow below.

This check exists because `/tdd` is otherwise stateless and a re-invocation would risk duplicating code, breaking existing tests, or causing cascading confusion. The status field in [issues/README.md](issues/README.md) is the source of truth.

### 1. Planning

Before writing any code:

- [ ] Confirm which Casyomax app (backend / mobile / web) and area is in scope (e.g. backend `src/services` + `src/routes`, or a mobile screen under `app/` + its `services/` client)
- [ ] Confirm the test runner for that app:
  - **backend** — Jest is configured (CommonJS, no babel). Tests live in `__tests__/` folders named `*.test.js` (e.g. `apps/backend/src/models/__tests__/contactModel.test.js`). Run with `pnpm --filter @casyomax/backend test` (or `pnpm test` from the root via Turborepo). `jest.setup.js` seeds dummy DB env vars; stub the single I/O point (`pool.query`) rather than hitting a real database — see the `contactModel` sample test for the pattern. The legacy ad-hoc `test_*.js` probes at the backend root are NOT Jest specs and are excluded by `testMatch`.
  - **mobile / web** — no runner configured yet. If a slice needs tests here, agree with the user on the framework first (Jest + React Native Testing Library for mobile; Vitest for the Vite web app) and wire up the `test` script before starting the red-green loop
- [ ] Confirm with the user what interface changes are needed
- [ ] Confirm which behaviors to test, in priority order
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] Design interfaces for [testability](interface-design.md)
- [ ] List behaviors to test (not implementation steps)
- [ ] Find prior art — search for similar test patterns in the same app
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm exactly which behaviors matter most. Focus on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet — proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
