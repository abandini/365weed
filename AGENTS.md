# Repository Guidelines

## Project Structure & Module Organization
- `worker/` houses the Cloudflare Worker entry (`index.ts`), modular routers in `routes/`, queue consumers, and shared helpers in `lib/` and `types.ts`.
- `app/` is the React PWA (Vite + Tailwind); source lives in `src/`, static assets in `public/`, and build config in `vite.config.ts`.
- `migrations/` keeps Cloudflare D1 SQL files; generate them with Wrangler and commit alongside schema updates.
- `tests/e2e/` contains Playwright specs; purge `playwright-report/` artifacts before committing, and reuse seeds from `worker/seed/`.

- `npm run dev` boots the Worker locally with Miniflare bindings; pair it with `npm run app:dev` on `localhost:5173`.
- `npm run dev:remote` proxies to Cloudflare for staging parity after secrets and migrations are synced.
- `npm run app:build` outputs the production bundle, and `npm run deploy` pushes the Worker defined in `wrangler.toml`.
- `npm test` runs Vitest in the workers pool; keep specs deterministic and side-effect free.
- `npm run test:e2e` launches Playwright runs in `tests/e2e/` for end-to-end verification.

## Coding Style & Naming Conventions
- Write TypeScript everywhere with 2-space indentation and named exports for shared utilities.
- Use `camelCase` for variables, `PascalCase` for React components/Zod schemas, and `SCREAMING_SNAKE_CASE` solely for environment bindings.
- Keep Worker route handlers small; extract reusable logic into `worker/lib/` and colocate React hooks/components by feature.
- Tailwind utilities stay inline; extracted styles belong in `app/src/styles` with shared tokens noted in code comments when needed.

## Testing Guidelines
- Store Worker unit specs beside implementations (e.g., `worker/routes/foo.spec.ts`) and gate merges on `npm test`.
- Maintain deterministic fixtures via `worker/seed/` when writing Playwright specs in `tests/e2e/*.spec.ts`.
- Flag any remaining gaps for critical flows (subscriptions, push, ads) in pull requests and attach relevant Playwright output.

## Commit & Pull Request Guidelines
- Follow conventional commits (`feat:`, `fix:`, `docs:`) as established in history and limit each commit to one concern.
- Reference related tickets, describe before/after behavior, and attach curl snippets or screenshots for visible changes.
- PRs must list executed commands (`npm test`, `npm run test:e2e`), call out migration files, and flag new or altered env bindings.

## Configuration & Secrets
- Manage bindings in `wrangler.toml`; never commit raw keys—use Wrangler secrets or the Cloudflare dashboard.
- Apply D1 changes with `npm run migrations:apply` locally and `npm run migrations:apply:prod` remotely, then verify via `wrangler d1`.
- Document new queues or durable objects in `DEPLOYMENT.md` so code and infrastructure stay aligned.
