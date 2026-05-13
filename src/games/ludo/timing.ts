// All Ludo gameplay timings in one place. Names describe what the
// delay is FOR, not how long it is, so a future visual tweak doesn't
// require chasing magic numbers across the store.

export const LUDO_TIMING = {
  // Time the 3D dice keeps rolling before its face settles into place.
  // The token-walk logic waits this long before checking selectable
  // tokens or auto-moving the only legal one.
  diceSettleMs: 800,

  // Per-cell hop while a token walks its path. MUST match the Token
  // motion tween duration in Token.tsx (currently 0.09 s) — a longer
  // tween would skip over corner cells (the next step retargets the
  // running tween before it reaches the previous cell).
  cellStepMs: 90,

  // Brief settle pause after the last walk cell so the final position
  // visibly registers before capture/turn-end side effects fire.
  walkSettleMs: 120,

  // Auto-move delay when only one token is legal (no user choice needed).
  autoSelectMs: 400,

  // Captured-token arc duration: how long the flying-token motion.div
  // lives before its yard render takes over.
  captureFlyMs: 520,

  // Cool-down between a turn ending and the next-player banner. A bit
  // of pause keeps captures / 6-bonuses readable.
  turnEndMs: 600,

  // "Three 6s in a row" / "No valid moves" → next player. Slightly
  // longer than turnEndMs so the user can read the message.
  forfeitTurnMs: 700,
} as const;
