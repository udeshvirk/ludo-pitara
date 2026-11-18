import type { CSSProperties } from 'react';
import { useGameMoments, type MomentGame } from '../../lib/gameMoments';

const looks = {
  capture: { icon: '✦', color: '#ffab72' },
  safe: { icon: '◇', color: '#7aead5' },
  home: { icon: '★', color: '#ffe18c' },
  snake: { icon: 'ϟ', color: '#e3a5ff' },
  ladder: { icon: '✧', color: '#8df4cd' },
};

export default function BoardMagic({ game }: { game: MomentGame }) {
  const moment = useGameMoments(s => s[game]);
  if (!moment || (moment.kind !== 'capture' && moment.kind !== 'home')) return null;
  const look = looks[moment.kind];
  return (
    <div key={moment.id} className={`board-magic magic-${moment.kind}`} aria-hidden="true"
      style={{ '--magic-color': look.color } as CSSProperties}>
      <div className="magic-origin" style={{ left: `${moment.x}%`, top: `${moment.y}%` }}>
        <i className="magic-ring" /><i className="magic-ring magic-ring-second" />
        <span className="magic-emblem">{look.icon}</span>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * Math.PI / 6;
          const radius = 35 + (i % 3) * 13;
          return <i key={i} className="magic-spark" style={{
            '--spark-x': `${Math.cos(angle) * radius}px`,
            '--spark-y': `${Math.sin(angle) * radius}px`,
            '--spark-delay': `${(i % 3) * 35}ms`,
          } as CSSProperties} />;
        })}
      </div>

    </div>
  );
}
