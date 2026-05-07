import React from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import { PLAYER_COLORS } from '../constants';
import Avatar from '../../../components/ui/Avatar';
import Die from '../../../components/ui/Die';

interface PlayerHalfRowProps {
  slots: Array<number | null>; // index into the players[] array, or null for empty
  onRoll: () => void;
  isRolling: boolean;
  diceValue: number | null;
  activeIndex: number;
  gamePhase: string;
  compact?: boolean;
}

// Ludo pods carry no name caption — the player name is rendered on
// their colored yard corner inside the board itself, so a duplicate
// label here would just be visual noise.
const PlayerHalfRow: React.FC<PlayerHalfRowProps> = ({ slots, onRoll, isRolling, diceValue, activeIndex, gamePhase, compact = false }) => {
  const players = useLudoStore(s => s.players);

  const avatarSize = compact ? 28 : 36;
  const dieSize = compact ? 30 : 40;
  const podGap = compact ? 6 : 8;
  const podPadding = compact ? '5px 7px' : '6px 9px';
  const radius = compact ? 12 : 14;

  // Single-slot rows (side rails) center the pod; two-slot rows pin the
  // pods to the row's two outer edges so each pod sits beside its
  // colored yard corner of the board.
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
        const colors = PLAYER_COLORS[player.color];
        const isActive = idx === activeIndex && gamePhase !== 'finished';
        const justify = isSingle ? 'center' : (slot === 0 ? 'start' : 'end');

        return (
          <motion.div
            key={slot}
            animate={{ scale: isActive ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
                  ? `linear-gradient(135deg, ${colors.bg}26, transparent 70%)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? colors.bg : 'rgba(255,255,255,0.10)'}`,
                boxShadow: isActive ? `0 0 16px ${colors.glow}` : 'none',
              }}
            >
              <Avatar color={colors.bg} label={player.name[0]} size={avatarSize} ring active={isActive} />
              <Die
                value={isActive && diceValue ? diceValue : 1}
                size={dieSize}
                active={isActive}
                rolling={isActive && isRolling}
                onClick={isActive && gamePhase === 'rolling' ? onRoll : undefined}
                disabled={!isActive || gamePhase !== 'rolling'}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlayerHalfRow;
