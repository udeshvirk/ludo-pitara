# Ludo Pitara — Architecture

A walkthrough of how the codebase is laid out and how the two games actually
play out from "user taps Splash" to "winner modal opens." Read this top-to-bottom
the first time, then dip into individual sections later.

## What this is

A React + TypeScript PWA hosted on GitHub Pages
(`udeshvirk.github.io/ludo-pitara`). Two games — Ludo (4 colours, 4 tokens
each) and Snakes & Ladders (single token, 1–100 board). Single-device
play (pass-and-play) with optional CPU opponents. No server, no
multiplayer, no asset fetches at runtime — sounds are synthesised in
WebAudio so the app works fully offline once installed.

Stack: React 19, Vite 8, Zustand (state), framer-motion (animation),
react-router-dom, vite-plugin-pwa.

## Top-level layout

```
src/
├── App.tsx              ← routes
├── main.tsx             ← React + SW bootstrap
├── pages/               ← one component per route
├── components/ui/       ← shared visuals (Header, Pod, Die, Coin, ...)
├── components/          ← higher-level UI (WinnerModal, InstallPrompt)
├── games/
│   ├── flow/store.ts    ← cross-screen "what is the user setting up?"
│   ├── settings/store.ts← sound / haptics / theme
│   ├── ludo/            ← Ludo rules + UI
│   └── snl/             ← Snakes & Ladders rules + UI
└── lib/                 ← persistence, sound, haptics, stats, hooks
```

## Routes and screen flow

`src/App.tsx`:

| Path | Component | Purpose |
|---|---|---|
| `/` | `Splash` | Brand splash; navigates to `/select` |
| `/select` | `GameSelect` | Pick Ludo or SNL, or resume saved game |
| `/players` | `PlayerSetup` | Count, names, colours, human/CPU per slot |
| `/ludo` | `LudoGame` | Ludo board + pods + winner modal |
| `/snakes-and-ladders` | `SnakesAndLaddersGame` | SNL board + pods |
| `/how-to-play` | `HowToPlay` | Static rules text |
| `/settings` | `Settings` | Sound, haptics, theme |
| `/stats` | `Stats` | Leaderboard + recent games |

The setup pipeline is GameSelect → PlayerSetup → game page. State that
needs to survive across these screens (chosen game, player list) lives
in `useFlow` (`src/games/flow/store.ts`). The game pages read from
`useFlow` once on mount and call the per-game store's `initGame()` to
start. Bots are assigned per-slot inside PlayerSetup via the Human/Bot
toggle on each row — there's no separate "pass-and-play vs CPU" screen.

## State stores

Four Zustand stores. Each one is a singleton; components subscribe via
hooks (`useStoreName(s => s.field)`).

### `useFlow` — cross-screen setup
- `game: 'ludo' | 'snl' | null`
- `players: FlowPlayer[]` (name, colour, isCPU)
- `options: GameOptions` — `{ ludo: { oneTokenOut, firstHomeWins }, snl: { autoStart } }`

Read on the game page's mount effect to bootstrap `initGame` (which
forwards `options.ludo` or `options.snl` into the per-game store).
Cleared when navigating back to `/select`. Options are also persisted
to `lastSetup` so they pre-fill on the next session.

### `useLudoStore` — `src/games/ludo/store.ts`
Holds the entire Ludo game state. Key fields:
- `players: Player[]` — each has 4 tokens with `{state, pathIndex}`
- `currentPlayerIndex: number`
- `gamePhase: 'setup' | 'rolling' | 'selecting' | 'moving' | 'finished'`
- `diceValue: number | null`, `isRolling: boolean`, `hasRolled: boolean`
- `consecutiveSixes: number` — three sixes in a row forfeit the turn
- `selectableTokenIds: string[]` — set during the 'selecting' phase
- `flyingCaptures: CaptureFly[]` — transient, drives the capture-arc
  animation
- `winner: Player | null`
- `options: LudoGameOptions` — `{ oneTokenOut, firstHomeWins }` for the
  current game. `oneTokenOut` flips the slot-0 token to `state: 'active',
  pathIndex: 0` at `initGame` time. `firstHomeWins` short-circuits
  `completeMove` the first time any token reaches home.

Actions: `initGame(playerCount, names, customPlayers, options?)`,
`rollDice`, `selectToken`, `resetGame`.

### `useSNLStore` — `src/games/snl/store.ts`
Same shape, simpler:
- `players: SNLPlayer[]` — each has `position: number` (0–100)
- `gamePhase: 'setup' | 'rolling' | 'moving' | 'finished'`
- `layout: SnakeOrLadder[]` — the per-game randomised snakes/ladders
- `sliding: Slide | null` — transient, drives the snake/ladder slide
  animation
- `diceValue`, `isRolling`, `hasRolled`, `winner`, `message`,
  `lastAction`
- `options: SNLGameOptions` — `{ autoStart }`. When `autoStart` is on,
  `rollDice` skips the "needs a 1 to enter" guard and a position-0
  player lands on cell `diceValue` instead of cell 1.

Actions: `initGame`, `rollDice`, `resetGame`.

### `useSettings` — `src/games/settings/store.ts`
Persistent preferences: `sound`, `haptics`, `animationSpeed`,
`boardTheme`. Mutations propagate to `lib/sound.ts` and `lib/haptics.ts`
so the next call respects the setting.

## Persistence

`src/lib/persist.ts` wraps `localStorage` with a `ludopitara.v1.` prefix.
Three buckets:

| Key | Owner | Lifetime |
|---|---|---|
| `game.ludo`, `game.snl` | game stores | per game; cleared on reset / win |
| `stats` | `lib/stats.ts` | forever (leaderboard + last 10 games) |
| `settings`, `recentNames`, `lastSetup` | UX helpers | forever |

Both game stores subscribe to themselves and write a snapshot on every
state change (`useLudoStore.subscribe(...)`, `useSNLStore.subscribe(...)`).
Transient fields (`isRolling`, `flyingCaptures`, `sliding`) are zeroed
in the snapshot so a refresh mid-animation doesn't restore a broken
in-flight state. `gameSaves.detectSaved()` reads both keys to drive the
"Resume" button on `/select`.

## The Ludo game loop

Files: `src/games/ludo/types.ts` (types), `src/games/ludo/store.ts`
(rules + state), `src/games/ludo/constants.ts` (board geometry,
PLAYER_COLORS, MAIN_PATH, YARD_POSITIONS, isSafePosition,
getBoardPosition), `src/games/ludo/cpu.ts` (CPU heuristic), `src/games/
ludo/components/*` (rendering).

The board: 15×15 grid. Each colour has a 6×6 corner yard, a coloured
home stretch leading to the centre, and a starting cell where its
yard exit meets the main path. The 52-cell main path is `MAIN_PATH`
in constants; per-colour entry points and home-stretch positions are
derived. `getBoardPosition(color, pathIndex)` maps a token's
`pathIndex` (0–55) to the (row, col) on the 15×15 grid.

### A turn, end to end

1. **Dice tap** — User taps the active player's pod (`Pod.tsx` →
   `Die.tsx → onClick → onRoll`). `rollDice()` computes a random 1–6,
   sets `diceValue + isRolling: true`, plays the dice sound, then
   schedules the post-roll handler in 800 ms (the dice cube settles
   in 780 ms).

2. **Post-roll branch** — In the 800 ms timeout:
   - **Three sixes**: forfeit the turn. Set the message, schedule
     the next-player turn-pass in 700 ms.
   - **No selectable tokens** (`getSelectableTokens()` returns `[]`):
     pass the turn in 700 ms.
   - **Exactly one selectable**: auto-select after 400 ms.
   - **Multiple selectable**: enter `gamePhase: 'selecting'` and
     populate `selectableTokenIds`.

3. **Token tap** — In 'selecting', the user taps one of their
   highlighted tokens. `selectToken(tokenId)` runs.

4. **Move walk** — `selectToken` does NOT mutate the token's
   `pathIndex` directly to its final value. Instead it sets
   `gamePhase: 'moving'`, plays the move sound once, and then walks
   the `pathIndex` one cell at a time via a chained
   `setTimeout(..., 90 ms)` loop (`advance()`). framer-motion's
   `layoutId` tweens the coin from cell to cell — combined with the
   step interval, this produces the visible cell-by-cell movement
   along the path. Yard exits are a single hop (yard → start cell;
   no intermediate cells exist on the path).

5. **completeMove** — After the last step + a 120 ms settle, the
   in-line `completeMove()` function runs:
   - Promote the token to its final state (`'home'` if `pathIndex
     >= 56`, else stay `'active'`).
   - **Capture detection** — only on the main path, not safe squares,
     not the home stretch. For every collision, push a `CaptureFly`
     entry into a local list and demote the captured token to
     `state: 'yard'`. If anything captured, `set({ flyingCaptures })`
     immediately and schedule a 520 ms clear.
   - **Finish check** — if the moving player has all 4 tokens home,
     assign their `finishOrder` (1, 2, 3...). If only one player is
     left unfinished, the game is over.
   - **Turn dispatch** — bonus turn (rolled a 6, reached home, or
     captured) keeps the same `currentPlayerIndex`; otherwise advance
     to the next non-finished player after a 600 ms beat.

6. **CPU autoplay** — `LudoGame.tsx` has an effect that watches the
   active player. If they're CPU and `gamePhase === 'rolling'`, it
   calls `rollDice()` after 700 ms. If `gamePhase === 'selecting'`,
   it picks a token via `pickCpuToken()` (`cpu.ts` — heuristic:
   prefer captures > advancing the most-advanced token > yard exit
   > random) and calls `selectToken()` after 600 ms.

### Generation counter (`actionGen`)

Module-level int, bumped at the start of every `rollDice` /
`selectToken` and again on `resetGame`. Each chained `setTimeout`
captures the gen at start and bails (`if (!stillCurrent(myGen))
return;`) before doing work. Without it, a Reset mid-walk or a
mid-animation navigation would race with pending timeouts and clobber
the freshly-cleared state.

## The SNL game loop

Files: `src/games/snl/{types,constants,generator,store}.ts`,
`src/games/snl/components/*`.

The board: a 10×10 grid numbered 1–100 in a serpentine pattern (row 0
goes 1→10 left-to-right, row 1 goes 20→11 right-to-left, etc.).
`rowColToCell` and `cellToRowCol` in `constants.ts` do the conversion.
Snakes and ladders are randomised per game by `generator.ts` and
stored on `state.layout`.

A token has a single `position: number` (0 = pre-board, 1–100 = on
board). The game's animation is just a numeric walk from `currentPos`
to `newPos`.

### A turn, end to end

1. **Dice tap** — `rollDice()` → 800 ms dice settle → continue.

2. **Pre-board entry** — house rule: a player at position 0 must roll
   a 1 to enter. Any other roll forfeits the turn (700 ms beat).

3. **Overshoot check** — if `currentPos + roll > 100`, stay put and
   pass the turn (600 ms).

4. **Snake/ladder lookup** — pre-resolve `finalPos` from
   `buildLayoutLookup(state.layout)` so we know the destination
   *before* the walk, but apply it only after.

5. **Walk** — chained `setTimeout(walk, 90 ms)` increments `position`
   from `currentPos` to `newPos` (one cell per tick). The token's
   `layoutId` tweens between cells; cell-by-cell updates make the
   token follow the serpentine path instead of cutting diagonally.

6. **afterWalk** — once the walk reaches `newPos`:
   - **Win**: `newPos === 100` → finished, play win sound.
   - **Snake/ladder**: set `sliding: { playerId, fromCell, toCell,
     type }`. The board hides the player from cell rendering and
     mounts a `SlidingToken` that animates `left`/`top` along the
     path waypoints (snake = wavy, 850 ms; ladder = linear, 550 ms).
     After the slide settles, snap `position` to `finalPos`, clear
     `sliding`, advance the turn after 350 ms.
   - **Plain landing**: 600 ms beat then advance.

7. **CPU autoplay** — same idea as Ludo, but only auto-rolls (SNL
   has no token selection step).

## The animation system

Three layers, all driven by framer-motion `layoutId`:

### 1. Cell-by-cell walk (both games)

In each game's store, the move action (`selectToken` / `rollDice`)
chains `setTimeout` calls that update the token's `pathIndex` /
`position` one cell at a time. The token component (LudoToken or the
inline coin in SNLBoard) has a `layoutId` like `${tokenId}` or
`snl-token-${id}`. framer-motion sees the layoutId at a new position
on each render and tweens between them.

Step interval: **90 ms**. Token transition: linear tween, **90 ms** —
matched to the step. A longer tween was tried (160 ms) and felt
smoother in isolation, but the running tween was re-aimed before
reaching its target, so the path's corner cells were visually skipped
on a multi-cell walk. Matching duration to the step interval keeps
every cell visible. Defined on the `<motion.button>` (Ludo) and
`<motion.div>` (SNL) as the `transition` prop.

### 2. Snake/ladder slide (SNL)

When `afterWalk` detects a snake/ladder, it switches to a separate
animation:
- **Store**: `state.sliding = { playerId, fromCell, toCell, type }`.
- **Board** (`SNLBoard.tsx`): the slid player is excluded from
  `playerPositions` (no cell-render). A `<SlidingToken />` is mounted
  alongside the SVG snakes/ladders, position: absolute, `left/top`
  keyframe animation through 16 sampled waypoints from
  `snakeGeometry()` (or 9 for a ladder line).
- After the slide duration, the store snaps `position` to `finalPos`
  and clears `sliding`. Cell-render takes over.

### 3. Capture flight (Ludo)

When `completeMove`'s capture detection finds a collision:
- The captured token's state is *immediately* set to `'yard'`
  (consistent game state, no half-finished mutations).
- `flyingCaptures: CaptureFly[]` is also set with `{tokenId, color,
  from, to}` board-grid coords for each capture.
- **Board** (`LudoBoard.tsx`):
  - `yardTokens` excludes any token in `flyingIds`.
  - `<FlyingCaptureToken />` is mounted per fly entry — a one-shot
    motion.div with arc keyframes (start → midpoint lifted by 12% of
    board → yard socket) plus `scale [1, 1.15, 0.85]` and a 360°
    rotate. 500 ms `easeInOut`.
- 520 ms after the capture (just past the arc duration), the store
  clears `flyingCaptures`. Yard render takes over.

## Component hierarchy

`PhoneShell` is the outermost frame on every page — a fluid container
with the cream radial-gradient background and (optionally) decorative
mandalas. `Header` is the row at the top with optional back button and
optional `action` slot (used for `SoundToggle` on game pages).

Game pages render:

```
PhoneShell
├── Header (title, back, SoundToggle)
└── flex column / row container
    ├── Top pod row (PlayerHalfRow)
    ├── Board (LudoBoard / SNLBoard)
    └── Bottom pod row (PlayerHalfRow)
```

`PlayerHalfRow` renders the relevant pods for that side. Both Ludo and
SNL versions use the shared `Pod` (`src/components/ui/Pod.tsx`):

- `Pod` = avatar + die in a bordered card, with active-state border
  glow and the gold turn-arrow chevron rendered *outside* the card
  when active.
- `Die` = real CSS 3D cube — six faces translated along their outward
  normals, animated with `rotateX`/`rotateY` to land showing the
  rolled face plus 720° of extra tumble. `transformPerspective`
  applies depth.
- `Coin` = the metallic SVG token used in both games. Exports a
  `stackPlacement(stackSize, stackIndex)` helper so tokens fan out
  diagonally when ≥ 2 share a cell.
- `StackCountBadge` = the small black numeric pill in the cell's
  top-right when ≥ 2 tokens overlap.

Board sizing: each game page hard-codes a viewport-calc that picks
`min(viewport-width budget, viewport-height budget)` so the board
fits exactly between the pod rows. No flex-1 wrappers — pods sit
flush against the board.

## Sound and haptics

`src/lib/sound.ts` — all sounds are synthesised in WebAudio at call
time. No assets. Functions: `playDice` (clatter), `playMove` (sine
ping), `playCapture`, `playSnake`, `playLadder`, `playWin`,
`playHomeArrival`, `playTap`. Each one builds an `AudioBufferSource` /
`OscillatorNode` chain with a short envelope and disposes immediately.
The AudioContext is unlocked on the first user gesture (iOS Safari
quirk handled in module init).

`src/lib/haptics.ts` — Vibration API with named patterns. Both modules
honour `useSettings.sound` / `useSettings.haptics`.

## Stats

`src/lib/stats.ts` — single localStorage blob with two parts:
- `byGame.ludo.byPlayer` and `byGame.snl.byPlayer` — `{name → {games,
  wins}}`. `leaderboardFor(game)` returns sorted by wins → win-rate →
  games.
- `recent: RecentGame[]` — capped at 10, newest first.

`recordGame(game, players, winner)` is called once per game when
`gamePhase` flips to `'finished'`. The shared
`useRecordOnFinish('ludo' | 'snl', finished, names, winnerName)` hook
encapsulates the dedupe-via-ref pattern, used in both
`LudoGame.tsx` and `SnakesAndLaddersGame.tsx`.

## PWA

`vite-plugin-pwa` generates a service worker (Workbox) that precaches
every built asset, so the app loads instantly offline. `main.tsx`
registers the SW. The icons (`pwa-192x192`, `pwa-512x512`,
`apple-touch-icon`) are generated at prebuild from
`scripts/gen-icons.mjs`. `InstallPrompt.tsx` shows the "Add to home
screen" CTA when the browser fires `beforeinstallprompt`.

## Build / deploy

```
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve dist/
npm run deploy     # gh-pages -d dist (pushes to gh-pages branch)
```

`homepage` in `package.json` and `base` in `vite.config.ts` keep paths
consistent with the GitHub Pages subpath. The deploy command publishes
to the `gh-pages` branch which GitHub Pages serves.

## Common change recipes

- **Add a sound** — write a new `play*` function in `lib/sound.ts`,
  call it from the game store at the moment.
- **Tweak movement speed** — step interval lives in the `setTimeout`
  inside the walk loop in each store (Ludo: `selectToken`; SNL:
  `rollDice`'s walk). Token tween is the `transition` prop on the
  motion element in `Token.tsx` / `SNLBoard.tsx`.
- **Tweak the capture arc** — `FlyingCaptureToken` in `LudoBoard.tsx`
  (peak height, scale, rotation, duration). Game-state side has the
  matching `setTimeout` clear in `store.ts → completeMove`.
- **Add a new screen** — new component in `pages/`, register in
  `App.tsx`. Use `PhoneShell` + `Header` for chrome.
- **Add a new game state field** — extend the type in
  `games/ludo/types.ts` (or snl), seed it in `initialState`, set it
  in `initGame` / `resetGame`, and decide whether the persist
  subscriber should snapshot it (transient fields are zeroed there).
- **Change a delay** — common ones are: 800 ms dice settle (rollDice
  setTimeout), 600 ms turn-pass beat, 700 ms no-moves / three-sixes
  beat, 520 ms capture-arc, 850 / 550 ms snake / ladder slide.

## Things I'd flag for future-me

- The two game stores duplicate the turn-end / persist-snapshot
  patterns. Could share a small turn-end helper but the rules diverge
  enough that splitting was rejected.
- No tests yet. Highest-leverage targets: `getSelectableTokens`,
  `findNextActivePlayer`, capture detection, snake/ladder lookup,
  six-streak.
- `LudoBoard.tsx` is ~480 lines. Splitting into Board + Yards +
  Centre would be cleaner.
- The animation system uses three different positioning strategies
  (cell-grid, slide-on-path, fly-on-arc). Each uses `layoutId` /
  `keyframes` differently — consolidating would risk breaking the
  visual feel that's already tuned.
