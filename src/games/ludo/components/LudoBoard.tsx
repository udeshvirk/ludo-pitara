import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import {
  BOARD_SIZE,
  PLAYER_COLORS,
  HOME_AREAS,
  CENTER_AREA,
  YARD_POSITIONS,
  isPathCell,
  getColoredCells,
  getSafeSquares,
  getBoardPosition,
} from '../constants';
import type { PlayerColor } from '../types';
import LudoToken from './Token';

const LudoBoard: React.FC = () => {
  const { players, selectableTokenIds } = useLudoStore();

  const coloredCells = useMemo(() => getColoredCells(), []);
  const safeSquares = useMemo(() => getSafeSquares(), []);
  const safeSquareSet = useMemo(
    () => new Set(safeSquares.map(s => `${s.row},${s.col}`)),
    [safeSquares]
  );

  // Build the token position map
  const tokenPositions = useMemo(() => {
    const map = new Map<string, { tokenId: string; color: PlayerColor; yardIndex: number }[]>();

    for (const player of players) {
      player.tokens.forEach((token, idx) => {
        let pos;
        if (token.state === 'yard') {
          pos = YARD_POSITIONS[token.color][idx];
        } else if (token.state === 'home') {
          // Place at center
          pos = { row: 7, col: 7 };
        } else {
          pos = getBoardPosition(token.color, token.pathIndex);
        }
        const key = `${pos.row},${pos.col}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ tokenId: token.id, color: token.color, yardIndex: idx });
      });
    }
    return map;
  }, [players]);

  const getCellStyle = (row: number, col: number): React.CSSProperties => {
    const key = `${row},${col}`;

    // Center area
    if (row >= CENTER_AREA.startRow && row <= CENTER_AREA.endRow &&
        col >= CENTER_AREA.startCol && col <= CENTER_AREA.endCol) {
      // Center triangles
      if (row === 7 && col === 7) {
        return {
          background: 'linear-gradient(135deg, #ef4444 25%, #22c55e 25%, #22c55e 50%, #eab308 50%, #eab308 75%, #3b82f6 75%)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '4px',
        };
      }
      // Surrounding center cells colored by direction
      if (row === 6 && col === 7) return { background: PLAYER_COLORS.green.bg };
      if (row === 7 && col === 8) return { background: PLAYER_COLORS.yellow.bg };
      if (row === 8 && col === 7) return { background: PLAYER_COLORS.blue.bg };
      if (row === 7 && col === 6) return { background: PLAYER_COLORS.red.bg };
      // Corner cells of center
      return { background: 'rgba(255,255,255,0.05)' };
    }

    // Home areas (the large colored corners)
    for (const color of ['red', 'green', 'yellow', 'blue'] as PlayerColor[]) {
      const area = HOME_AREAS[color];
      if (row >= area.startRow && row <= area.endRow && col >= area.startCol && col <= area.endCol) {
        // Check if it's a yard position (where tokens sit)
        const isYardPos = YARD_POSITIONS[color].some(p => p.row === row && p.col === col);
        if (isYardPos) {
          return {
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            border: `2px solid ${PLAYER_COLORS[color].bg}`,
          };
        }
        // Outer border cells of yard area
        const isEdge = row === area.startRow || row === area.endRow ||
                       col === area.startCol || col === area.endCol;
        if (isEdge) {
          return { background: PLAYER_COLORS[color].bg };
        }
        // Inner cells
        return { background: PLAYER_COLORS[color].bgLight };
      }
    }

    // Colored path cells (home stretches and starting squares)
    if (coloredCells.has(key)) {
      const c = coloredCells.get(key)!;
      return { background: PLAYER_COLORS[c].bgLight };
    }

    // Path cells
    if (isPathCell(row, col)) {
      return {
        background: safeSquareSet.has(key)
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(255, 255, 255, 0.85)',
      };
    }

    // Non-path, non-yard cells
    return { background: 'transparent' };
  };

  const cells = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`;
      const style = getCellStyle(row, col);
      const isSafe = safeSquareSet.has(key) && isPathCell(row, col);
      const tokens = tokenPositions.get(key) || [];

      cells.push(
        <div
          key={key}
          className={`ludo-cell ${isSafe ? 'safe-star' : ''}`}
          style={style}
        >
          {/* Render tokens on this cell */}
          <div className={`flex flex-wrap items-center justify-center gap-[1px] ${tokens.length > 2 ? 'p-[1px]' : 'p-[2px]'}`}
            style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {tokens.map((t, i) => (
              <LudoToken
                key={t.tokenId}
                tokenId={t.tokenId}
                color={t.color}
                isSelectable={selectableTokenIds.includes(t.tokenId)}
                stackIndex={i}
                stackSize={tokens.length}
              />
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        width: 'min(88vw, 65vh)',
        height: 'min(88vw, 65vh)',
        aspectRatio: '1',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '3px solid rgba(255,255,255,0.15)',
        boxShadow: '0 0 40px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.4)',
        background: 'rgba(15, 15, 35, 0.9)',
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {cells}
    </motion.div>
  );
};

export default LudoBoard;
