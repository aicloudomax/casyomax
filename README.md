# Casyomax

A pnpm + Turborepo workspace containing the three Casyomax applications
(internally codenamed "CareSync" in the product docs).

```
casyomax/
├── apps/
│   ├── backend/    Express + PostgreSQL API, Azure OpenAI, push reminders
│   ├── mobile/     Expo React Native app — Admin / Caregiver / Patient
│   └── web/        React + Vite marketing site (Home + Privacy Policy)
├── packages/       (reserved for shared code — empty for now)
├── .github/workflows/   Consolidated CI/CD, path-filtered per app
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Prerequisites

- **Node.js ≥ 20** (Node 26 tested)
- **pnpm ≥ 11** — install via `npm install -g pnpm` or `corepack enable`
- **PostgreSQL 14+** with a `caresync` schema, for the backend
- **Expo Go** on a phone *or* Android Studio / Xcode for the mobile app
- An **Azure** subscription with OpenAI, Speech, Communication Services for full functionality

## First-time setup

```bash
pnpm install
```

This installs dependencies for all three apps from the workspace root.

Then create the per-app env files (do **not** commit these):

```bash
cp apps/backend/.env.example apps/backend/.env   # then fill in real values
cp apps/mobile/.env.example  apps/mobile/.env    # set your LAN IP for API_BASE_URL
```

## Running locally

| Command | What it does |
|---|---|
| `pnpm dev:backend` | Starts the Express API on `http://localhost:5000` |
| `pnpm dev:web`     | Starts the marketing site on `http://localhost:5173` |
| `pnpm dev:mobile`  | Starts the Expo dev server (scan QR with Expo Go) |
| `pnpm build:web`   | Production build of the marketing site |
| `pnpm build`       | Runs `build` for every app that defines it (Turborepo) |
| `pnpm lint`        | Runs `lint` for every app that defines it |

Each command can also be run as `pnpm --filter @casyomax/<app> <script>` if you prefer.

## Deployment

CI/CD lives in [`.github/workflows/`](.github/workflows/) and triggers per-app on path-filtered pushes to `main`:

| App | Trigger | Target |
|---|---|---|
| `apps/backend/**`  | push to `main` | Azure App Service `caresync-backend` |
| `apps/web/**`      | push to `main` + PRs | Azure Static Web App `jolly-bay-0b0d3440f` |
| `apps/mobile/**`   | manual `workflow_dispatch` | EAS Build |

See each workflow file for the secrets it expects.

## Environment variables

The backend reads its config from environment variables; see [`apps/backend/.env.example`](apps/backend/.env.example) for the full list. The mobile and web apps use `EXPO_PUBLIC_*` and `VITE_*` prefixed vars respectively.

## Notes

- `node-linker=hoisted` is set in `.npmrc` to keep React Native / Metro happy with pnpm (Metro doesn't play well with strict symlink layouts).
- The `apps/mobile/.env` file in the source repo previously contained a committed Azure Speech key — **rotate that key** before pushing this monorepo anywhere.
