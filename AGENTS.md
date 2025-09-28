# Repository Guidelines

## Project Structure & Module Organization
The Vite + React 19 app lives under `attendance-report/`. Use `src/pages/` for route views, `src/components/` for shared UI, `src/lib/` for hooks/utilities, and `src/lib/supabaseClient.js` as the single Supabase entrypoint. Static assets stay in `public/`; Tailwind globals in `src/index.css`; production bundles land in `dist/`. Place maintenance SQL scripts at the repository root with a `.sql` extension so they sync with shared environments.

## Build, Test, and Development Commands
Run `npm install` once per environment to hydrate dependencies. Use `npm run dev` for the localhost server at http://localhost:5173, `npm run lint` to enforce `eslint.config.js`, `npm run build` to produce the optimized bundle, and `npm run preview` to smoke-test the build output.

## Coding Style & Naming Conventions
Stick to ES modules, React function components, and two-space indentation. Pages, components, and hooks use PascalCase filenames; utilities stay camelCase and constants use SCREAMING_CASE. Favor Tailwind utility classes; adjust design tokens via `tailwind.config.js` instead of ad-hoc CSS. Resolve every lint warning before committing, and format imports consistently.

## Testing Guidelines
There is no automated suite yet; rely on `npm run lint` plus the manual checklist in `attendance-report/howtotest.md`. When adding tests, colocate `ComponentName.test.jsx` beside the component, leverage React Testing Library, and mock Supabase calls to avoid live data mutations. Document new testing steps in the checklist when relevant.

## Commit & Pull Request Guidelines
Follow the repo convention of emoji-prefixed Korean summaries (example: `:sparkles: 기능 요약`). Keep each commit scoped to one logical change and stage deliberately. Pull requests should describe the problem, note manual verification (`npm run lint`, `npm run build`, `npm run preview`), and attach UI screenshots or PDFs whenever they clarify behavior. Record Supabase schema or data adjustments in matching `.sql` scripts and coordinate rollouts.

## Security & Configuration Tips
Load Supabase credentials and secrets through Vite environment variables; never commit `.env*` files. Rotate keys immediately if exposed and update the shared SQL helpers so all environments stay aligned. Treat Supabase policies as code—capture revisions in docs or scripts to keep reviewers informed.
