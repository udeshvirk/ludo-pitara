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
import StackCountBadge from '../../../components/ui/StackCountBadge';
import Coin from '../../../components/ui/Coin';
import type { CaptureFly } from '../types';

const COLOR_DEEP: Record<PlayerColor, string> = {
  red: '#9a1a18',
  green: '#185c2c',
  yellow: '#7a5a00',
  blue: '#0e3e7a',
};

// Path direction by colour — the triangle-glyph that points along the
// home stretch toward the centre, and identifies each colour's start
// cell entry direction. Both the start cell and the home-stretch cells
// use the same direction (each colour's stretch flows to the centre
// in the same direction the player enters the path).
const PATH_ARROW: Record<PlayerColor, string> = {
  red: '▶',
  green: '▼',
  yellow: '◀',
  blue: '▲',
};

// Player home corner: 6×6 cells starting at the given (row, col)
const HOME_CORNERS: Record<PlayerColor, { row: number; col: number }> = {
  red: { row: 0, col: 0 },
  green: { row: 0, col: 9 },
  yellow: { row: 9, col: 9 },
  blue: { row: 9, col: 0 },
};

// Nameplate position (relative to the colored corner panel) and
// rotation. Each plate sits on the panel's outer edge — the side that
// faces away from the centre of the board — and rotates so it reads
// "facing the player's seat" (Ludo-King style).
//
//   blue   (bottom-left)  → bottom edge, 0°
//   red    (top-left)     → left edge,   90° CW
//   green  (top-right)    → top edge,    180°
//   yellow (bottom-right) → right edge, 270° (-90°)
const NAMEPLATE_LAYOUT: Record<PlayerColor, {
  position: React.CSSProperties;
  rotation: string;
}> = {
  blue:   { position: { left: 0, right: 0, bottom: 0, height: '14%' },         rotation: 'rotate(0deg)' },
  red:    { position: { left: 0, top: 0, bottom: 0, width: '14%' },            rotation: 'rotate(90deg)' },
  green:  { position: { left: 0, right: 0, top: 0, height: '14%' },            rotation: 'rotate(180deg)' },
  yellow: { position: { right: 0, top: 0, bottom: 0, width: '14%' },           rotation: 'rotate(-90deg)' },
};

// Floating token rendered while a captured token arcs back to its yard
// socket. Not a layoutId-tracked element — just a one-shot motion.div
// with keyframe-driven left/top + scale + rotate. The yardTokens render
// skips the captured token until flyingCaptures clears, so visually
// the arc lands and the yard render takes over.
// Identity fallback for seats with no player (2/3-player games leave
// some yards empty). Lets `seatToDisplay[seat]` always return a key
// that PLAYER_COLORS / COLOR_DEEP can be indexed with.
const IDENTITY_SEAT_MAP: Record<PlayerColor, PlayerColor> = {
  red: 'red', green: 'green', yellow: 'yellow', blue: 'blue',
};

const FlyingCaptureToken: React.FC<{ fly: CaptureFly }> = ({ fly }) => {
  const cellPct = 100 / 15;
  const fromX = (fly.from.col + 0.5) * cellPct;
  const fromY = (fly.from.row + 0.5) * cellPct;
  const toX = (fly.to.col + 0.5) * cellPct;
  const toY = (fly.to.row + 0.5) * cellPct;
  // Arc peak — midpoint horizontally, lifted above the higher endpoint.
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 12;
  const tokenSize = 5; // % of board, similar to a single-cell token
  const half = tokenSize / 2;
  const dir = toX < fromX ? -1 : 1;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${tokenSize}%`,
        height: `${tokenSize}%`,
        left: `${fromX - half}%`,
        top: `${fromY - half}%`,
        zIndex: 60,
        pointerEvents: 'none',
      }}
      animate={{
        left: [`${fromX - half}%`, `${midX - half}%`, `${toX - half}%`],
        top: [`${fromY - half}%`, `${midY - half}%`, `${toY - half}%`],
        scale: [1, 1.15, 0.85],
        rotate: [0, dir * 180, dir * 360],
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Coin color={PLAYER_COLORS[fly.displayColor].bg} />
    </motion.div>
  );
};

const LudoBoard: React.FC = () => {
  const { players, selectableTokenIds } = useLudoStore();
  const flyingCaptures = useLudoStore(s => s.flyingCaptures);
  const movingTokenId = useLudoStore(s => s.movingTokenId);
  const flyingIds = useMemo(() => new Set(flyingCaptures.map(f => f.tokenId)), [flyingCaptures]);

  // Seats that have a player assigned. Used to suppress yard panels,
  // start cells, home stretches, and centre wedges for empty seats so
  // a user-picked colour can't collide with an empty seat's namesake
  // (e.g. P1 picks yellow → BL renders yellow; BR was identity-yellow
  // and would have rendered yellow too — confusing).
  const activeSeats = useMemo(
    () => new Set(players.map(p => p.color)),
    [players],
  );

  const coloredCells = useMemo(() => {
    const all = getColoredCells();
    const filtered = new Map<string, PlayerColor>();
    for (const [key, seat] of all) {
      if (activeSeats.has(seat)) filtered.set(key, seat);
    }
    return filtered;
  }, [activeSeats]);
  const safeSquares = useMemo(() => getSafeSquares(), []);
  const safeSquareSet = useMemo(
    () => new Set(safeSquares.map(s => `${s.row},${s.col}`)),
    [safeSquares]
  );

  // Map color → starting cell (for highlighting). Same data as coloredCells.
  const startCells = useMemo(() => {
    const map = new Map<string, PlayerColor>();
    (Object.keys(START_INDEX) as PlayerColor[]).forEach((color) => {
      if (!activeSeats.has(color)) return;
      const pos = getBoardPosition(color, 0);
      map.set(`${pos.row},${pos.col}`, color);
    });
    return map;
  }, [activeSeats]);

  // Path tokens — yard and home tokens are rendered separately so the
  // path map stays focused on actual on-track positions. The walking
  // token (if any) carries `isMoving: true` so the cell render can
  // exclude it from the stack count and render it solo on top.
  const tokenPositions = useMemo(() => {
    const map = new Map<string, { tokenId: string; color: PlayerColor; yardIndex: number; isMoving: boolean }[]>();
    for (const player of players) {
      player.tokens.forEach((token, idx) => {
        if (token.state !== 'active') return;
        const pos = getBoardPosition(token.color, token.pathIndex);
        const key = `${pos.row},${pos.col}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          tokenId: token.id,
          color: token.color,
          yardIndex: idx,
          isMoving: token.id === movingTokenId,
        });
      });
    }
    return map;
  }, [players, movingTokenId]);

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
        if (t.state === 'yard' && !flyingIds.has(t.id)) {
          map[t.color][idx] = { tokenId: t.id, isSelectable: selectableTokenIds.includes(t.id) };
        }
      });
    }
    return map;
  }, [players, selectableTokenIds, flyingIds]);

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

  // Player name keyed by colour, so each yard panel can label itself
  // (Ludo-King-style nameplate on the colored corner).
  const nameByColor = useMemo(() => {
    const map: Partial<Record<PlayerColor, string>> = {};
    for (const p of players) map[p.color] = p.name;
    return map;
  }, [players]);

  // Seat → user-picked visual colour. Each Ludo seat (BL/TL/TR/BR,
  // historically named blue/red/green/yellow) renders with the
  // displayColor of whoever sits there. Empty seats fall back to the
  // seat's namesake colour so 2/3-player boards still look natural.
  const seatToDisplay = useMemo(() => {
    const map: Record<PlayerColor, PlayerColor> = { ...IDENTITY_SEAT_MAP };
    for (const p of players) map[p.color] = p.displayColor;
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
          // Home stretch lanes: solid colour. Start cells: 25% tinted.
          // Resolve seat → player-picked display colour for fills.
          const visual = PLAYER_COLORS[seatToDisplay[c]].bg;
          bg = startCells.has(key) ? `${visual}40` : visual;
        }

        const isSafe = safeSquareSet.has(key) && onPath;
        const cellColor = coloredCells.get(key);
        const isStartCell = startCells.has(key);
        const isHomeStretch = !!cellColor && !isStartCell;
        // Star and arrow share the cell — start cells get an arrow
        // (entry direction); home-stretch cells get a smaller arrow
        // toward the centre; safe squares that aren't start cells get
        // the gold star.
        const showStar = isSafe && !isStartCell;
        // Star-only safe cells get a faint gold tint so the cell stays
        // identifiable as "safe" even when a token sits on it and covers
        // the star glyph.
        if (showStar) {
          bg = 'rgba(245, 184, 0, 0.16)';
        }
        const arrow = isStartCell || isHomeStretch ? PATH_ARROW[cellColor!] : null;

        return (
          <div
            key={key}
            className={`ludo-cell ${showStar ? 'safe-star' : ''}`}
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              background: bg,
            }}
          >
            {arrow && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  fontSize: isStartCell ? 'clamp(11px, 2.4vmin, 18px)' : 'clamp(9px, 1.8vmin, 14px)',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isStartCell ? COLOR_DEEP[seatToDisplay[cellColor!]] : 'rgba(255,255,255,0.78)',
                  textShadow: isStartCell
                    ? '0 1px 0 rgba(255,255,255,0.65)'
                    : '0 1px 0 rgba(0,0,0,0.25)',
                  zIndex: 1,
                }}
              >
                {arrow}
              </span>
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              {/* Static residents lay out via stackPlacement off their
                  own count — the walking token never re-flows them. */}
              {tokens.filter(t => !t.isMoving).map((t, ti, arr) => (
                <LudoToken
                  key={t.tokenId}
                  tokenId={t.tokenId}
                  color={seatToDisplay[t.color]}
                  isSelectable={selectableTokenIds.includes(t.tokenId)}
                  stackIndex={ti}
                  stackSize={arr.length}
                />
              ))}
              {/* Walking token (if any) renders solo on top of the
                  cell so a pass-through doesn't briefly resize the
                  resident tokens or flash the count badge. */}
              {tokens.filter(t => t.isMoving).map(t => (
                <LudoToken
                  key={t.tokenId}
                  tokenId={t.tokenId}
                  color={seatToDisplay[t.color]}
                  isSelectable={selectableTokenIds.includes(t.tokenId)}
                  stackIndex={0}
                  stackSize={1}
                />
              ))}
              {tokens.filter(t => !t.isMoving).length >= 2 && (
                <StackCountBadge n={tokens.filter(t => !t.isMoving).length} />
              )}
            </div>
          </div>
        );
      })}

      {/* Centre 3×3 — coloured wedges with edge-to-centre gradients,
          and a glowing gold medallion in the middle. */}
      <div style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3', position: 'relative', background: 'var(--bg-board-cream)', border: '1.5px solid rgba(120, 80, 20, 0.4)' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map(c => {
              const visual = seatToDisplay[c];
              return (
                <radialGradient key={c} id={`wedge-${c}`} cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor={PLAYER_COLORS[visual].bgLight} />
                  <stop offset="100%" stopColor={PLAYER_COLORS[visual].bg} />
                </radialGradient>
              );
            })}
            <radialGradient id="centerDisc" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#fff5c2" />
              <stop offset="55%" stopColor="var(--gold-hi)" />
              <stop offset="100%" stopColor="var(--gold-deep)" />
            </radialGradient>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 217, 102, 0.7)" />
              <stop offset="100%" stopColor="rgba(255, 217, 102, 0)" />
            </radialGradient>
          </defs>
          {/* Wedges only render for seats with an active player —
              otherwise the unfilled wedge stays board-cream to avoid
              an empty seat's namesake colour leaking into the centre. */}
          {activeSeats.has('green') && (
            <polygon points="50,50 0,0 100,0" fill="url(#wedge-green)" />
          )}
          {activeSeats.has('yellow') && (
            <polygon points="50,50 100,0 100,100" fill="url(#wedge-yellow)" />
          )}
          {activeSeats.has('blue') && (
            <polygon points="50,50 100,100 0,100" fill="url(#wedge-blue)" />
          )}
          {activeSeats.has('red') && (
            <polygon points="50,50 0,100 0,0" fill="url(#wedge-red)" />
          )}
          {/* Wedge separators */}
          <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
          {/* Outer glow ring around the medallion */}
          <circle cx="50" cy="50" r="22" fill="url(#centerGlow)" />
          {/* Medallion */}
          <circle cx="50" cy="50" r="16" fill="url(#centerDisc)" stroke="var(--gold-deep)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="13" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
          <text x="50" y="58.5" textAnchor="middle" fontSize="22" fontWeight="700" fill="#3a1f00" fontFamily="var(--font-display)">★</text>
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
                  color={seatToDisplay[color]}
                  isSelectable={false}
                  stackIndex={ti}
                  stackSize={ids.length}
                />
              ))}
              {ids.length >= 2 && <StackCountBadge n={ids.length} />}
            </div>
          );
        })}
      </div>

      {/* Four yard corner panels — only rendered for seats with an
          active player. An empty seat's corner stays board-cream so
          its namesake colour can't collide with the user's pick. */}
      {(Object.keys(HOME_CORNERS) as PlayerColor[]).map(color => {
        if (!activeSeats.has(color)) return null;
        const corner = HOME_CORNERS[color];
        // Yard rendering uses the seated player's chosen display
        // colour, so picking "red" for the BL slot makes the BL yard
        // render red (despite the seat key historically being 'blue').
        const visual = seatToDisplay[color];
        const colors = PLAYER_COLORS[visual];
        const deep = COLOR_DEEP[visual];
        const yard = yardTokens[color];
        const name = nameByColor[color];
        // Nameplate position + rotation per corner (Ludo-King style: each
        // name is on the outer edge of its yard, rotated to face the
        // player's seat — 0° at bottom-left, +90° clockwise at every
        // corner going around).
        const nameplate = NAMEPLATE_LAYOUT[color];
        return (
          <div
            key={color}
            style={{
              gridRow: `${corner.row + 1} / span 6`,
              gridColumn: `${corner.col + 1} / span 6`,
              background: `linear-gradient(135deg, ${colors.bg}, ${deep})`,
              border: `2px solid ${deep}`,
              padding: '14%',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {name && (
              <div
                style={{
                  position: 'absolute',
                  ...nameplate.position,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    transform: nameplate.rotation,
                    transformOrigin: 'center center',
                    whiteSpace: 'nowrap',
                    color: '#fff',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'clamp(11px, 2vmin, 17px)',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  }}
                >
                  {name}
                </span>
              </div>
            )}
            <div style={{
              width: '100%', height: '100%',
              background: 'var(--bg-board-cream)',
              border: `1.5px solid ${deep}`,
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
                      // Recessed socket: top-inset shadow simulates the
                      // far wall of a well; bottom inset highlight is
                      // light reflecting off the near rim. Combined
                      // with the colored ring border, the token reads
                      // as sitting inside a hole rather than on top of
                      // a flat disc.
                      background: colors.bg,
                      border: `2px solid ${deep}`,
                      borderRadius: '50%',
                      boxShadow:
                        'inset 0 5px 8px rgba(0,0,0,0.40), ' +
                        'inset 0 -2px 2px rgba(255,255,255,0.30), ' +
                        '0 1px 0 rgba(255,255,255,0.45)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {occupant && (
                        <LudoToken
                          tokenId={occupant.tokenId}
                          color={visual}
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

      {flyingCaptures.map(fly => (
        <FlyingCaptureToken key={fly.tokenId} fly={fly} />
      ))}
    </motion.div>
  );
};

export default LudoBoard;
