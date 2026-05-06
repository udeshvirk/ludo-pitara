# Handoff: Ludo Pitara — Offline PWA Game

## Overview
**Ludo Pitara** is an offline-first Progressive Web App that bundles two classic Indian board games — **Ludo** and **Snakes & Ladders** — into a single installable app. No network, no servers, no accounts. Pass-and-play (multiple humans on one device) and solo-vs-CPU modes only.

The user opens the app, picks a game (Ludo or Snakes & Ladders), picks the mode (pass-and-play or vs CPU), picks number of players (2/3/4 for Ludo, 2/3/4 for S&L), enters names, and starts playing.

## About the Design Files
The files in this bundle are **design references created in HTML/React+Babel** — interactive prototypes showing the intended look and feel of every screen. They are **not** production code to copy directly. They run via inline Babel transpilation and use a hand-rolled component system optimized for design iteration, not for shipping.

The task is to **recreate these designs in a real codebase** using a framework of your choice. Recommended stack:
- **React + Vite** (or Next.js with static export) for the PWA
- **TypeScript** for game-state correctness
- **Vanilla CSS / CSS Modules** or **Tailwind** — the visual system is light enough that either works
- **Workbox** for the service worker (offline caching of all static assets)
- **Web Manifest** for installability

If the team already has a preferred framework, use that instead. Game logic should live in pure-function reducers (easy to test); rendering is just a view over that state.

## Fidelity
**High-fidelity (hifi).** All 13 screens are pixel-precise mockups of the final intended UI, including exact colors, typography, spacing, ornaments, and dice/coin/snake/ladder rendering. Recreate the visuals as closely as possible — color values, type ramp, ornaments, and motion specs are all defined here.

What the mockups intentionally **do not** show (and you will need to design/build):
- Game logic (dice rolls, valid moves, capture rules, win conditions)
- Animation timing for piece movement (specs given below; timing tuned during dev)
- Sound effects (synthesized in-browser via WebAudio — see Sound section)
- The settings, rules, and win screens are designed; mode-select sub-states (CPU difficulty pickers, etc.) are not — invent reasonable variants in keeping with the visual system.

## Screens / Views

The design canvas (`Ludo Pitara.html`) lays out all 13 artboards in 4 sections at 390×844 (iPhone 14 portrait). All screens are **portrait mobile** as the primary form factor; desktop should letterbox or scale up the same composition.

### Section 1 — Entry & Menus

#### 01 Splash (`SplashScreen` in screens-menu.jsx)
- **Purpose:** Brand moment, optional auto-advance after ~1.2s.
- **Layout:** Full-bleed festive gradient bg with mandala motifs in corners (gold @ 18% opacity). Centered "Ludo Pitara" wordmark in Fraunces 56–64px, with a small saffron-orange tagline "Two classics. One pitara." underneath. Bottom: small "Tap to begin" hint, dim.

#### 02 Game Select (`GameSelectScreen`)
- **Purpose:** Choose Ludo vs Snakes & Ladders.
- **Layout:** Two large cards stacked vertically (each ~360×220), each with a stylized board preview, the game name in Fraunces, and a 1-line subtitle. Active/hover state lifts with gold border + subtle shadow. Header: "Choose your game" + small back button.

#### 03 Mode (`ModeSelectScreen`)
- **Purpose:** Pass-and-play vs Solo (vs CPU).
- **Layout:** Two cards (icon + title + 2-line description). Pass-and-play shows multiple avatars; Solo shows one human + a stylized CPU silhouette. Bottom: continue button (disabled until selection).

#### 04 Players (`PlayerSetupScreen`)
- **Purpose:** Pick 2/3/4 players, set names + colors.
- **Layout:** Segmented "2 / 3 / 4 players" toggle at top. Below, that many player rows: each row has a colored avatar, an editable name field, and a tap-to-cycle color swatch. Reserved colors (Red, Green, Yellow, Blue) for Ludo; any 2–4 of those for S&L. CTA: "Start game" pill at bottom.

### Section 2 — Ludo Gameplay

#### 05 Ludo Turn idle (`LudoGameScreen` state="turn")
- **Layout:** Top → mini header (back/title/menu) → top half-row with 2 player pods rotated 180° → 358×358 board → bottom half-row with 2 player pods → footer micro-strip ("Undo / [active]'s turn / Menu").
- **Player pods:** Each pod = avatar (38px) + name + status line + dice tile (44×44). Active pod has gold-gradient dice (live), gold accent text, colored glow. Inactive pods: muted dice, dimmed text. Top pods are CSS `transform: rotate(180)`'d so two players sit head-to-head with two on the near side.
- **Board (`LudoBoard`):** Classic 15×15 cross. Four colored 6×6 yards (red/green/yellow/blue). Center triangle home with 4 colored wedges + gold ring. Track squares are cream with brown borders. Star squares (safe spots) marked with tiny gold stars. Yard tokens are round coins (see Token spec).

#### 06 Ludo Rolled (`LudoRolledState`)
- Same layout as 05. Active player's dice tile shows "5" (or whatever was rolled). Eligible pawns on the board pulse with a gold ring (`@keyframes pulse` in the HTML head). Hint text: "Tap a glowing pawn".

#### 07 Ludo Capture moment (`LudoCaptureState`)
- Same layout, plus a centered toast (~320px from top): red-gradient pill, white text "⚔ Capture! Diya sent home". Pop animation: scale 0.8→1.0, 250ms cubic-bezier(.2,.9,.3,1.4), auto-dismiss after 1.6s.

### Section 3 — Snakes & Ladders Gameplay

#### 08 S&L Turn idle (`SnakesGameScreen`)
- **Layout:** Same shell as Ludo. With 3 players, top half-row holds 2 (rotated 180°), the 3rd (active) gets the full bottom horizontal pod. With 2 players, top has 1 / bottom has 1. With 4, top has 2 / bottom has 2.
- **Board (`SnakesLaddersBoard`):** 10×10 grid, 1–100 boustrophedon (1 bottom-left, 10 bottom-right, 11 above 10, …). Cell colors: cream/saffron checker with green-tint highlight on ladder bases and orange tint on snake heads. 6 ladders + 6 snakes drawn as SVG over cells. Tokens drawn at cell centers with a small offset when 2+ tokens share a cell.
- **Snakes:** Bezier curves for body (32% cell width stroke). Body has a gradient (dark → snake green → dark), a soft green belly highlight, and a dashed black "scale" pattern on top. Head is an oval with two yellow slit-pupil eyes, two white triangular fangs, a forked red tongue, and two nostrils. Tail tapers to a small dark dot.
- **Ladders:** Two parallel rails, 3.5px stroke. Rungs perpendicular every ~45% of cell.

#### 09 S&L Rolled (`SnakesRolledState`)
- Active dice tile shows the rolled value. Hint shows "Rolled X · Y → Z".

#### 10 S&L Snake bite (`SnakesSlideState`)
- Same as 09 plus a green pill toast at ~320px from top: "🐍 Snake! 99 → 80". Same animation as the Ludo capture toast.

### Section 4 — Outcome & Settings

#### 11 Victory (`WinScreen`)
- Festive radial bg with confetti SVG bursts in winner's color. Centered: large gold trophy/medal, "{Name} wins!" in Fraunces 36px, subtitle showing turns/captures/time. CTAs: "Rematch" (primary gold) and "Main menu" (ghost). Bottom: small "Share result" link.

#### 12 How to play (`HowToPlayScreen`)
- Tabs at top: "Ludo / Snakes & Ladders". Below, scrollable list of rule cards: each card has an icon (gold round chip), a 1-line title (Fraunces 17px), and 2–3 lines of body copy.
- **Ludo rules:** Need 6 to enter, extra turn on 6, captures send opponent home, exact roll to finish, safe star squares.
- **S&L rules:** Roll, move, ladders go up, snakes slide down, exact 100 to win.

#### 13 Settings (`SettingsScreen`)
- List rows with icon + label + control: sound toggle, animation speed slider (Slow/Normal/Fast), board theme picker (3 swatches), dice style picker (4 swatches), language toggle (English/Hindi), "Reset all stats" destructive button. Footer: "Ludo Pitara v1.0 · made offline".

## Interactions & Behavior

### Game state model
Implement game state as immutable objects updated by reducers:

```ts
type LudoState = {
  players: Array<{ id: string; name: string; color: 'red'|'green'|'yellow'|'blue'; isCPU: boolean; pawns: Array<{ pos: -1 | 0..56 }> }>;
  // pos: -1 = in yard, 0–51 = main track (player-relative), 52–56 = home column, 57 = home
  turn: number; // index into players
  dice: number | null; // last roll, null = needs roll
  rollsLeft: number; // 1, or more if rolled 6 (cap at 3 sixes → forfeit turn)
  movesAvailable: Array<PawnId>; // pawns that can use the current dice
  status: 'idle' | 'rolling' | 'awaiting-move' | 'animating' | 'won';
  winner?: string;
};

type SnLState = {
  players: Array<{ id: string; name: string; color: string; isCPU: boolean; cell: number /* 0=off-board, 1..100 */ }>;
  turn: number;
  dice: number | null;
  status: 'idle' | 'rolling' | 'animating' | 'won';
  winner?: string;
};
```

### Ludo rules (Ludo King classic)
- Each player has 4 pawns starting in their yard (pos = -1).
- Turn: tap dice → roll 1d6.
- Dice = 6: pawn may exit yard onto the player's start square; player gets another roll. Three consecutive 6s = forfeit turn.
- Dice = N (1–5): each pawn already on track may move N steps along its player-relative path.
- Capture: landing on a square occupied by an opponent's pawn (and it's not a star/safe square) sends that pawn back to its yard. Capturer gets another roll.
- Star squares: 8 marked positions on the track + each player's start square — multiple pawns can stack here without capture.
- Home column: 5 squares of player's color leading to the center home triangle. Must roll exact value to enter home (e.g. 3 squares to go = need a 3).
- Win: first to bring all 4 pawns home.

### S&L rules
- Each player starts off-board at cell 0.
- Roll 1d6. First move: cell becomes the rolled number. Subsequent: cell += rolled.
- If new cell is the bottom of a ladder, climb to top.
- If new cell is the head of a snake, slide to tail.
- If cell would exceed 100, stay put (need exact roll).
- Win: first to reach exactly 100.

### Animations
Defaults — make these configurable via Settings → Animation speed:
- **Dice roll:** 600ms tumble (CSS transform with random rotateX/rotateY/rotateZ + scale 0.9→1.05→1.0). Final face shown via opacity crossfade.
- **Pawn move:** 220ms per square traversed, ease-in-out, with a small Y-axis arc (pawn lifts ~8px mid-step). For Ludo, follow the player's path one square at a time.
- **Capture:** Captured pawn fades out at the capture cell (200ms), then teleports + fades in at its yard (300ms). Toast overlay appears as the fade-out completes.
- **Snake slide:** Token follows the snake's bezier curve over 800ms with slight wobble (rotation ±8° sinusoidal).
- **Ladder climb:** Token follows the ladder's straight line over 600ms, scale 1.0→1.1→1.0 to suggest rungs.
- **Win celebration:** Confetti burst + trophy fade-up + 600ms gold ring expanding from center.

### Persistence
- All game state, names, colors, settings persisted in `localStorage` (key `ludopitara.v1.<gameType>` for in-progress games, `ludopitara.settings`, `ludopitara.stats`).
- Resume in-progress game on app open (offer "Continue / New" if a save exists).

## State Management
React + zustand or a single useReducer per game is fine. Keep game logic out of components — pure reducers, selectors for derived state (e.g. `eligiblePawns(state)`).

## Design Tokens

All in `screens-shared.jsx` under `T`. Reproduce as CSS custom properties:

### Colors
```
--bg-deep: #190a2e;
--bg-panel: #2a1248;
--bg-panel-hi: #3a1a5e;
--bg-board: #fbf0d4;
--bg-board-cream: #fff7e1;

--ink: #fff8e7;
--ink-dim: rgba(255, 248, 231, 0.62);
--ink-faint: rgba(255, 248, 231, 0.32);
--ink-on-light: #2a1248;

--gold: #f5b800;
--gold-hi: #ffd966;
--gold-deep: #b07a00;
--saffron: #ff8a3d;
--rose: #e53935;

--p-red: #e53935;
--p-green: #2e9d4f;
--p-yellow: #f5b800;
--p-blue: #1e6fdb;

--snake: #2c8a4a;
--ladder: #c8853a;
```

### Typography
- **Display:** Fraunces (variable, opsz+wght). Weights 400–700, italic supported.
- **UI display (buttons, labels):** Bricolage Grotesque, 500–800.
- **Body:** Plus Jakarta Sans, 400–800.

Type ramp:
- H1 (splash wordmark): Fraunces 56–64px / 1.0 / weight 600
- H2 (screen titles): Fraunces 28px / 1.1 / 600
- H3 (card titles): Fraunces 19px / 1.15 / 600
- Player name: Fraunces 17px / 1.1 / 600
- Body: Plus Jakarta Sans 14–15px / 1.4 / 400–500
- Caption: Plus Jakarta Sans 11px / 1.3 / 600 (often uppercase, letter-spacing 1.5)
- Micro: 9–10px / 1.2 / 700 letter-spacing 1.5 uppercase

### Spacing
4px base unit. Common values: 4, 8, 10, 12, 14, 18, 22, 26, 32. Card radius: 14–22. Pill radius: 999.

### Shadows
- `--shadow: 0 12px 40px rgba(0,0,0,0.45)` (panel)
- `--shadow-sm: 0 4px 14px rgba(0,0,0,0.28)` (small lifts)
- Active dice tile: `0 6px 18px rgba(245,184,0,.45), inset 0 1.5px 0 rgba(255,255,255,.6), inset 0 -2px 0 rgba(0,0,0,.18)`
- Board outer: `0 0 0 4px var(--gold-deep), 0 0 0 6px var(--gold-hi), 0 0 0 9px var(--gold-deep), 0 18px 50px rgba(0,0,0,.55)` (triple-stroke gold frame)

## Components — Detailed Specs

### Token (round coin) — `Token` in screens-shared.jsx
SVG, 32×32 viewBox. Drop shadow ellipse + outer dark rim + radial-gradient face (white@35→color@100) + inner ring stroke + top-left highlight ellipse. When `glow=true`, add a colored radius-15 disc behind it.

### Die — `Die` in screens-shared.jsx
SVG-free CSS die. Linear-gradient white→color face, dot positions hardcoded for 1–6, inset highlights top + bottom.

### Avatar — `Avatar`
Conic gradient gold ring (3px padding) when `ring=true`. Inner: linear-gradient color→color/cc, inset white highlight + dark vignette, single-letter label in Bricolage 700.

### Mandala — `Mandala`
16-petal radial SVG, two outer rings (one dashed), 24 dots on outer arc. Decorative bg ornament @ 18% opacity.

### Snake — `SnakeShape` in screens-snakes.jsx
Bezier body with horizontal gradient + green belly highlight + dashed scale overlay. Head: oval shape with fangs (white triangles), forked red tongue, yellow slit-pupil eyes, nostrils. Spec is in the JSX — port it carefully.

### Ladder — `LadderShape`
Two parallel rails (3.5px) with rungs (2.5px) perpendicular every ~45% cell. Color: `--ladder`.

### LudoBoard — `LudoBoard` in screens-ludo.jsx
15×15 grid (cell = size/15). Four 6×6 colored yards in corners. Cross-arm tracks (3 cells wide, 6 cells out from center) cream + brown grid. Center triangle home: 4 colored wedges meeting at a gold ring. Track squares marked with stars at fixed positions (one per arm). Yard tokens shown as 4 round coins per yard in a 2×2 grid with shadow.

### Sound (synthesized — no audio assets)
Use WebAudio `OscillatorNode` + `GainNode`:
- **Dice tumble:** 600ms of filtered noise (white noise → bandpass 1–3kHz, gain envelope tumble pattern).
- **Pawn move:** Soft "tic" — 60ms sine ping at 800Hz, exponential decay.
- **Capture:** Descending arpeggio C5→G4→C4 over 250ms, sawtooth + lowpass.
- **Win:** Major arpeggio C4-E4-G4-C5 over 600ms, triangle, soft attack.

## Assets
No external assets except Google Fonts (Fraunces, Bricolage Grotesque, Plus Jakarta Sans).
- Mandala / corner ornaments / dice / coin / snake / ladder are **all SVG drawn in code** — no images needed.
- App icon: design a 512×512 + 192×192 PNG of the "Ludo Pitara" mark on a deep purple bg with gold mandala — same visual language as the splash. Use Inkscape/Figma; not in this bundle.
- The `manifest.json` and `sw.js` in this bundle are starter scaffolds — replace with your own (Workbox-generated SW recommended).

## Files in this bundle
| File | What it is |
| --- | --- |
| `Ludo Pitara.html` | Entry — loads all jsx files via Babel and renders the design canvas |
| `screens-shared.jsx` | Tokens, Phone shell, StatusBar, Btn, Header, Die, Token, Avatar, Mandala |
| `screens-menu.jsx` | Splash, GameSelect, Mode, Players, Win, HowToPlay, Settings |
| `screens-ludo.jsx` | LudoBoard, LudoGameScreen + states, PlayerHalfRow, PlayerPod |
| `screens-snakes.jsx` | SnakesLaddersBoard, SnakeShape, LadderShape, SnakesGameScreen + states |
| `design-canvas.jsx` | Pan/zoom canvas component used to lay out artboards (NOT shippable — design tool only) |
| `ios-frame.jsx` | iOS device bezel (NOT shippable — design tool only) |
| `manifest.json`, `sw.js` | Starter PWA scaffolding — replace with your own |

## Recommended implementation order
1. Set up React + Vite + TS + PWA plugin. Get an installable empty shell.
2. Build the design tokens (CSS custom properties) and Fraunces/Bricolage/Jakarta loaded.
3. Build static screens 01–04 (menus). Wire navigation with React Router.
4. Build Ludo board as a pure component over `LudoState`. No interactions yet.
5. Implement Ludo reducer with full rules + unit tests.
6. Wire dice → reducer → board updates with animations.
7. Add CPU AI (simple heuristic: if eligible, prefer captures, else farthest-back pawn).
8. Repeat 4–7 for Snakes & Ladders (much simpler — 1 day).
9. Win screen, settings, sound, persistence.
10. Polish: animations, haptics (`navigator.vibrate`), service worker, app icon, manifest.

Good luck — the design is intentionally festive but restrained. Stay faithful to the deep-purple-and-gold palette and avoid adding more colors. ✨
