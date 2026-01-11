# Repository Guidelines

## Project Structure & Module Organization
Work inside `attendance-report/`, the Vite workspace containing `package.json`, `vite.config.js`, and the `src/` tree. Route pages belong in `src/pages/`, shared UI in `src/components/`, and hooks plus utilities in `src/lib/`, keeping Supabase access centralized through `src/lib/supabaseClient.js`. Static assets ship from `public/`, Tailwind globals live in `src/index.css`, build output goes to `dist/`, and SQL migrations or policy scripts stay at the repo root beside `*.sql`; keep manual QA notes synced in `attendance-report/howtotest.md`.

## Build, Test, and Development Commands
- `npm install` — install dependencies; run after pulling main.
- `npm run dev` — start Vite on http://localhost:5173 with hot reload.
- `npm run lint` — executes ESLint via `eslint.config.js`; treat warnings as failures.
- `npm run build` — produce the optimized bundle in `dist/` for preview/deploy.
- `npm run preview` — serve the latest build to sanity-check production behavior.

## Coding Style & Naming Conventions
Use ES modules and React function components with two-space indentation. Keep imports sorted (external packages, aliased paths, relative files), favor Tailwind classes over ad-hoc CSS, and document unusual styling with brief comments. Name pages/components/hooks in PascalCase (`AttendancePage.jsx`), utilities in camelCase (`formatDate.js`), and constants in SCREAMING_CASE; tests mirror their component name plus `.test.jsx`.

## Testing Guidelines
Until automated suites land, every change must pass `npm run lint` and the manual checklist in `attendance-report/howtotest.md`, updating that file whenever behavior shifts. Component-level tests should live adjacent to the source, relying on React Testing Library and mocking Supabase requests via the shared client. When investigating regressions, capture reproduction steps and data fixtures inside the manual checklist for future agents.

## Commit & Pull Request Guidelines
Commits follow emoji-prefixed Korean summaries (e.g., `:sparkles: 출석 보고서 필터 추가`) and limit scope to one logical unit. Pull requests should restate the problem, list manual verification commands (`npm run lint`, `npm run build`, `npm run preview`), and attach screenshots or PDFs for UI adjustments. Document Supabase schema or policy edits with matching `.sql` files and coordinate rollout timing before merge.

## Security & Configuration Tips
Load Supabase credentials strictly through Vite environment variables and never commit `.env*` files; rotate keys immediately if leaked. Treat RLS policies as code—review access paths, ensure least-privilege defaults, and describe any temporary relaxations directly inside the accompanying SQL scripts.
