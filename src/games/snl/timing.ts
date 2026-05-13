// All Snakes & Ladders gameplay timings in one place.

export const SNL_TIMING = {
  // Time the 3D dice keeps rolling before its face settles.
  diceSettleMs: 800,

  // Per-cell hop while the token follows the board's S-curve.
  cellStepMs: 90,

  // After the last walk cell, brief settle before snake/ladder branch
  // or win-check fires.
  walkSettleMs: 180,

  // Snake slide is intentionally slower than a ladder climb — feels
  // weightier and gives the user a moment to register the misfortune.
  slideSnakeMs: 850,
  slideLadderMs: 550,

  // Cool-down between the slide ending and the next-player banner.
  postSlideMs: 350,

  // Cool-down between a normal turn ending and the next player.
  turnEndMs: 600,

  // After a "needs 1 to enter" or "stayed at N" — slightly longer so
  // the user can read the message before the turn passes.
  forfeitTurnMs: 700,

  // Overshoot ("need exact roll") pause before next player.
  overshootHoldMs: 600,
} as const;
