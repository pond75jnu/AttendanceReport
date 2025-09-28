# Repository Guidelines

## Project Structure & Module Organization
- Main app lives in `attendance-report/` (Vite + React 19).
- Route views sit in `src/pages/` (e.g., `DashboardPage.jsx`, `ReportPage.jsx`).
- Shared UI belongs in `src/components/`; hooks and utilities stay in `src/lib/`.
- Supabase client logic resides in `src/lib/supabaseClient.js` to centralize auth and queries.
- Static assets load from `public/`; Tailwind tweaks live in `src/index.css`; builds output to `dist/`.
- Place maintenance SQL scripts beside the project root as `.sql` files for easy syncing.

## Build, Test, and Development Commands
- `npm install` — install dependencies once per environment.
- `npm run dev` — hot-reload dev server at `http://localhost:5173` for local iteration.
- `npm run lint` — enforce ESLint rules defined in `eslint.config.js`.
- `npm run build` — produce the optimized bundle.
- `npm run preview` — serve the production build for smoke testing.

## Coding Style & Naming Conventions
- Use ES modules, two-space indentation, and React function components.
- Components, hooks, and pages follow PascalCase filenames; utilities stay camelCase; constants use `SCREAMING_CASE` when needed.
- Favor Tailwind utility classes; adjust global tokens via `tailwind.config.js` instead of ad-hoc CSS.
- Resolve every lint warning and double-check formatting before pushing.

## Testing Guidelines
- No automated suite yet; rely on `npm run lint` plus the manual checklist in `attendance-report/howtotest.md`.
- When adding tests, colocate `ComponentName.test.jsx` beside the component and use React Testing Library.
- Mock Supabase calls to avoid real data mutations and keep runs deterministic.

## Commit & Pull Request Guidelines
- Follow the repository pattern: emoji prefix + concise Korean summary (e.g., `✨ 기능 요약`).
- Keep commits scoped to a single logical change; stage granularly.
- PRs should describe the problem, note manual verification (`npm run lint`, `npm run build`, `npm run preview`), and attach UI screenshots or PDFs when relevant.
- Document any Supabase schema or data touches and coordinate updates via the checked-in SQL scripts.

## Security & Configuration Tips
- Load Supabase credentials and other secrets through Vite environment variables; never commit `.env*` files.
- Rotate keys immediately if exposed and update the shared `.sql` helpers to align environments.
