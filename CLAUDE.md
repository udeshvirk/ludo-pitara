# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ludo Pitara — a React 19 + TypeScript + Vite PWA hosted on GitHub Pages
(`udeshvirk.github.io/ludo-pitara`). Two single-device games: Ludo and
Snakes & Ladders, with optional CPU opponents. No backend, no runtime
network calls — sounds are synthesised in WebAudio so the app is fully
offline once installed.

Stack: React 19, Vite 8, Zustand, framer-motion, react-router-dom,
vite-plugin-pwa, Tailwind 4.

Licensed MIT (see `LICENSE`). Public repo, intentionally permissive —
fine to suggest changes that broaden adoption (e.g. better docs,
shareable links) without worrying about leaking proprietary IP.

## Commands

```bash
npm run dev                # Vite dev server
npm run build              # tsc -b && vite build → dist/  (the pre-push gate)
npm test                   # vitest run (full suite, ~300 ms)
npm run test:watch         # vitest watch
npm test -- src/lib/persist.test.ts   # run a single test file
npm run lint               # eslint .
npm run preview            # serve dist/
```

`npm run build` is the authoritative type-check. **Do not substitute
`tsc --noEmit`** — the project uses `tsc -b` (project references) which
is stricter and catches `noUnusedLocals` / unused imports that
`--noEmit` lets through. Run `npm run build` before pushing.

Pre-commit hook (`.husky/pre-commit`) runs `lint-staged` (eslint --fix
on staged `.ts/.tsx`) and `npm test`. The CI workflow
(`.github/workflows/`) runs lint + test + build on every PR and pushes
to main, and only deploys to GitHub Pages on push to main (not from PRs
or `npm run deploy` — there is no `deploy` script anymore).

## Architecture

`ARCHITECTURE.md` in the repo root is the authoritative tour — read it
before making non-trivial changes. Highlights worth knowing up front:

- **State**: four Zustand stores. `useFlow` (cross-screen setup —
  chosen game, players, options), `useLudoStore`, `useSNLStore`,
  `useSettings`. Each game store subscribes to itself and snapshots
  to `localStorage` under the `ludopitara.v1.` prefix (`src/lib/persist.ts`).
  Transient fields (`isRolling`, `flyingCaptures`, `sliding`) are zeroed
  in the snapshot so a refresh mid-animation can't restore a broken
  in-flight state.
- **Setup pipeline**: `Splash → GameSelect → PlayerSetup → game page`.
  Game pages read `useFlow` on mount and call the per-game store's
  `initGame()`. Bots are per-slot via the Human/Bot toggle on each
  PlayerSetup row.
- **Code layout**: each game lives in `src/games/<game>/` — `store.ts`
  (Zustand + chained-timeout animation), `types.ts`, `constants.ts`,
  `timing.ts`, `components/`. Ludo's rules are pure functions in
  `moves.ts` (move outcome, captures, game-over) and `cpu.ts`
  (`pickCpuToken`), which is where the unit tests live; keep new rule
  logic there rather than in the store. Route pages are in `src/pages/`.
- **Dice mode** (`/dice`, `src/pages/DiceGame.tsx`) is a standalone
  tap-to-roll die with local component state only — no store, no
  `useFlow`, no persistence. `GameId` in `useFlow` is still just
  `'ludo' | 'snl'`.
- **Game-rules options system**: per-game toggles
  (`ludo.oneTokenOut`, `ludo.firstHomeWins`, `ludo.cpuDifficulty`,
  `ludo.partners`, `snl.autoStart`; types + `DEFAULT_OPTIONS` in
  `src/games/flow/store.ts`) live on
  `useFlow.options`, are forwarded into the per-game store at
  `initGame` time, and are persisted to `lastSetup` so they pre-fill on
  the next session. When adding a new option, thread it through all
  four points (FlowPlayer types → useFlow → initGame signature → store
  field) and update the PlayerSetup UI.
- **Ludo partner mode** (`ludo.partners`): forces 4 seats in two
  diagonal teams (blue+green vs red+yellow). A seat's `team` is set
  only when partners is on, so store code checks
  `player.team !== undefined`. On its turn a team may move either
  colour; teammates' tokens are friendly (no capture), the team wins
  only with all 8 tokens home, and `firstHomeWins` is ignored.
  When teammate tokens of different colours share a cell and both can
  move, tapping the cell opens a colour-picker popup (`LudoCells.tsx`).
- **Animation = cell-by-cell walk + framer-motion `layoutId`**. The
  move action chains `setTimeout(..., 90 ms)` updates to `pathIndex` /
  `position` one cell at a time. `layoutId` tweens the motion element
  between renders. **The tween duration on the motion element must
  match the step interval (90 ms)** — longer durations look smoother
  in isolation but visually cut corners on multi-cell walks because
  the tween is re-aimed before reaching its target. Both are linear.
  All gameplay delays are named constants in `src/games/<game>/timing.ts`
  (`LUDO_TIMING.cellStepMs` etc.) — change them there, not inline.
- **`actionGen` generation counter** (Ludo store): module-level int
  bumped on `rollDice` / `selectToken` / `resetGame`. Every chained
  `setTimeout` captures the gen at start and bails before doing work
  if it's stale. Without it, Reset mid-walk or mid-animation navigation
  races with pending timeouts. If you add a new chained-setTimeout
  flow, gate it with `stillCurrent(myGen)` too.
- **Three animation layers** — cell walk, snake/ladder slide (SNL),
  capture-arc flight (Ludo). Each uses `layoutId` / `keyframes`
  differently and is tuned to feel right; consolidating risks
  regressing the feel.
- **Stats**: `src/lib/stats.ts` — single localStorage blob with
  per-game `byPlayer` maps and a capped `recent` list. The shared
  `useRecordOnFinish` hook handles the once-per-game dedupe.

## Conventions and gotchas

- **Visual conflicts: fill, don't hide.** When a colour/identity
  collision happens (e.g. an empty Ludo yard, a name clash), substitute
  or randomize the conflicting element rather than hiding it. Keep the
  visual real-estate filled.
- **English-only UI**; no status pill on the active player; coin tokens
  (not pawn-shape); default colour order is fixed; CPU players are
  named "Bot N".
- **Layout sizing**: `useLayoutMode` (`src/lib/useLayout.ts`) drives
  breakpoints; game pages use a height-primary aspect-ratio calc so the
  board fits exactly between the pod rows (no `flex-1` wrappers).
- Sounds are WebAudio-synthesised in `src/lib/sound.ts`. To add a
  sound, write a `play*` function there and call it from the relevant
  game store at the appropriate moment.
- The PWA service worker is generated by `vite-plugin-pwa` at build
  time; icons are pre-generated by `scripts/gen-icons.mjs` via the
  `prebuild` script.
- `/#/install` is the public install guide shared on social media
  (platform detection in `lib/install.ts`). The social preview card
  `public/og-image.png` is regenerated by hand with
  `node scripts/gen-og.mjs` after refreshing `public/screenshots/`.
