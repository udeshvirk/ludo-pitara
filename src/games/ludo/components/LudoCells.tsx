import React from 'react';
import { BOARD_SIZE, PLAYER_COLORS, isPathCell } from '../constants';
import type { PlayerColor } from '../types';
import LudoToken from './Token';
import StackCountBadge from '../../../components/ui/StackCountBadge';
import { COLOR_DEEP, PATH_ARROW } from './boardChrome';

// Rendering of the 225 non-corner cells: path cells, start cells, home
// stretches, safe-square stars, plus any tokens sitting on a cell with
// the walker rendered solo on top of residents. Yard corners and the
// centre 3×3 are drawn separately by their own components and skipped
// here.

interface CellTokenInfo {
  tokenId: string;
  color: PlayerColor;
  yardIndex: number;
  isMoving: boolean;
}

interface LudoCellsProps {
  // Cell positions where tokens currently sit (keyed `row,col`).
  tokenPositions: Map<string, CellTokenInfo[]>;
  // Coloured cells (start cells + home stretches), each mapped to its
  // seat-colour key.
  coloredCells: Map<string, PlayerColor>;
  // Start-cell keys (subset of coloredCells used for arrow rendering).
  startCells: Map<string, PlayerColor>;
  // Safe-square set (string keys "row,col") on the main path.
  safeSquareSet: Set<string>;
  // Seat → user-picked visual colour (for filling cells / arrows).
  seatToDisplay: Record<PlayerColor, PlayerColor>;
  selectableTokenIds: string[];
}

const LudoCells: React.FC<LudoCellsProps> = ({
  tokenPositions, coloredCells, startCells, safeSquareSet, seatToDisplay, selectableTokenIds,
}) => (
  <>
    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;
      const key = `${row},${col}`;

      // Centre 3×3 — drawn separately.
      if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

      // Yard corner panels — drawn separately.
      const inYard =
        (row < 6 && col < 6) ||
        (row < 6 && col > 8) ||
        (row > 8 && col < 6) ||
        (row > 8 && col > 8);
      if (inYard) return null;

      const tokens = tokenPositions.get(key) || [];
      const onPath = isPathCell(row, col);
      const cellColor = coloredCells.get(key);
      const isStartCell = startCells.has(key);
      const isHomeStretch = !!cellColor && !isStartCell;
      const isSafe = safeSquareSet.has(key) && onPath;
      const showStar = isSafe && !isStartCell;
      const arrow = isStartCell || isHomeStretch ? PATH_ARROW[cellColor!] : null;

      let bg = 'var(--bg-board-cream)';
      if (cellColor) {
        // Home stretch lanes: solid colour. Start cells: 25% tinted.
        // Resolve seat → player-picked display colour for fills.
        const visual = PLAYER_COLORS[seatToDisplay[cellColor]].bg;
        bg = isStartCell ? `${visual}40` : visual;
      }
      // Star-only safe cells get a faint gold tint so the cell stays
      // identifiable as "safe" even when a token sits on it and covers
      // the star glyph.
      if (showStar) bg = 'rgba(245, 184, 0, 0.16)';

      const residents = tokens.filter(t => !t.isMoving);
      const walkers = tokens.filter(t => t.isMoving);

      return (
        <div
          key={key}
          className={`ludo-cell ${showStar ? 'safe-star' : ''}`}
          style={{ gridRow: row + 1, gridColumn: col + 1, background: bg }}
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
                textShadow: isStartCell ? '0 1px 0 rgba(255,255,255,0.65)' : '0 1px 0 rgba(0,0,0,0.25)',
                zIndex: 1,
              }}
            >
              {arrow}
            </span>
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            {/* Static residents lay out via stackPlacement off their
                own count — the walking token never re-flows them. */}
            {residents.map((t, ti, arr) => (
              <LudoToken
                key={t.tokenId}
                tokenId={t.tokenId}
                color={seatToDisplay[t.color]}
                isSelectable={selectableTokenIds.includes(t.tokenId)}
                stackIndex={ti}
                stackSize={arr.length}
              />
            ))}
            {/* Walking token (if any) renders solo on top of the cell
                so a pass-through doesn't briefly resize the resident
                tokens or flash the count badge. */}
            {walkers.map(t => (
              <LudoToken
                key={t.tokenId}
                tokenId={t.tokenId}
                color={seatToDisplay[t.color]}
                isSelectable={selectableTokenIds.includes(t.tokenId)}
                stackIndex={0}
                stackSize={1}
              />
            ))}
            {residents.length >= 2 && <StackCountBadge n={residents.length} />}
          </div>
        </div>
      );
    })}
  </>
);

export default LudoCells;
