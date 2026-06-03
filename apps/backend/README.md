# @casyomax/backend

Express + PostgreSQL API for Casyomax. Integrates Azure OpenAI/Speech, email
(Azure Communication Services), and Expo push reminders.

Source lives under `src/` (`config`, `controllers`, `middleware`, `models`,
`routes`, `services`, `utils`); scheduled work under `jobs/`. Entry point is
`server.js`.

## Running locally

```bash
pnpm dev:backend            # from the repo root — starts the API on :5000
# or
pnpm --filter @casyomax/backend start
```

Copy `.env.example` to `.env` and fill in real values first.

## Testing

Tests use **Jest** (CommonJS, no babel transform).

```bash
pnpm --filter @casyomax/backend test         # run once
pnpm --filter @casyomax/backend test:watch    # watch mode
pnpm test                                      # all apps, via Turborepo (from root)
```

Conventions:

- Specs live in `__tests__/` folders next to the code, named `*.test.js`
  (e.g. `src/models/__tests__/contactModel.test.js`).
- `jest.setup.js` seeds dummy `DB_*` env vars so modules that read `process.env`
  at import time (like `src/config/db.js`) load without a real database.
- Don't hit a real DB. Stub the single I/O point — `pool.query` — and assert on
  what callers observe through the public function. See `contactModel.test.js`
  for the pattern.
- The ad-hoc `test_*.js` / `test-*.js` scripts at the app root are legacy
  run-by-hand probes, **not** Jest specs — they're excluded by `testMatch`.
