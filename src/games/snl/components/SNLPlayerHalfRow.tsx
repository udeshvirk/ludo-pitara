import React from 'react';
import { motion } from 'framer-motion';
import { useSNLStore } from '../store';
import Avatar from '../../../components/ui/Avatar';
import Die from '../../../components/ui/Die';

interface SNLPlayerHalfRowProps {
  slots: Array<number | null>; // index into players[] or null for an empty slot
  // `top` = the row sits at the top of the screen, so the name caption
  // is rendered ABOVE the pod (and the pod hugs the board edge).
  top: boolean;
  onRoll: () => void;
  compact?: boolean;
}

const SNLPlayerHalfRow: React.FC<SNLPlayerHalfRowProps> = ({ slots, top, onRoll, compact = false }) => {
  const players = useSNLStore(s => s.players);
  const currentPlayerIndex = useSNLStore(s => s.currentPlayerIndex);
  const diceValue = useSNLStore(s => s.diceValue);
  const isRolling = useSNLStore(s => s.isRolling);
  const gamePhase = useSNLStore(s => s.gamePhase);

  const avatarSize = compact ? 28 : 36;
  const dieSize = compact ? 30 : 40;
  const podGap = compact ? 6 : 8;
  const podPadding = compact ? '5px 7px' : '6px 9px';
  const radius = compact ? 12 : 14;
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
        // card region matches the pod itself — a width: 100% wrapper
        // made each player's footprint stretch to the full half-screen
        // even when only the pod is rendered. justifySelf positions the
        // (compact) wrapper at the cell's outer edge instead.
        const justify: React.CSSProperties['justifySelf'] =
          isSingle ? 'center' : (slot === 0 ? 'start' : 'end');
        return (
          <motion.div
            key={slot}
            animate={{ scale: isActive ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: podGap,
                padding: podPadding,
                borderRadius: radius,
                background: isActive
                  ? `linear-gradient(135deg, ${player.color}26, transparent 70%)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? player.color : 'rgba(255,255,255,0.10)'}`,
                boxShadow: isActive ? `0 0 16px ${player.color}66` : 'none',
                flexShrink: 0,
              }}
            >
              <Avatar color={player.color} label={player.name[0]} size={avatarSize} ring active={isActive} />
              <Die
                value={isActive && diceValue ? diceValue : 1}
                size={dieSize}
                active={isActive}
                rolling={isActive && isRolling}
                onClick={isActive && gamePhase === 'rolling' ? onRoll : undefined}
                disabled={!isActive || gamePhase !== 'rolling'}
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
              }}
            >
              {player.name}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SNLPlayerHalfRow;
