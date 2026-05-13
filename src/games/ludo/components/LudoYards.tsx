import React from 'react';
import { PLAYER_COLORS, YARD_POSITIONS } from '../constants';
import type { PlayerColor } from '../types';
import LudoToken from './Token';
import { COLOR_DEEP, HOME_CORNERS, NAMEPLATE_LAYOUT } from './boardChrome';

interface YardOccupant { tokenId: string; isSelectable: boolean }

interface LudoYardsProps {
  // Seat → user-picked visual colour. Yards render with whichever
  // colour the seated player picked (with empty seats falling through
  // to a random leftover colour per the seatToDisplay map).
  seatToDisplay: Record<PlayerColor, PlayerColor>;
  // Yard sockets keyed by seat, indexed by ORIGINAL token slot (0..3).
  // null = empty / token has left the yard.
  yardTokens: Record<PlayerColor, Array<YardOccupant | null>>;
  // Player names keyed by seat — empty seats have no nameplate.
  nameByColor: Partial<Record<PlayerColor, string>>;
  // Set of seats that have an active player. Empty seats render their
  // colour for visual continuity but skip the nameplate.
  activeSeats: Set<PlayerColor>;
}

const LudoYards: React.FC<LudoYardsProps> = ({ seatToDisplay, yardTokens, nameByColor, activeSeats }) => (
  <>
    {(Object.keys(HOME_CORNERS) as PlayerColor[]).map(color => {
      if (!activeSeats.has(color)) return null;
      const corner = HOME_CORNERS[color];
      // Yard rendering uses the seated player's chosen display colour,
      // so picking "red" for the BL slot makes the BL yard render red
      // (despite the seat key historically being 'blue').
      const visual = seatToDisplay[color];
      const colors = PLAYER_COLORS[visual];
      const deep = COLOR_DEEP[visual];
      const yard = yardTokens[color];
      const name = nameByColor[color];
      const nameplate = NAMEPLATE_LAYOUT[color];
      return (
        <div
          key={color}
          style={{
            gridRow: `${corner.row + 1} / span 6`,
            gridColumn: `${corner.col + 1} / span 6`,
            background: `linear-gradient(135deg, ${colors.bg}, ${deep})`,
            border: `2px solid ${deep}`,
            padding: '14%',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {name && (
            <div
              style={{
                position: 'absolute',
                ...nameplate.position,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  transform: nameplate.rotation,
                  transformOrigin: 'center center',
                  whiteSpace: 'nowrap',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 'clamp(11px, 2vmin, 17px)',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              >
                {name}
              </span>
            </div>
          )}
          <div style={{
            width: '100%', height: '100%',
            background: 'var(--bg-board-cream)',
            border: `1.5px solid ${deep}`,
            borderRadius: 6,
            padding: '10%',
            boxSizing: 'border-box',
          }}>
            <div style={{
              width: '100%', height: '100%',
              display: 'grid',
              gridTemplate: '1fr 1fr / 1fr 1fr',
              gap: '14%',
            }}>
              {YARD_POSITIONS[color].map((_, slot) => {
                const occupant = yard[slot];
                return (
                  <div key={slot} style={{
                    // Recessed socket: top-inset shadow simulates the
                    // far wall of a well; bottom inset highlight is
                    // light reflecting off the near rim. Combined with
                    // the coloured ring border, the token reads as
                    // sitting inside a hole rather than on top of a
                    // flat disc.
                    background: colors.bg,
                    border: `2px solid ${deep}`,
                    borderRadius: '50%',
                    boxShadow:
                      'inset 0 5px 8px rgba(0,0,0,0.40), ' +
                      'inset 0 -2px 2px rgba(255,255,255,0.30), ' +
                      '0 1px 0 rgba(255,255,255,0.45)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {occupant && (
                      <LudoToken
                        tokenId={occupant.tokenId}
                        color={visual}
                        isSelectable={occupant.isSelectable}
                        stackIndex={0}
                        stackSize={1}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    })}
  </>
);

export default LudoYards;
