import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import {
  BOARD_SIZE,
  PLAYER_COLORS,
  YARD_POSITIONS,
  isPathCell,
  getColoredCells,
  getSafeSquares,
  getBoardPosition,
  START_INDEX,
} from '../constants';
import type { PlayerColor } from '../types';
import LudoToken from './Token';

const COLOR_DEEP: Record<PlayerColor, string> = {
  red: '#9a1a18',
  green: '#185c2c',
  yellow: '#7a5a00',
  blue: '#0e3e7a',
};

// Player home corner: 6×6 cells starting at the given (row, col)
const HOME_CORNERS: Record<PlayerColor, { row: number; col: number }> = {
  red: { row: 0, col: 0 },
  green: { row: 0, col: 9 },
  yellow: { row: 9, col: 9 },
  blue: { row: 9, col: 0 },
};

const LudoBoard: React.FC = () => {
  const { players, selectableTokenIds } = useLudoStore();

  const coloredCells = useMemo(() => getColoredCells(), []);
  const safeSquares = useMemo(() => getSafeSquares(), []);
  const safeSquareSet = useMemo(
    () => new Set(safeSquares.map(s => `${s.row},${s.col}`)),
    [safeSquares]
  );

  // Map color → starting cell (for highlighting). Same data as coloredCells.
  const startCells = useMemo(() => {
    const map = new Map<string, PlayerColor>();
    (Object.keys(START_INDEX) as PlayerColor[]).forEach((color) => {
      const pos = getBoardPosition(color, 0);
      map.set(`${pos.row},${pos.col}`, color);
    });
    return map;
  }, []);

  // Path tokens — yard and home tokens are rendered separately so the
  // path map stays focused on actual on-track positions.
  const tokenPositions = useMemo(() => {
    const map = new Map<string, { tokenId: string; color: PlayerColor; yardIndex: number }[]>();
    for (const player of players) {
      player.tokens.forEach((token, idx) => {
        if (token.state !== 'active') return;
        const pos = getBoardPosition(token.color, token.pathIndex);
        const key = `${pos.row},${pos.col}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ tokenId: token.id, color: token.color, yardIndex: idx });
      });
    }
    return map;
  }, [players]);

  // Yard tokens, indexed by ORIGINAL token slot (0..3). Pinning to the
  // original index means a token leaving the yard doesn't cause the
  // remaining ones to shift slots — which previously made siblings
  // briefly disappear / re-appear during a move animation.
  const yardTokens = useMemo(() => {
    const map: Record<PlayerColor, Array<{ tokenId: string; isSelectable: boolean } | null>> = {
      red: [null, null, null, null],
      green: [null, null, null, null],
      yellow: [null, null, null, null],
      blue: [null, null, null, null],
    };
    for (const player of players) {
      player.tokens.forEach((t, idx) => {
        if (t.state === 'yard') {
          map[t.color][idx] = { tokenId: t.id, isSelectable: selectableTokenIds.includes(t.id) };
        }
      });
    }
    return map;
  }, [players, selectableTokenIds]);

  // Home tokens grouped by color — placed at their wedge centroid inside
  // the centre 3×3 instead of all piling at (7,7).
  const homeTokens = useMemo(() => {
    const map: Record<PlayerColor, string[]> = { red: [], green: [], yellow: [], blue: [] };
    for (const player of players) {
      for (const token of player.tokens) {
        if (token.state === 'home') map[token.color].push(token.id);
      }
    }
    return map;
  }, [players]);

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1',
        background: 'var(--bg-board-cream)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-board)',
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const key = `${row},${col}`;

        // Center 3x3 — drawn separately as one cell below
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
          return null;
        }

        // Yard corner panels — drawn separately below
        const inHome =
          (row < 6 && col < 6) ||
          (row < 6 && col > 8) ||
          (row > 8 && col < 6) ||
          (row > 8 && col > 8);
        if (inHome) return null;

        const tokens = tokenPositions.get(key) || [];
        const onPath = isPathCell(row, col);

        let bg = 'var(--bg-board-cream)';
        if (coloredCells.has(key)) {
          const c = coloredCells.get(key)!;
          // Home stretch lanes: solid color. Start cells: 25% tinted.
          bg = startCells.has(key) ? `${PLAYER_COLORS[c].bg}40` : PLAYER_COLORS[c].bg;
        }

        const isSafe = safeSquareSet.has(key) && onPath;

        return (
          <div
            key={key}
            className={`ludo-cell ${isSafe ? 'safe-star' : ''}`}
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              background: bg,
              border: '1px solid rgba(120, 80, 20, 0.25)',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tokens.map((t, ti) => (
                <LudoToken
                  key={t.tokenId}
                  tokenId={t.tokenId}
                  color={t.color}
                  isSelectable={selectableTokenIds.includes(t.tokenId)}
                  stackIndex={ti}
                  stackSize={tokens.length}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Centre 3×3 — coloured wedges + gold ring. Tokens that reached
          home are placed at the centroid of their colour's wedge so
          different colours fan out into their own corners instead of
          piling onto a single point. */}
      <div style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3', position: 'relative', background: 'var(--bg-board-cream)', border: '1.5px solid rgba(120, 80, 20, 0.4)' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <polygon points="50,50 0,0 100,0" fill={PLAYER_COLORS.green.bg} />
          <polygon points="50,50 100,0 100,100" fill={PLAYER_COLORS.yellow.bg} />
          <polygon points="50,50 100,100 0,100" fill={PLAYER_COLORS.blue.bg} />
          <polygon points="50,50 0,100 0,0" fill={PLAYER_COLORS.red.bg} />
          <circle cx="50" cy="50" r="14" fill="var(--gold-hi)" stroke="var(--gold-deep)" strokeWidth="2" />
          <text x="50" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill="#3a1f00" fontFamily="var(--font-display)">★</text>
        </svg>

        {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map(color => {
          const ids = homeTokens[color];
          if (ids.length === 0) return null;
          // Wedge centroid expressed as % of the centre 3×3 box.
          const pos =
            color === 'red'    ? { left: '17%', top: '50%' } :
            color === 'green'  ? { left: '50%', top: '17%' } :
            color === 'yellow' ? { left: '83%', top: '50%' } :
                                 { left: '50%', top: '83%' };
          return (
            <div
              key={color}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
                width: '34%',
                height: '34%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ids.map((tokenId, ti) => (
                <LudoToken
                  key={tokenId}
                  tokenId={tokenId}
                  color={color}
                  isSelectable={false}
                  stackIndex={ti}
                  stackSize={ids.length}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Four yard corner panels */}
      {(Object.keys(HOME_CORNERS) as PlayerColor[]).map(color => {
        const corner = HOME_CORNERS[color];
        const colors = PLAYER_COLORS[color];
        const yard = yardTokens[color];
        return (
          <div
            key={color}
            style={{
              gridRow: `${corner.row + 1} / span 6`,
              gridColumn: `${corner.col + 1} / span 6`,
              background: `linear-gradient(135deg, ${colors.bg}, ${COLOR_DEEP[color]})`,
              border: `2px solid ${COLOR_DEEP[color]}`,
              padding: '14%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{
              width: '100%', height: '100%',
              background: 'var(--bg-board-cream)',
              border: `1.5px solid ${COLOR_DEEP[color]}`,
              borderRadius: 6,
              padding: '10%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '100%', height: '100%',
                display: 'grid',
                gridTemplate: '1fr 1fr / 1fr 1fr',
                gap: '14%',
              }}>
                {YARD_POSITIONS[color].map((_, slot) => {
                  const occupant = yard[slot];
                  return (
                    <div key={slot} style={{
                      background: colors.bg,
                      border: `2px solid ${COLOR_DEEP[color]}`,
                      borderRadius: '50%',
                      boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 2px 3px rgba(255,255,255,0.4)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {occupant && (
                        <LudoToken
                          tokenId={occupant.tokenId}
                          color={color}
                          isSelectable={occupant.isSelectable}
                          stackIndex={0}
                          stackSize={1}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default LudoBoard;
