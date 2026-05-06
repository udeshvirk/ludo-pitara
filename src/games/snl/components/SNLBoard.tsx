import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BOARD_SIZE,
  SNAKES_AND_LADDERS,
  rowColToCell,
  getCellCenter,
  SNAKE_COLORS,
} from '../constants';
import { useSNLStore } from '../store';

const SNLBoard: React.FC = () => {
  const { players } = useSNLStore();

  // Build player position map
  const playerPositions = useMemo(() => {
    const map = new Map<number, typeof players>();
    for (const player of players) {
      if (player.position === 0) continue;
      if (!map.has(player.position)) map.set(player.position, []);
      map.get(player.position)!.push(player);
    }
    return map;
  }, [players]);

  // Generate cells
  const cells = useMemo(() => {
    const result = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cellNum = rowColToCell(row, col);
        const isSnakeHead = SNAKES_AND_LADDERS.some(s => s.type === 'snake' && s.from === cellNum);
        const isLadderBottom = SNAKES_AND_LADDERS.some(s => s.type === 'ladder' && s.from === cellNum);
        const playersHere = playerPositions.get(cellNum) || [];

        // Alternating cell colors
        const isDark = (row + col) % 2 === 0;

        result.push({
          row, col, cellNum, isSnakeHead, isLadderBottom, playersHere, isDark,
        });
      }
    }
    return result;
  }, [playerPositions]);

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        width: 'min(92vw, 65vh)',
        height: 'min(92vw, 65vh)',
        aspectRatio: '1',
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {/* Board Grid */}
      <div
        className="w-full h-full rounded-2xl overflow-hidden relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
          border: '3px solid rgba(255,255,255,0.15)',
          boxShadow: '0 0 40px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {cells.map(({ row, col, cellNum, isSnakeHead, isLadderBottom, playersHere, isDark }) => (
          <div
            key={`${row}-${col}`}
            className="snl-cell"
            style={{
              background: isDark
                ? 'rgba(99, 102, 241, 0.08)'
                : 'rgba(139, 92, 246, 0.04)',
              borderBottom: row < BOARD_SIZE - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              borderRight: col < BOARD_SIZE - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            {/* Cell number */}
            <span
              className="absolute top-0.5 left-1 text-[0.55em] opacity-40 font-semibold"
              style={{
                color: isSnakeHead ? '#ef4444' : isLadderBottom ? '#22c55e' : undefined,
                opacity: isSnakeHead || isLadderBottom ? 0.8 : 0.4,
              }}
            >
              {cellNum}
            </span>

            {/* Snake/Ladder indicator */}
            {isSnakeHead && (
              <span className="absolute bottom-0.5 right-0.5 text-[0.7em]">🐍</span>
            )}
            {isLadderBottom && (
              <span className="absolute bottom-0.5 right-0.5 text-[0.7em]">🪜</span>
            )}

            {/* Player tokens */}
            <div className="flex flex-wrap gap-[2px] items-center justify-center z-10 w-full h-full p-1">
              {playersHere.map((player, i) => (
                <motion.div
                  key={player.id}
                  layoutId={`snl-token-${player.id}`}
                  className="rounded-full"
                  style={{
                    width: playersHere.length > 2 ? '30%' : playersHere.length > 1 ? '40%' : '55%',
                    aspectRatio: '1',
                    background: `radial-gradient(circle at 35% 35%, ${player.color}cc, ${player.color})`,
                    border: '2px solid rgba(255,255,255,0.7)',
                    boxShadow: `0 2px 8px ${player.color}60`,
                    zIndex: 10 + i,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SVG Overlay for Snakes and Ladders */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {SNAKES_AND_LADDERS.filter(s => s.type === 'snake').map((_, i) => {
            const colors = SNAKE_COLORS[i % SNAKE_COLORS.length];
            return (
              <linearGradient key={`snake-grad-${i}`} id={`snake-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors[0]} stopOpacity="0.7" />
                <stop offset="100%" stopColor={colors[1]} stopOpacity="0.7" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Ladders */}
        {SNAKES_AND_LADDERS.filter(s => s.type === 'ladder').map((ladder, i) => {
          const from = getCellCenter(ladder.from);
          const to = getCellCenter(ladder.to);

          // Calculate perpendicular offset for ladder rails
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = (-dy / len) * 1.2;
          const ny = (dx / len) * 1.2;

          const rungs = 4;
          const rungLines = Array.from({ length: rungs }, (_, j) => {
            const t = (j + 1) / (rungs + 1);
            const mx = from.x + dx * t;
            const my = from.y + dy * t;
            return { x1: mx + nx, y1: my + ny, x2: mx - nx, y2: my - ny };
          });

          return (
            <g key={`ladder-${i}`}>
              {/* Rail 1 */}
              <line
                x1={from.x + nx} y1={from.y + ny}
                x2={to.x + nx} y2={to.y + ny}
                stroke="#b45309"
                strokeWidth="0.7"
                strokeLinecap="round"
                opacity="0.75"
              />
              {/* Rail 2 */}
              <line
                x1={from.x - nx} y1={from.y - ny}
                x2={to.x - nx} y2={to.y - ny}
                stroke="#b45309"
                strokeWidth="0.7"
                strokeLinecap="round"
                opacity="0.75"
              />
              {/* Rungs */}
              {rungLines.map((rung, j) => (
                <line
                  key={j}
                  x1={rung.x1} y1={rung.y1}
                  x2={rung.x2} y2={rung.y2}
                  stroke="#d97706"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  opacity="0.65"
                />
              ))}
            </g>
          );
        })}

        {/* Snakes */}
        {SNAKES_AND_LADDERS.filter(s => s.type === 'snake').map((snake, i) => {
          const from = getCellCenter(snake.from); // head
          const to = getCellCenter(snake.to); // tail

          // Perpendicular for waves
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const waveMag = len * 0.15;
          const nx = -dy / len;
          const ny = dx / len;

          const cp1x = from.x + dx * 0.25 + nx * waveMag;
          const cp1y = from.y + dy * 0.25 + ny * waveMag;
          const cp2x = from.x + dx * 0.75 - nx * waveMag;
          const cp2y = from.y + dy * 0.75 - ny * waveMag;

          return (
            <g key={`snake-${i}`}>
              {/* Snake body */}
              <path
                d={`M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`}
                fill="none"
                stroke={`url(#snake-grad-${i})`}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Snake head dot */}
              <circle
                cx={from.x}
                cy={from.y}
                r="1.4"
                fill={SNAKE_COLORS[i % SNAKE_COLORS.length][0]}
                opacity="0.9"
              />
              {/* Scary Snake eyes */}
              <circle cx={from.x - 0.5} cy={from.y - 0.5} r="0.4" fill="#ef4444" opacity="0.95" />
              <circle cx={from.x + 0.5} cy={from.y - 0.5} r="0.4" fill="#ef4444" opacity="0.95" />
              {/* Snake pupils (slits) */}
              <ellipse cx={from.x - 0.5} cy={from.y - 0.5} rx="0.1" ry="0.25" fill="#000" />
              <ellipse cx={from.x + 0.5} cy={from.y - 0.5} rx="0.1" ry="0.25" fill="#000" />
              {/* Forked tongue */}
              <path 
                d={`M ${from.x} ${from.y - 1} L ${from.x} ${from.y - 2.5} L ${from.x - 0.6} ${from.y - 3.2} M ${from.x} ${from.y - 2.5} L ${from.x + 0.6} ${from.y - 3.2}`} 
                stroke="#ef4444" 
                strokeWidth="0.25" 
                fill="none" 
              />
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
};

export default SNLBoard;
