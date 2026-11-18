import type { CSSProperties } from 'react';
import Avatar from './Avatar';
import Die from './Die';

interface PodProps {
  color: string;
  label: string;
  name: string;
  isActive: boolean;
  isRolling: boolean;
  diceValue: number | null;
  lastRoll?: number | null;
  onRoll?: () => void;
  canRoll: boolean;
  compact?: boolean;
  isBot?: boolean;
  arrowSide?: 'left' | 'right';
}

// A player identity strip sits above a dedicated dice tray. Names and turn
// status stay inside the card, with no detached arrows or duplicate captions.
export default function Pod({ color, label, name, isActive, isRolling, diceValue,
  lastRoll = null, onRoll, canRoll, compact = false, isBot = false }: PodProps) {
  const status = isActive ? (isRolling ? 'Rolling' : canRoll ? (isBot ? 'Bot turn' : 'Roll dice') : 'Your move') : 'Waiting';
  return (
    <div className={`player-pod ${compact ? 'player-pod-compact' : ''} ${isActive ? 'player-pod-active' : ''}`}
      aria-current={isActive ? 'true' : undefined} style={{ '--player-color': color } as CSSProperties}>
      <div className="player-pod-name"><span className="player-seat-dot" /><span title={name}>{name}</span></div>
      <div className="player-pod-tray">
        <div className="player-pod-identity">
          <Avatar color={color} label={label} size={compact ? 26 : 30} ring={false} isBot={isBot} />
          <span className="player-pod-status">{status}</span>
        </div>
        <div className="dice-well">
          <Die value={isActive && diceValue ? diceValue : (lastRoll ?? 1)}
            size={compact ? 34 : 40} active={isActive} rolling={isActive && isRolling}
            onClick={isActive && canRoll ? onRoll : undefined} disabled={!isActive || !canRoll} />
        </div>
      </div>
    </div>
  );
}
