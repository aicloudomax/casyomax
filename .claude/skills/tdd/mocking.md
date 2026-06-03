# Mocking Guidelines

## When NOT to mock

- **Internal collaborators.** If a module calls another module you own, do not mock the collaborator — test through the real call path. Mocking internal collaborators is the #1 source of brittle tests.
- **Pure functions.** No I/O, no state — just call them.
- **In-memory state.** Use a real instance.

## When to mock (or use a test substitute)

- **External services you don't own.** Stripe, Twilio, SendGrid, S3 — mock at the boundary. Pass the external dependency as an injected port; tests provide a mock implementation.
- **Slow or flaky infra.** Use a fast local substitute if one exists (e.g. PGLite for Postgres, in-memory queue for SQS).
- **Network calls to your own services across a boundary.** Define a port (interface), implement an HTTP adapter for production and an in-memory adapter for testing.

## How to mock

Prefer **injection at the constructor or function boundary** over module-level mocking (`jest.mock`, `vi.mock`). Module-level mocking couples tests to import paths; injection couples them only to the interface, which is exactly what you want to test.

```typescript
// GOOD: dependency injected
class PaymentProcessor {
  constructor(private gateway: PaymentGateway) {}
  async charge(amount: number) { return this.gateway.charge(amount); }
}

// In tests:
const processor = new PaymentProcessor(new InMemoryGateway());
```

## Smell check

If your test file has more lines of mocking setup than lines of actual assertion, the design is wrong. Deepen the module or move the test up to a boundary where the real collaborators can run.
