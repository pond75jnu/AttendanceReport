# Repository Guidelines

## Project Structure & Module Organization
Work inside `attendance-report/`, the Vite-driven React app. Route views live in `src/pages/` (for example `DashboardPage.jsx` and `ReportPage.jsx`), reusable UI belongs in `src/components/`, and shared Supabase helpers stay in `src/lib/supabaseClient.js`. Static assets load from `public/`, Tailwind customization is in `src/index.css`, and production artifacts land in `dist/`. Keep maintenance SQL scripts beside the project root as `.sql` files.

## Build, Test, and Development Commands
Run `npm install` once per environment. Use `npm run dev` for the hot-reloading dev server at `http://localhost:5173`. Validate lint rules with `npm run lint`, ship builds with `npm run build`, and smoke-test the production bundle via `npm run preview`. Follow `attendance-report/howtotest.md` for manual regression steps.

## Coding Style & Naming Conventions
JavaScript and JSX use ES modules, React 19, and two-space indentation. Components, hooks, and pages follow PascalCase filenames, utilities stay camelCase, and constants use SCREAMING_CASE when necessary. Tailwind utility classes drive layout—prefer configuration updates in `tailwind.config.js` instead of ad-hoc CSS. ESLint is configured through `eslint.config.js`; resolve every warning before committing.

## Testing Guidelines
No automated suite exists yet; rely on linting and the manual walkthrough. When introducing tests, colocate them as `ComponentName.test.jsx` next to the component, prefer React Testing Library, and mock Supabase interactions to avoid touching shared data.

## Commit & Pull Request Guidelines
Commits follow the existing pattern: emoji prefix plus concise Korean summary (e.g., `✨ 기능 요약`). Keep each commit focused on a single change-set. Pull requests should outline the problem, list manual verification steps (including `npm run lint` and `npm run build`), attach screenshots or PDFs for UI assets, and document any Supabase data touched or schema updates.

## Security & Configuration Tips
Load Supabase credentials and other secrets through Vite env variables—never hard-code keys in source. Ignore local `.env*` files in commits and rotate the Supabase anon key if it escapes the team. Coordinate schema changes with the checked-in SQL helpers to keep environments synchronized.
