import React from 'react';
import { useSNLStore } from '../store';
import Pod from '../../../components/ui/Pod';

interface SNLPlayerHalfRowProps {
  slots: Array<number | null>; // index into players[] or null for an empty slot
  // `top` = the row sits at the top of the screen, so the name caption
  // is rendered ABOVE the pod (and the pod hugs the board edge).
  top: boolean;
  compact?: boolean;
  // Single-slot rows (side rails) need the caller to specify which
  // side the arrow lives on. Two-slot rows derive it from slot index.
  arrowSide?: 'left' | 'right';
}

const SNLPlayerHalfRow: React.FC<SNLPlayerHalfRowProps> = ({ slots, top, compact = false, arrowSide }) => {
  const players = useSNLStore(s => s.players);
  const currentPlayerIndex = useSNLStore(s => s.currentPlayerIndex);
  const diceValue = useSNLStore(s => s.diceValue);
  const isRolling = useSNLStore(s => s.isRolling);
  const gamePhase = useSNLStore(s => s.gamePhase);
  const rollDice = useSNLStore(s => s.rollDice);

  const nameSize = compact ? 11 : 12;

  // Single-slot rows (side rails) center the pod; two-slot rows pin the
  // pods to the row's two outer edges so they hug the board corners.
  const isSingle = slots.length === 1;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isSingle ? '1fr' : '1fr 1fr',
        width: '100%',
        flexShrink: 0,
        alignItems: 'center',
      }}
    >
      {slots.map((idx, slot) => {
        if (idx === null || idx >= players.length) {
          return <div key={slot} />;
        }
        const player = players[idx];
        const isActive = idx === currentPlayerIndex && gamePhase !== 'finished';
        // Wrapper is content-sized within the grid cell so the visible
        // card region matches the pod itself. justifySelf positions the
        // (compact) wrapper at the cell's outer edge.
        const justify: React.CSSProperties['justifySelf'] =
          isSingle ? 'center' : (slot === 0 ? 'start' : 'end');
        const podArrowSide: 'left' | 'right' = isSingle
          ? (arrowSide ?? 'right')
          : (slot === 0 ? 'right' : 'left');
        return (
          <div
            key={slot}
            style={{
              maxWidth: '100%',
              minWidth: 0,
              display: 'flex',
              flexDirection: top ? 'column-reverse' : 'column',
              alignItems: 'center',
              gap: 4,
              justifySelf: justify,
            }}
          >
            <Pod
              color={player.color}
              label={player.name[0]}
              isActive={isActive}
              isRolling={isRolling}
              diceValue={diceValue}
              onRoll={rollDice}
              canRoll={gamePhase === 'rolling'}
              compact={compact}
              isBot={!!player.isCPU}
              arrowSide={podArrowSide}
            />
            <div
              style={{
                maxWidth: '100%',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: nameSize,
                lineHeight: 1.1,
                color: isActive ? '#fff' : 'var(--ink-dim)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
              }}
            >
              {player.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SNLPlayerHalfRow;
