# Shared project memory

Read this file alongside `AGENTS.md` and `ARCHITECTURE.md` before changing
Ludo Pitara. This is repository-level context for all coding agents;
`CLAUDE.md` points here as well. New explicit user instructions take precedence.

## Product and design decisions

- “For kids” means engaging animation, magical moments, and readable play.
  It does **not** mean childish artwork, smiling characters, easier rules,
  or removing scary snakes and major setbacks.
- The user rejected both bright/light pastel colours (eye strain) and muddy,
  faded colours that made controls look disabled. Keep rich, distinct colours,
  dark surroundings, clear contrast, and readable button text.
- The user explicitly likes the current pointed snake head with angular eyes.
  Preserve it unless asked to change it.
- No floating commentary bubbles for snake bites, ladders, safe squares, etc.
  Movement effects and brief capture/home celebrations are fine. This does not
  prohibit functional dialogs such as exit confirmation or token selection.
- Player cards now contain a name strip, avatar, turn-status label, and dice
  tray. Earlier subtle restyles were not noticeable enough to the user.
- Keep the smaller SNL anchor-number circles and ladder endpoint rings.
- Dice lift, tumble, land, and bounce, ending on the correct face even when
  rolling the same value twice. Keyboard interaction and reduced motion matter.

## First-time player guidance

- User feedback: beginners cannot tell what to do after rolling a six or when
  Ludo is waiting for coin selection. Keep the next action visibly explicit.
- Ludo now has a persistent instruction strip, phase-specific player-card text,
  and steady outlines/arrows on selectable coins. Six instructions distinguish
  yard entry from moving a coin already on the path; automatic/bot moves say to wait.
- Sound feedback calls for subtler effects. The shared audio output is reduced,
  capture uses triangle harmonics, and move/tap envelopes have soft attacks.
- Guidance checked locally at 320×568, 390×844, 430×932, 768×1024, 844×390,
  including keyboard selection and reduced motion. Device listening remains unverified.
  Instructions default on and can be hidden through Settings → Ludo instructions;
  the preference persists. Coin markers and accessible announcements remain available.

## Snakes & Ladders: final placement decision

The user explicitly requested returning to the **original range-based
placement logic with the new looks**. That is the current implementation in
`src/games/snl/generator.ts`; do not reintroduce the discarded preset layouts.

- Seven primary snakes, two possible additional snakes, nine ladder specs.
- One large snake from 98 or 99 to 2–5. Never snakes on both 98 and 99.
- Unique endpoints; no consecutive-number snake heads; cells 1 and 100 reserved.
- These checks constrain endpoints, not complete rendered paths. Do not claim
  the original generator guarantees zero visual crossings.
- Attempts at four curated layouts, broad sweeping routes, fewer snakes, and
  evenly distributed ladder groups were rejected. Their `layouts.ts` was removed.
- Optional `sweeping` geometry remains only for compatibility with games saved
  during that experiment. New games use the original curves. Drawing and slide
  animation must use the same geometry.
- Existing saves retain placement. Start a **new game** to assess generator
  changes; do not clear a user's save without their instruction.

## Responsive layout and timing

- Both game boards must be **square on every device**. SNL's former mobile
  5:6 ratio stretched the cells and artwork; it was removed at the user's request.
- `useLayoutMode` uses side rails when landscape width is at least 640px.
  Test phone portrait, landscape, tablet portrait, and all four player cards.
- Checked viewport sizes: 320×568, 390×844, 430×932, 768×1024, 844×390.
  These are browser viewport checks, not a claim of physical iPhone/iPad testing.
- Walk steps/tweens remain matched at 90ms. Dice animation is 780ms and game
  stores settle rolls at 800ms. SNL `slideDurationMs` is shared between rendering
  and store completion: ladders 550ms, short snakes 850ms, falls ≥45 cells 1450ms.
- Respect reduced motion, including changes while a die is rolling.

## SNL phone proportions

- Screenshot feedback (18 Nov): SNL player cards dominate the board on phones;
  iPad and laptop proportions are already good.
- Portrait phone layout only (<600px): cards are 108px wide, omit the redundant
  avatar, retain name/status and the 40px die, and use tighter spacing. Board
  gutters are 9px; the board remains square. Tablet and wide layouts unchanged.
- Phone name strips use explicit line height and wrap long names instead of
  clipping/ellipsis, following the next mobile screenshot report.
- Checked 320×568, 390×844, 430×932, 768×1024 and 844×390 with four players.
  Publishing includes refreshed screenshots and social preview assets.

## Publishing, previews, and validation

- Production: https://udeshvirk.github.io/ludo-pitara/
- Local Vite preview normally: http://localhost:5173/ludo-pitara/
- GitHub Pages deploys through `.github/workflows/ci.yml` after a push to `main`.
  No Sites hosting migration and no local `npm run deploy` command.
- Published app commits: `750c9cd` (visual/card/dice refresh with original SNL
  placement restored), `4cafce2` (square SNL board on mobile).
- At this handoff, lint, authoritative `npm run build`, and all 65 tests pass.
  Browser checks covered responsive sizing, slides, all six dice results,
  repeated results, keyboard rolling, and reduced motion.
- The user is testing the published app on mobile and iPad. Await actual device
  feedback; do not interpret deployment success as physical-device validation.
- Share cards and install screenshots are separate static assets. UI deployments
  alone do not refresh them. After significant visual changes, refresh all four
  `public/screenshots/` PNGs (585×1266), run `node scripts/gen-og.mjs`, and inspect
  the resulting 1200×630 card before publishing.
- Current refreshed share image: `public/og-image-f053263353.png`, captured
  from the square-board build with the original SNL placement logic.
- The social-card generator versions the image URL by content hash and updates
  Open Graph/Twitter metadata. Keep `og-image*.png` and screenshots out of PWA
  precache. Existing chat messages may retain third-party cached previews;
  a freshly shared URL can be needed to force a fresh page scrape.

## Maintaining this memory

Keep durable preferences here, technical behaviour in `ARCHITECTURE.md`, and
short startup guidance in `AGENTS.md`/`CLAUDE.md`. Update conflicting old notes
when decisions change. Repository files are shared project memory, not a claim
that every agent's private or account-wide memory was changed.
