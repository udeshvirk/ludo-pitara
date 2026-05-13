import React from 'react';
import { motion } from 'framer-motion';
import { BOARD_SIZE, rowColToCell } from '../constants';
import type { SNLPlayer } from '../types';
import Coin, { stackPlacement } from '../../../components/ui/Coin';
import StackCountBadge from '../../../components/ui/StackCountBadge';
import { SNL_TOKEN_SCALE } from './snlChrome';

interface CellOccupant { player: SNLPlayer; isMoving: boolean }

interface SNLCellsProps {
  // Cell-number → occupants on that cell.
  playerPositions: Map<number, CellOccupant[]>;
  ladderBases: Set<number>;
  ladderTops: Set<number>;
  snakeHeads: Set<number>;
  snakeTails: Set<number>;
}

const SNLCells: React.FC<SNLCellsProps> = ({
  playerPositions, ladderBases, ladderTops, snakeHeads, snakeTails,
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
      gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
    }}
  >
    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;
      const cellNum = rowColToCell(row, col);
      const isDark = (row + col) % 2 === 0;
      const baseBg = isDark ? 'var(--bg-board)' : 'var(--bg-board-cream)';
      const occupants = playerPositions.get(cellNum) || [];
      const residents = occupants.filter(o => !o.isMoving);
      const walkers = occupants.filter(o => o.isMoving);

      // Number-badge styling per the user's spec — the cell number
      // itself sits inside a coloured circle when the cell is a
      // snake/ladder anchor:
      //   snake head  → solid red,    snake tail → white (red ring)
      //   ladder base → solid green,  ladder top → white (green ring)
      const isSnakeHead  = snakeHeads.has(cellNum);
      const isSnakeTail  = snakeTails.has(cellNum);
      const isLadderBase = ladderBases.has(cellNum);
      const isLadderTop  = ladderTops.has(cellNum);
      let badgeBg: string | null = null;
      let badgeBorder: string | null = null;
      let badgeText = 'rgba(120, 80, 20, 0.85)';
      if (isSnakeHead)        { badgeBg = 'rgba(229, 57, 53, 0.55)'; badgeText = '#fff'; }
      else if (isLadderBase)  { badgeBg = 'rgba(44, 138, 74, 0.55)'; badgeText = '#fff'; }
      else if (isSnakeTail)   { badgeBg = 'rgba(255,255,255,0.65)';  badgeBorder = 'rgba(229, 57, 53, 0.55)';  badgeText = 'rgba(154, 26, 24, 0.9)'; }
      else if (isLadderTop)   { badgeBg = 'rgba(255,255,255,0.65)';  badgeBorder = 'rgba(44, 138, 74, 0.55)';  badgeText = 'rgba(24, 92, 44, 0.9)'; }

      const isAnchor = badgeBg !== null;
      const isLabel = cellNum === 1 || cellNum === 100;
      const labelText = cellNum === 1 ? 'Start' : cellNum === 100 ? 'Home' : String(cellNum);

      return (
        <div
          key={`${row}-${col}`}
          className="snl-cell"
          style={{
            background: baseBg,
            position: 'relative',
            border: '0.5px solid rgba(120, 80, 20, 0.18)',
          }}
        >
          {isAnchor ? (
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                minWidth: 14,
                minHeight: 14,
                width: '32%',
                height: '32%',
                aspectRatio: '1',
                borderRadius: '50%',
                background: badgeBg!,
                border: badgeBorder ? `1px solid ${badgeBorder}` : '1px solid rgba(0,0,0,0.10)',
                color: badgeText,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: '0.58em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                lineHeight: 1,
              }}
            >
              {cellNum}
            </span>
          ) : (
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: 5,
                fontSize: isLabel ? '0.66em' : '0.78em',
                fontWeight: isLabel ? 800 : 700,
                color: cellNum === 100 ? 'var(--gold-deep)' : cellNum === 1 ? 'var(--snake)' : 'rgba(120, 80, 20, 0.85)',
                fontFamily: 'var(--font-ui)',
                letterSpacing: isLabel ? 0.6 : 0,
                textTransform: 'uppercase',
              }}
            >
              {labelText}
            </span>
          )}
          <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
            {/* Residents: stack-layout off their own count so a
                pass-through walker never resizes them. */}
            {residents.map(({ player: p }, idx) => {
              const { sizePercent, leftPercent, topPercent } = stackPlacement(residents.length, idx, SNL_TOKEN_SCALE);
              return (
                <motion.div
                  key={p.id}
                  layoutId={`snl-token-${p.id}`}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${sizePercent}%`,
                    height: `${sizePercent}%`,
                    zIndex: 10 + idx,
                  }}
                  // Linear tween matching the 90 ms per-cell step —
                  // see Token.tsx in Ludo for why a longer tween
                  // visually skipped corner cells.
                  transition={{ type: 'tween', ease: 'linear', duration: 0.09 }}
                >
                  <Coin color={p.color} />
                </motion.div>
              );
            })}
            {/* Walker (if any) renders solo on top — keeps the full
                coin size and lets the layoutId animate it smoothly
                between cells without re-flowing residents. */}
            {walkers.map(({ player: p }) => {
              const { sizePercent, leftPercent, topPercent } = stackPlacement(1, 0, SNL_TOKEN_SCALE);
              return (
                <motion.div
                  key={p.id}
                  layoutId={`snl-token-${p.id}`}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${sizePercent}%`,
                    height: `${sizePercent}%`,
                    zIndex: 30,
                  }}
                  transition={{ type: 'tween', ease: 'linear', duration: 0.09 }}
                >
                  <Coin color={p.color} />
                </motion.div>
              );
            })}
            {residents.length >= 2 && <StackCountBadge n={residents.length} />}
          </div>
        </div>
      );
    })}
  </div>
);

export default SNLCells;
