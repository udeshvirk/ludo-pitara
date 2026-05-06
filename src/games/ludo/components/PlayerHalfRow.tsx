import React from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import { PLAYER_COLORS } from '../constants';
import Avatar from '../../../components/ui/Avatar';
import Die from '../../../components/ui/Die';

interface PlayerHalfRowProps {
  slots: Array<number | null>; // index into the players[] array, or null for empty
  rotated: boolean;
  onRoll: () => void;
  isRolling: boolean;
  diceValue: number | null;
  activeIndex: number;
  gamePhase: string;
  compact?: boolean; // wide-layout side rails shrink everything so the board can grow
}

const PlayerHalfRow: React.FC<PlayerHalfRowProps> = ({ slots, rotated, onRoll, isRolling, diceValue, activeIndex, gamePhase, compact = false }) => {
  const players = useLudoStore(s => s.players);

  // Sizing tuned so a compact pod fits in a 140 px rail without truncating
  // the avatar / die. Regular pods stay at the original sizes for the
  // stacked phone layout.
  const avatarSize = compact ? 30 : 40;
  const dieSize = compact ? 34 : 44;
  const gap = compact ? 8 : 10;
  const padding = compact ? '7px 9px' : '10px 12px';
  const radius = compact ? 12 : 16;
  const nameSize = compact ? 13 : 15;
  const subSize = compact ? 9 : 10;

  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 10 : 14,
        width: '100%',
        justifyContent: 'space-around',
        transform: rotated ? 'rotate(180deg)' : 'none',
        flexShrink: 0,
      }}
    >
      {slots.map((idx, slot) => {
        if (idx === null || idx >= players.length) {
          return <div key={slot} style={{ flex: 1 }} />;
        }
        const player = players[idx];
        const colors = PLAYER_COLORS[player.color];
        const isActive = idx === activeIndex && gamePhase !== 'finished';
        const tokensHome = player.tokens.filter(t => t.state === 'home').length;

        return (
          <motion.div
            key={slot}
            animate={{ scale: isActive ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap,
              padding,
              borderRadius: radius,
              background: isActive
                ? `linear-gradient(135deg, ${colors.bg}26, transparent 70%)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? colors.bg : 'rgba(255,255,255,0.10)'}`,
              boxShadow: isActive ? `0 0 18px ${colors.glow}` : 'none',
            }}
          >
            <Avatar color={colors.bg} label={player.name[0]} size={avatarSize} ring active={isActive} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: nameSize,
                  lineHeight: 1.05,
                  color: isActive ? colors.bgLight : 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player.name}
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: subSize, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
                {tokensHome}/4 home {player.finishOrder > 0 ? `· #${player.finishOrder}` : ''}
              </div>
            </div>
            <Die
              value={isActive && diceValue ? diceValue : 1}
              size={dieSize}
              active={isActive}
              rolling={isActive && isRolling}
              onClick={isActive && gamePhase === 'rolling' ? onRoll : undefined}
              disabled={!isActive || gamePhase !== 'rolling'}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlayerHalfRow;
