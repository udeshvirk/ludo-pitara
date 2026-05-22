import React, { useState } from 'react';
import { BOARD_SIZE, PLAYER_COLORS, isPathCell } from '../constants';
import type { PlayerColor } from '../types';
import { useLudoStore } from '../store';
import LudoToken from './Token';
import StackCountBadge from '../../../components/ui/StackCountBadge';
import Coin from '../../../components/ui/Coin';
import { COLOR_DEEP, PATH_ARROW } from './boardChrome';

// Rendering of the 225 non-corner cells: path cells, start cells, home
// stretches, safe-square stars, plus any tokens sitting on a cell with
// the walker rendered solo on top of residents. Yard corners and the
// centre 3×3 are drawn separately by their own components and skipped
// here.

interface CellTokenInfo {
  tokenId: string;
  color: PlayerColor;
  yardIndex: number;
  isMoving: boolean;
}

interface LudoCellsProps {
  // Cell positions where tokens currently sit (keyed `row,col`).
  tokenPositions: Map<string, CellTokenInfo[]>;
  // Coloured cells (start cells + home stretches), each mapped to its
  // seat-colour key.
  coloredCells: Map<string, PlayerColor>;
  // Start-cell keys (subset of coloredCells used for arrow rendering).
  startCells: Map<string, PlayerColor>;
  // Safe-square set (string keys "row,col") on the main path.
  safeSquareSet: Set<string>;
  // Seat → user-picked visual colour (for filling cells / arrows).
  seatToDisplay: Record<PlayerColor, PlayerColor>;
  selectableTokenIds: string[];
}

const LudoCells: React.FC<LudoCellsProps> = ({
  tokenPositions, coloredCells, startCells, safeSquareSet, seatToDisplay, selectableTokenIds,
}) => {
  const selectToken = useLudoStore(s => s.selectToken);
  // Cell key ("row,col") whose colour-picker popup is currently open,
  // tagged with the selectable-set snapshot it was opened against.
  // When the turn advances (selectable set changes) the tag mismatches
  // and the picker is treated as closed without needing an effect.
  const selectableKey = selectableTokenIds.join('|');
  const [picker, setPicker] = useState<{ cell: string; key: string } | null>(null);
  const pickerCell = picker && picker.key === selectableKey ? picker.cell : null;

  return (
    <>
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const key = `${row},${col}`;

        // Centre 3×3 — drawn separately.
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

        // Yard corner panels — drawn separately.
        const inYard =
          (row < 6 && col < 6) ||
          (row < 6 && col > 8) ||
          (row > 8 && col < 6) ||
          (row > 8 && col > 8);
        if (inYard) return null;

        const tokens = tokenPositions.get(key) || [];
        const onPath = isPathCell(row, col);
        const cellColor = coloredCells.get(key);
        const isStartCell = startCells.has(key);
        const isHomeStretch = !!cellColor && !isStartCell;
        const isSafe = safeSquareSet.has(key) && onPath;
        const showStar = isSafe && !isStartCell;
        const arrow = isStartCell || isHomeStretch ? PATH_ARROW[cellColor!] : null;

        let bg = 'var(--bg-board-cream)';
        if (cellColor) {
          // Home stretch lanes: solid colour. Start cells: 25% tinted.
          // Resolve seat → player-picked display colour for fills.
          const visual = PLAYER_COLORS[seatToDisplay[cellColor]].bg;
          bg = isStartCell ? `${visual}40` : visual;
        }
        // Star-only safe cells get a faint gold tint so the cell stays
        // identifiable as "safe" even when a token sits on it and covers
        // the star glyph.
        if (showStar) bg = 'rgba(245, 184, 0, 0.16)';

        const residents = tokens.filter(t => !t.isMoving);
        const walkers = tokens.filter(t => t.isMoving);

        // Colour-picker condition: 2+ residents on this cell are
        // selectable AND of different seat colours. Only happens in
        // partner mode when teammate seats share a cell — kids
        // struggle to hit the right one when coins overlap, so an
        // overlay opens a popup with one coin button per option.
        const selectableResidents = residents.filter(t => selectableTokenIds.includes(t.tokenId));
        const needsPicker =
          selectableResidents.length >= 2 &&
          new Set(selectableResidents.map(t => t.color)).size >= 2;
        const isPickerOpen = needsPicker && pickerCell === key;

        return (
          <div
            key={key}
            className={`ludo-cell ${showStar ? 'safe-star' : ''}`}
            style={{ gridRow: row + 1, gridColumn: col + 1, background: bg }}
          >
            {arrow && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  fontSize: isStartCell ? 'clamp(11px, 2.4vmin, 18px)' : 'clamp(9px, 1.8vmin, 14px)',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isStartCell ? COLOR_DEEP[seatToDisplay[cellColor!]] : 'rgba(255,255,255,0.78)',
                  textShadow: isStartCell ? '0 1px 0 rgba(255,255,255,0.65)' : '0 1px 0 rgba(0,0,0,0.25)',
                  zIndex: 1,
                }}
              >
                {arrow}
              </span>
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              {/* Static residents lay out via stackPlacement off their
                  own count — the walking token never re-flows them. */}
              {residents.map((t, ti, arr) => (
                <LudoToken
                  key={t.tokenId}
                  tokenId={t.tokenId}
                  color={seatToDisplay[t.color]}
                  isSelectable={selectableTokenIds.includes(t.tokenId)}
                  stackIndex={ti}
                  stackSize={arr.length}
                  suppressClick={needsPicker}
                />
              ))}
              {/* Walking token (if any) renders solo on top of the cell
                  so a pass-through doesn't briefly resize the resident
                  tokens or flash the count badge. */}
              {walkers.map(t => (
                <LudoToken
                  key={t.tokenId}
                  tokenId={t.tokenId}
                  color={seatToDisplay[t.color]}
                  isSelectable={selectableTokenIds.includes(t.tokenId)}
                  stackIndex={0}
                  stackSize={1}
                />
              ))}
              {residents.length >= 2 && <StackCountBadge n={residents.length} />}
            </div>
            {/* Tap overlay: covers the whole cell when a mixed-colour
                teammate stack here has multiple selectable tokens.
                Captures the tap and opens the picker. zIndex must beat
                LudoToken's selectable zIndex (25). */}
            {needsPicker && !isPickerOpen && (
              <button
                type="button"
                aria-label="Choose token colour"
                onClick={() => setPicker({ cell: key, key: selectableKey })}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  zIndex: 30,
                }}
              />
            )}
            {isPickerOpen && (
              <ColourPickerPopup
                cellRow={row}
                options={selectableResidents.map(t => ({
                  tokenId: t.tokenId,
                  displayColor: seatToDisplay[t.color],
                }))}
                onPick={(tokenId) => { setPicker(null); selectToken(tokenId); }}
                onDismiss={() => setPicker(null)}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

// Floating coin-picker shown above (or below, near board edges) a
// mixed-colour teammate stack. Backdrop catches outside taps to
// dismiss; the popup itself stops propagation so taps on its buttons
// don't dismiss before the click handler fires.
interface ColourPickerPopupProps {
  cellRow: number;
  options: { tokenId: string; displayColor: PlayerColor }[];
  onPick: (tokenId: string) => void;
  onDismiss: () => void;
}

const ColourPickerPopup: React.FC<ColourPickerPopupProps> = ({ cellRow, options, onPick, onDismiss }) => {
  // Anchor below for top rows so the popup doesn't get clipped above
  // the board; otherwise anchor above the cell.
  const anchorBelow = cellRow <= 2;
  return (
    <>
      {/* Invisible full-board backdrop — dismiss on outside tap. */}
      <button
        type="button"
        aria-label="Dismiss picker"
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          border: 'none',
          padding: 0,
          zIndex: 40,
        }}
      />
      <div
        role="dialog"
        aria-label="Choose which token to move"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          [anchorBelow ? 'top' : 'bottom']: '110%',
          background: 'var(--bg-board-cream, #f5e9c8)',
          border: '2px solid var(--gold, #d4a017)',
          borderRadius: 10,
          padding: '6px 8px',
          display: 'flex',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          zIndex: 41,
          whiteSpace: 'nowrap',
        }}
      >
        {options.map(({ tokenId, displayColor }) => (
          <button
            key={tokenId}
            type="button"
            onClick={() => onPick(tokenId)}
            aria-label={`Move ${displayColor} token`}
            style={{
              width: 36,
              height: 36,
              padding: 2,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Coin color={PLAYER_COLORS[displayColor].bg} active />
          </button>
        ))}
      </div>
    </>
  );
};

export default LudoCells;
