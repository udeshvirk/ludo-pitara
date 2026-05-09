import React from 'react';
import { useLudoStore } from '../store';
import { PLAYER_COLORS } from '../constants';
import Pod from '../../../components/ui/Pod';

interface PlayerHalfRowProps {
  slots: Array<number | null>; // index into the players[] array, or null for empty
  compact?: boolean;
}

// Ludo pods carry no name caption — the player name is rendered on
// their colored yard corner inside the board itself, so a duplicate
// label here would just be visual noise.
const PlayerHalfRow: React.FC<PlayerHalfRowProps> = ({ slots, compact = false }) => {
  const players = useLudoStore(s => s.players);
  const currentPlayerIndex = useLudoStore(s => s.currentPlayerIndex);
  const diceValue = useLudoStore(s => s.diceValue);
  const isRolling = useLudoStore(s => s.isRolling);
  const gamePhase = useLudoStore(s => s.gamePhase);
  const rollDice = useLudoStore(s => s.rollDice);

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
        const isActive = idx === currentPlayerIndex && gamePhase !== 'finished';
        const justify = isSingle ? 'center' : (slot === 0 ? 'start' : 'end');
        return (
          <div key={slot} style={{ minWidth: 0, justifySelf: justify }}>
            <Pod
              color={PLAYER_COLORS[player.color].bg}
              label={player.name[0]}
              isActive={isActive}
              isRolling={isRolling}
              diceValue={diceValue}
              onRoll={rollDice}
              canRoll={gamePhase === 'rolling'}
              compact={compact}
            />
          </div>
        );
      })}
    </div>
  );
};

export default PlayerHalfRow;
