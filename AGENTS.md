# Repository Guidelines

## Project Structure & Module Organization
- `attendance-report/` contains the Vite + React 19 app; treat this folder as the working root.
- Route views belong in `src/pages/`, shared UI in `src/components/`, reusable hooks/utilities in `src/lib/`, and Supabase access flows through `src/lib/supabaseClient.js`.
- Static assets live under `public/`; Tailwind globals stay in `src/index.css`; production bundles land in `dist/`.
- Place maintenance SQL scripts at the repository root with a `.sql` extension so they sync with shared environments.

## Build, Test, and Development Commands
- `npm install` hydrates dependencies per environment.
- `npm run dev` starts the local server at http://localhost:5173.
- `npm run lint` enforces `eslint.config.js`.
- `npm run build` generates the optimized bundle.
- `npm run preview` serves the build for smoke testing.

## Coding Style & Naming Conventions
- Favor ES modules, React function components, and two-space indentation.
- Pages, components, and hooks use PascalCase filenames; utilities are camelCase; constants use SCREAMING_CASE.
- Rely on Tailwind utility classes and adjust design tokens via `tailwind.config.js`. Resolve every lint warning and keep imports ordered.

## Testing Guidelines
- No automated suite exists yet; run `npm run lint` and work through `attendance-report/howtotest.md`.
- Add new tests beside components as `ComponentName.test.jsx`, using React Testing Library and mocking Supabase interactions.
- Document any new manual test steps in the checklist before merging.

## Commit & Pull Request Guidelines
- Commits follow emoji-prefixed Korean summaries (e.g., `:sparkles: 기능 요약`) and stay scoped to a single logical change.
- Pull requests should explain the problem, note manual verification (`npm run lint`, `npm run build`, `npm run preview`), and include screenshots or PDFs when UI behavior changes.
- Record Supabase schema or data adjustments in matching `.sql` scripts and coordinate rollouts with the team.

## Security & Configuration Tips
- Load Supabase credentials through Vite environment variables and never commit `.env*` files.
- Rotate leaked keys immediately and update shared SQL helpers to keep environments aligned.
- Treat Supabase policies as code—capture revisions in docs or scripts to maintain reviewer visibility.
