# Repository Guidelines

## Shared Agent Context

Read `MEMORY.md` for the user’s current preferences and final decisions, and
`ARCHITECTURE.md` before substantial changes. Keep this shared memory current.

- Preserve the original SNL range-based placement logic with the new artwork.
- Keep both boards square on phones and tablets.
- Magic and animation should not make the game childish, easier, or pastel.
- Preserve the current snake head; avoid floating event-commentary popups.
- Refresh screenshots and the social preview card when publishing visual changes.


## Project Structure & Module Organization

Ludo Pitara is an offline React 19 + TypeScript PWA with Ludo, Snakes & Ladders, and standalone Dice mode.

- `src/pages/`: route screens; routes are registered in `src/App.tsx`.
- `src/games/ludo/` and `src/games/snl/`: game rules, Zustand stores, types, timing constants, and board components.
- `src/games/flow/` and `src/games/settings/`: setup and preferences stores.
- `src/components/`: shared UI; reusable visual primitives live in `ui/`.
- `src/lib/`: persistence, stats, sound, haptics, and hooks. Tests sit beside source files.
- `public/`: static icons, screenshots, and social assets; `scripts/` generates icons and preview imagery.
- `design_handoff_ludo_pitara/`: design references. Read `ARCHITECTURE.md` before substantial changes.

## Build, Test, and Development Commands

Use Node.js 22, matching CI, and install dependencies with `npm ci`.

- `npm run dev`: start the Vite development server.
- `npm run build`: generate icons, type-check with `tsc -b`, and build into `dist/`. Use this as the authoritative type-check.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint.
- `npm test`: run the full Vitest suite once.
- `npm run test:watch`: watch tests during development.
- `npm test -- src/games/ludo/moves.test.ts`: run one test file.

## Coding Style & Naming Conventions

Follow existing TypeScript style: two-space indentation, single quotes, and surrounding semicolon conventions. Use PascalCase component filenames, camelCase helpers, and `use*` hook names. Prefer explicit type imports. ESLint checks TypeScript, React Hooks, and Fast Refresh; Husky runs staged ESLint fixes and tests before commits.

Keep game rules in pure helpers rather than UI or store orchestration. Define gameplay delays in each game's `timing.ts`. Preserve offline operation and self-hosted fonts.

## Testing Guidelines

Vitest uses the Node environment with explicit imports. Colocate descriptive `*.test.ts` files; `*.spec.ts` and TSX equivalents are also supported. Cover rule edge cases, board generation, and persistence regressions. No coverage threshold is configured. Manually check responsive layouts and animations for visual changes.

## Commit & Pull Request Guidelines

Use concise, imperative commit subjects, following history: `Fix clipped header buttons and board frame`. Optional scope prefixes such as `Docs:` are used.

PRs should describe the change, link relevant issues, report validation, and include screenshots for UI changes. Run lint, tests, and build before submitting. CI repeats these checks; pushes to `main` deploy to GitHub Pages.
