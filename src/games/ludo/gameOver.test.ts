import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// jsdom-free shims. Sound + haptics modules are stubbed entirely so
// their top-level `addEventListener` / `navigator.vibrate` calls don't
// blow up under node. localStorage is provided via a minimal shim so
// the persist subscribe writer doesn't crash either.
vi.mock('../../lib/sound', () => ({
  playDice: () => {},
  playMove: () => {},
  playCapture: () => {},
  playHomeArrival: () => {},
  playWin: () => {},
  playTap: () => {},
  playSnake: () => {},
  playLadder: () => {},
  setSoundEnabled: () => {},
}));
vi.mock('../../lib/haptics', () => ({
  haptics: {
    tap: () => {}, diceRoll: () => {}, capture: () => {}, win: () => {},
  },
  setHapticsEnabled: () => {},
}));

class FakeStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

beforeEach(() => {
  // @ts-expect-error attaching window.localStorage shim for node test env
  globalThis.window = { localStorage: new FakeStorage(), addEventListener: () => {}, removeEventListener: () => {} };
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Drive the store synchronously by flushing all timers between steps.
async function driveSelectToken(store: ReturnType<typeof import('./store').useLudoStore.getState>, tokenId: string) {
  store.selectToken(tokenId);
  // The walk fires per-cell setTimeouts (90 ms each) + settle (120 ms).
  // Drain all of them in one go.
  await vi.runAllTimersAsync();
}

describe('Ludo game-over orchestration (3 players)', () => {
  it('ENDS immediately when the first player brings all four tokens home (standard Ludo)', async () => {
    const { useLudoStore } = await import('./store');
    const store = useLudoStore.getState();
    store.resetGame();

    // 3 players. Pre-load each with 3 tokens already in 'home' so a
    // single move can finish the player. Tokens 0/1/2 are home, token
    // 3 sits at pathIndex 55 ready to move 1 → home.
    store.initGame(3, ['Alice', 'BotOne', 'BotTwo'], [
      { name: 'Alice',  color: 'blue',  displayColor: 'blue',  isCPU: false },
      { name: 'BotOne', color: 'red',   displayColor: 'red',   isCPU: true },
      { name: 'BotTwo', color: 'green', displayColor: 'green', isCPU: true },
    ]);

    // Patch the players so each has 3 tokens home + 1 at pathIndex 55.
    const stage = (color: 'blue' | 'red' | 'green') => ({
      tokens: [0, 1, 2, 3].map((i) => i < 3
        ? { id: `${color}-${i}`, color, displayColor: color, state: 'home' as const, pathIndex: 56 }
        : { id: `${color}-${i}`, color, displayColor: color, state: 'active' as const, pathIndex: 55 }),
    });
    useLudoStore.setState({
      players: useLudoStore.getState().players.map(p => ({ ...p, ...stage(p.color as 'blue' | 'red' | 'green') })),
      currentPlayerIndex: 1, // BotOne goes first
      gamePhase: 'selecting',
      diceValue: 1,
      hasRolled: true,
      selectableTokenIds: ['red-3'],
    });

    // BotOne moves the last token home → finishes → game over.
    await driveSelectToken(useLudoStore.getState(), 'red-3');

    const after = useLudoStore.getState();
    expect(after.gamePhase).toBe('finished');
    expect(after.players[1].finishOrder).toBe(1);
    expect(after.winner?.name).toBe('BotOne');
  });

  // Full-flow regression: roll → auto-select → walk → complete. With
  // the standard Ludo rule, the very first player to bring all four
  // tokens home wins — the game ends before subsequent players even
  // get a turn.
  it('drives rollDice → auto-select → completeMove and ends on the FIRST finisher', async () => {
    const { useLudoStore } = await import('./store');
    useLudoStore.getState().resetGame();
    useLudoStore.getState().initGame(3, ['Alice', 'BotOne', 'BotTwo'], [
      { name: 'Alice',  color: 'blue',  displayColor: 'blue',  isCPU: false },
      { name: 'BotOne', color: 'red',   displayColor: 'red',   isCPU: true },
      { name: 'BotTwo', color: 'green', displayColor: 'green', isCPU: true },
    ]);

    const stage = (color: 'blue' | 'red' | 'green') =>
      [0, 1, 2, 3].map((i) => i < 3
        ? { id: `${color}-${i}`, color, displayColor: color, state: 'home' as const, pathIndex: 56 }
        : { id: `${color}-${i}`, color, displayColor: color, state: 'active' as const, pathIndex: 55 });
    useLudoStore.setState({
      players: useLudoStore.getState().players.map(p => ({
        ...p,
        tokens: stage(p.color as 'blue' | 'red' | 'green'),
      })),
      currentPlayerIndex: 1,
      gamePhase: 'rolling',
      diceValue: null,
      hasRolled: false,
      selectableTokenIds: [],
    });

    const rngSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // dice = 1

    useLudoStore.getState().rollDice();
    await vi.runAllTimersAsync();
    const after = useLudoStore.getState();
    expect(after.gamePhase).toBe('finished');
    expect(after.players[1].finishOrder).toBe(1);
    expect(after.winner?.name).toBe('BotOne');

    rngSpy.mockRestore();
  });

  // Multi-turn regression: 3 players, each starts with 1 token already
  // home and 3 tokens at pathIndex 50. Force every roll to be 6 so each
  // token completes the path with stepsCount=6 → home. Drives the
  // store turn-by-turn (rolling → auto-select → walk → complete) until
  // someone wins. Catches any "token home state was overwritten in a
  // later move" regression that single-turn tests would miss.
  it('preserves finishOrder across many turns of bots bringing tokens home one by one', async () => {
    const { useLudoStore } = await import('./store');
    useLudoStore.getState().resetGame();
    useLudoStore.getState().initGame(3, ['BotA', 'BotB', 'BotC'], [
      { name: 'BotA', color: 'blue',  displayColor: 'blue',  isCPU: true },
      { name: 'BotB', color: 'red',   displayColor: 'red',   isCPU: true },
      { name: 'BotC', color: 'green', displayColor: 'green', isCPU: true },
    ]);

    // Each seat: 1 token home, 3 tokens at path index 50 (one 6 finishes
    // each). State across many roll/select cycles must keep the prior
    // home tokens marked correctly.
    const stage = (color: 'blue' | 'red' | 'green') => [
      { id: `${color}-0`, color, displayColor: color, state: 'home'   as const, pathIndex: 56 },
      { id: `${color}-1`, color, displayColor: color, state: 'active' as const, pathIndex: 50 },
      { id: `${color}-2`, color, displayColor: color, state: 'active' as const, pathIndex: 50 },
      { id: `${color}-3`, color, displayColor: color, state: 'active' as const, pathIndex: 50 },
    ];
    useLudoStore.setState({
      players: useLudoStore.getState().players.map(p => ({
        ...p,
        tokens: stage(p.color as 'blue' | 'red' | 'green'),
      })),
      currentPlayerIndex: 0,
      gamePhase: 'rolling',
      diceValue: null,
      hasRolled: false,
      selectableTokenIds: [],
    });

    // Always roll a 6 — Math.random() = 5/6 → floor(5/6 * 6) + 1 = 6.
    const rngSpy = vi.spyOn(Math, 'random').mockReturnValue(5 / 6);

    // Drive the game manually, emulating what the CPU autoplay effect
    // would do: roll when 'rolling', pick the first selectable when
    // 'selecting'. Cap at a generous step limit so a logic regression
    // can't infinite-loop the test runner.
    for (let i = 0; i < 400; i++) {
      const s = useLudoStore.getState();
      if (s.gamePhase === 'finished') break;
      if (s.gamePhase === 'rolling') {
        s.rollDice();
      } else if (s.gamePhase === 'selecting' && s.selectableTokenIds.length > 0) {
        s.selectToken(s.selectableTokenIds[0]);
      } else {
        // 'moving' / between phases — let the pending timers run.
      }
      await vi.runAllTimersAsync();
    }

    const after = useLudoStore.getState();
    expect(after.gamePhase).toBe('finished');
    // Exactly one player (the first finisher) is placed; the others
    // never got their last token home before the game ended.
    const placed = after.players.filter(p => p.finishOrder > 0);
    expect(placed).toHaveLength(1);
    expect(placed[0].finishOrder).toBe(1);
    expect(after.winner?.finishOrder).toBe(1);

    rngSpy.mockRestore();
  });

  // `firstHomeWins` is the more-aggressive variant — any single token
  // reaching home ends the game. Verifies that the option still takes
  // precedence over the default first-player-to-finish rule.
  it('firstHomeWins option: ANY single token going home ends the game immediately', async () => {
    const { useLudoStore } = await import('./store');
    useLudoStore.getState().resetGame();
    useLudoStore.getState().initGame(3, ['Alice', 'BotOne', 'BotTwo'], [
      { name: 'Alice',  color: 'blue',  displayColor: 'blue',  isCPU: false },
      { name: 'BotOne', color: 'red',   displayColor: 'red',   isCPU: true },
      { name: 'BotTwo', color: 'green', displayColor: 'green', isCPU: true },
    ], { oneTokenOut: false, firstHomeWins: true, cpuDifficulty: 'medium' });

    // Alice has 3 still in yard, 1 token at pathIndex 55 about to home.
    useLudoStore.setState({
      players: useLudoStore.getState().players.map((p, i) => i === 0
        ? {
            ...p,
            tokens: [
              { id: 'blue-0', color: 'blue', displayColor: 'blue', state: 'active' as const, pathIndex: 55 },
              { id: 'blue-1', color: 'blue', displayColor: 'blue', state: 'yard'   as const, pathIndex: -1 },
              { id: 'blue-2', color: 'blue', displayColor: 'blue', state: 'yard'   as const, pathIndex: -1 },
              { id: 'blue-3', color: 'blue', displayColor: 'blue', state: 'yard'   as const, pathIndex: -1 },
            ],
          }
        : p),
      currentPlayerIndex: 0,
      gamePhase: 'selecting',
      diceValue: 1,
      hasRolled: true,
      selectableTokenIds: ['blue-0'],
    });

    await driveSelectToken(useLudoStore.getState(), 'blue-0');

    const after = useLudoStore.getState();
    expect(after.gamePhase).toBe('finished');
    expect(after.winner?.name).toBe('Alice');
  });
});
