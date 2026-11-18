import type { LudoGameState } from './types';

type TurnState = Pick<LudoGameState, 'players' | 'currentPlayerIndex' | 'gamePhase' | 'isRolling' | 'diceValue' | 'selectableTokenIds' | 'message'>;

// Derive instructions from the actual phase, including automatic moves and bots.
export function turnGuidance(state: TurnState): { title: string; detail: string } {
  const { players, currentPlayerIndex, gamePhase, isRolling, diceValue, selectableTokenIds, message } = state;
  const player = players[currentPlayerIndex];
  if (!player || gamePhase === 'setup') return { title: 'Getting ready', detail: '' };
  if (gamePhase === 'finished') return { title: message, detail: '' };
  if (isRolling) return { title: `${player.name} is rolling…`, detail: 'Wait for the dice to settle.' };
  if (gamePhase === 'selecting') {
    if (player.isCPU) return { title: `${player.name} is choosing a coin…`, detail: 'The bot will move automatically.' };
    const choices = players.flatMap(p => p.tokens).filter(t => selectableTokenIds.includes(t.id));
    const hasYard = choices.some(t => t.state === 'yard');
    const hasPath = choices.some(t => t.state === 'active');
    const detail = diceValue === 6 && hasYard
      ? hasPath ? 'Bring a coin out of its yard or move one 6 spaces.' : 'Tap a marked coin in your yard to bring it onto the board.'
      : `Tap a marked coin on the board to move ${diceValue} spaces.`;
    return { title: `${player.name} rolled ${diceValue} — tap a marked coin`, detail };
  }
  if (gamePhase === 'moving') return { title: `${player.name}’s coin is moving…`, detail: 'The move finishes automatically.' };
  if (diceValue !== null) return { title: message, detail: 'Please wait for the next turn.' };
  return {
    title: player.isCPU ? `${player.name} is about to roll…` : `${player.name} — tap your dice`,
    detail: player.isCPU ? 'The bot plays automatically.' : message.includes('Bonus turn') ? 'Bonus turn — roll again.' : 'Roll first, then tap a marked coin if you have a choice.',
  };
}
