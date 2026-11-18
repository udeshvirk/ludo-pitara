import React from 'react';
import { PLAYER_COLORS, YARD_POSITIONS } from '../constants';
import type { PlayerColor } from '../types';
import LudoToken from './Token';
import { COLOR_DEEP, HOME_CORNERS, NAMEPLATE_LAYOUT } from './boardChrome';

interface YardOccupant { tokenId: string; isSelectable: boolean }

interface LudoYardsProps {
  // Seat → user-picked visual colour. Yards render with whichever
  // colour the seated player picked; empty seats fall through to a
  // leftover colour (per the seatToDisplay map) so all four corners
  // always show distinct colours.
  seatToDisplay: Record<PlayerColor, PlayerColor>;
  // Yard sockets keyed by seat, indexed by ORIGINAL token slot (0..3).
  // null = empty / token has left the yard.
  yardTokens: Record<PlayerColor, Array<YardOccupant | null>>;
  // Player names keyed by seat — empty seats simply have no nameplate.
  nameByColor: Partial<Record<PlayerColor, string>>;
}

const LudoYards: React.FC<LudoYardsProps> = ({ seatToDisplay, yardTokens, nameByColor }) => (
  <>
    {(Object.keys(HOME_CORNERS) as PlayerColor[]).map(color => {
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
          className="castle-yard"
          style={{
            gridRow: `${corner.row + 1} / span 6`,
            gridColumn: `${corner.col + 1} / span 6`,
            background: `radial-gradient(ellipse at 25% 0%, ${colors.bgLight}, transparent 70%), linear-gradient(150deg, ${colors.bg}, ${deep})`,
            border: `1px solid ${deep}50`,
            padding: '14%',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <svg className="yard-castle-art" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M8 30V8H30M70 8H92V30M92 70V92H70M30 92H8V70" fill="none" stroke="#ecd4a0" strokeWidth=".7" opacity=".5"/>
            <path d="m50 4 5 4-5 4-5-4Zm0 84 5 4-5 4-5-4ZM4 50l4-5 4 5-4 5Zm84 0 4-5 4 5-4 5Z" fill="#ecd4a0" opacity=".45"/>
          </svg>
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
            background: 'linear-gradient(145deg, #efdfb9, #d5b979)',
            position: 'relative',
            boxShadow: '0 3px 0 #0002, inset 0 1px 0 #eadcc080',
            border: `1px solid #a18a66`,
            borderRadius: 16,
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
                    background: `${colors.bg}35`,
                    border: `2px solid ${colors.bg}70`,
                    borderRadius: '50%',
                    boxShadow:
                      'inset 0 2px 3px rgba(63,45,109,0.12), 0 1px 0 #e0d2b8',
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
