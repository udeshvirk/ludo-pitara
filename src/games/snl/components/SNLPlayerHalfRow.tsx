import React from 'react';
import { useSNLStore } from '../store';
import Pod from '../../../components/ui/Pod';

interface SNLPlayerHalfRowProps {
  slots: Array<number | null>; // index into players[] or null for an empty slot
  // `top` = the row sits at the top of the screen, so the pod and name
  // are each rotated 180° (so a player sitting across the table sees
  // them right-side-up). Layout always reads "pod above name" — for
  // top rows this places the name close to the board edge.
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
        // Two-slot rows: slot 0 hugs the left edge → arrow on its right
        // (points inward); slot 1 mirrors. For top-of-screen rows the
        // pod wrapper is rotated 180°, which would visually flip the
        // chevron's side — so we pre-swap the side here to cancel it.
        const naturalSide: 'left' | 'right' = isSingle
          ? (arrowSide ?? 'right')
          : (slot === 0 ? 'right' : 'left');
        const podArrowSide: 'left' | 'right' = top
          ? (naturalSide === 'left' ? 'right' : 'left')
          : naturalSide;
        return (
          <div
            key={slot}
            style={{
              maxWidth: '100%',
              minWidth: 0,
              display: 'flex',
              // Top-of-screen rows: name sits at the top of the row in
              // the DOM/device-holder view AND each child (pod + name)
              // is rotated 180° individually. When the device is
              // flipped for the across-table player, what was at the
              // top of the row appears at the bottom of their view —
              // so they see pod-on-top, name-on-bottom (matching the
              // bottom-row player's reading order).
              flexDirection: top ? 'column-reverse' : 'column',
              alignItems: 'center',
              gap: 4,
              justifySelf: justify,
            }}
          >
            <div style={{ transform: top ? 'rotate(180deg)' : undefined }}>
              <Pod
                color={player.color}
                label={player.name[0]}
                isActive={isActive}
                isRolling={isRolling}
                diceValue={diceValue}
                lastRoll={player.lastRoll}
                onRoll={rollDice}
                canRoll={gamePhase === 'rolling'}
                compact={compact}
                isBot={!!player.isCPU}
                arrowSide={podArrowSide}
              />
            </div>
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
                transform: top ? 'rotate(180deg)' : undefined,
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
