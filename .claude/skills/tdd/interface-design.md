# Interface Design for Testability

A testable interface is one where you can verify the behavior you care about WITHOUT reaching past the interface.

## Principles

### 1. Inputs and outputs over side effects

Prefer functions that take inputs and return outputs over functions that mutate hidden state. Pure functions are trivially testable.

```typescript
// HARD to test — mutates internal state
class Counter { private n = 0; increment() { this.n++; } }

// EASY to test — returns new state
const increment = (n: number) => n + 1;
```

### 2. Inject dependencies at the boundary

If a module needs a database, queue, or external API, take it as a constructor/function parameter. Then tests can pass an in-memory substitute. See [mocking.md](mocking.md).

### 3. Return rich results, not booleans

A function that returns `true`/`false` for "did it work?" gives the test nothing to assert on. Return the result object — the test can then verify behavior.

### 4. Make state observable through the same interface that mutates it

If you can `createUser`, you should be able to `getUser`. Don't make tests bypass the interface to verify state — that couples them to implementation.

### 5. Single responsibility per method

A method that does five things requires tests that set up five scenarios. Split it.

## Red flags

- The interface forces tests to import private helpers
- Tests need to read the database directly to verify
- Tests need to spy on internal method calls to verify behavior
- Verifying success requires inspecting logs or counters
