import type React from 'react';
import type { PlayerColor } from '../types';

// Shared chrome constants for the Ludo board renderers (cells, yards,
// center wedges, flying captures). Kept in one place so any visual
// tweak ripples to all the surfaces.

export const COLOR_DEEP: Record<PlayerColor, string> = {
  red: '#9a1a18',
  green: '#185c2c',
  yellow: '#7a5a00',
  blue: '#0e3e7a',
};

// Path direction by colour — the triangle-glyph that points along the
// home stretch toward the centre, and identifies each colour's start
// cell entry direction. Both the start cell and the home-stretch cells
// use the same direction (each colour's stretch flows to the centre
// in the same direction the player enters the path).
export const PATH_ARROW: Record<PlayerColor, string> = {
  red: '▶',
  green: '▼',
  yellow: '◀',
  blue: '▲',
};

// Player home corner: 6×6 cells starting at the given (row, col).
export const HOME_CORNERS: Record<PlayerColor, { row: number; col: number }> = {
  red: { row: 0, col: 0 },
  green: { row: 0, col: 9 },
  yellow: { row: 9, col: 9 },
  blue: { row: 9, col: 0 },
};

// Nameplate position (relative to the coloured corner panel) and
// rotation. Each plate sits on the panel's outer edge — the side that
// faces away from the centre of the board — and rotates so it reads
// "facing the player's seat" (Ludo-King style):
//   blue   (bottom-left)  → bottom edge, 0°
//   red    (top-left)     → left edge,   90° CW
//   green  (top-right)    → top edge,    180°
//   yellow (bottom-right) → right edge, 270° (-90°)
export const NAMEPLATE_LAYOUT: Record<PlayerColor, {
  position: React.CSSProperties;
  rotation: string;
}> = {
  blue:   { position: { left: 0, right: 0, bottom: 0, height: '14%' }, rotation: 'rotate(0deg)'   },
  red:    { position: { left: 0, top: 0, bottom: 0, width: '14%' },    rotation: 'rotate(90deg)'  },
  green:  { position: { left: 0, right: 0, top: 0, height: '14%' },    rotation: 'rotate(180deg)' },
  yellow: { position: { right: 0, top: 0, bottom: 0, width: '14%' },   rotation: 'rotate(-90deg)' },
};

// Identity fallback for seats with no player (2/3-player games leave
// some yards empty). Lets `seatToDisplay[seat]` always return a key
// that PLAYER_COLORS / COLOR_DEEP can be indexed with.
export const IDENTITY_SEAT_MAP: Record<PlayerColor, PlayerColor> = {
  red: 'red', green: 'green', yellow: 'yellow', blue: 'blue',
};
