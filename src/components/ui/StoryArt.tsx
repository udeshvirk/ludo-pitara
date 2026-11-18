// Local vector emblems for the three games; no network assets.
export default function StoryArt({ kind }: { kind: 'ludo' | 'snl' | 'dice' }) {
  return (
    <svg viewBox="0 0 180 150" fill="none" aria-hidden="true">
      <circle cx="90" cy="75" r="62" stroke="#c8a66d" strokeOpacity=".25" strokeWidth=".7" />
      <circle cx="90" cy="75" r="55" stroke="#c8a66d" strokeOpacity=".18" strokeDasharray="2 7" />
      <path d="M90 5V14M90 136V145M20 75H29M151 75H160" stroke="#c8a66d" strokeOpacity=".6" />
      {kind === 'ludo' ? <g transform="translate(90 75) rotate(-12)">
        <rect x="-44" y="-44" width="88" height="88" rx="9" fill="#211c2c" stroke="#ad8e5c" strokeWidth="2" />
        <path d="M-36-36H-8V-8H-36ZM8-36H36V-8H8ZM-36 8H-8V36H-36ZM8 8H36V36H8Z" fill="#c5b18b"/>
        <rect x="-33" y="-33" width="22" height="22" rx="5" fill="#cf304b"/>
        <rect x="11" y="-33" width="22" height="22" rx="5" fill="#12965b"/>
        <rect x="-33" y="11" width="22" height="22" rx="5" fill="#286cd2"/>
        <rect x="11" y="11" width="22" height="22" rx="5" fill="#d7a719"/>
        <path d="M-5-36H5V36H-5ZM-36-5H36V5H-36Z" fill="#c5b18b"/>
        <path d="M0-11 11 0 0 11-11 0Z" fill="#bd9957" stroke="#e1c994"/>
        {[-22,22].flatMap(x=>[-22,22].map(y=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="6" fill="#191722" opacity=".4"/><circle cx={x} cy={y-1} r="5" fill="#d8c49a"/><circle cx={x} cy={y-1} r="2.5" fill="#66513b"/></g>))}
      </g> : kind === 'snl' ? <g>
        <g strokeLinecap="round"><path d="M37 126 73 29M51 131 87 34" stroke="#7e5e36" strokeWidth="6"/><path d="M37 125 73 29M51 130 87 34M44 111 57 116M51 92 64 97M58 73 71 78M65 54 78 59" stroke="#c8a66d" strokeWidth="3"/></g>
        <path d="M130 130C69 126 151 94 118 80S94 56 126 45" stroke="#112825" strokeWidth="19" strokeLinecap="round"/>
        <path d="M130 128C72 124 153 92 120 78S96 54 128 43" stroke="#198b4d" strokeWidth="14" strokeLinecap="round"/>
        <path d="M130 128C72 124 153 92 120 78S96 54 128 43" stroke="#a7b879" strokeWidth="5" strokeDasharray="1 4" opacity=".55"/>
        <path d="M118 49Q106 38 119 23L130 17 142 28Q148 40 135 49Z" fill="#198b4d" stroke="#132d26" strokeWidth="2"/>
        <path d="M118 31 127 34 120 37ZM139 29 131 34 139 35Z" fill="#dfb75a"/>
        <path d="M123 32V36M135 31V35" stroke="#161b1e" strokeWidth="2"/>
        <path d="M130 19V10M130 10 126 6M130 10 134 6" stroke="#bf5261" strokeWidth="1.5" strokeLinecap="round"/>
      </g> : <g transform="rotate(-15 90 75)">
        <rect x="45" y="31" width="90" height="90" rx="17" fill="#79664b" stroke="#b19870"/>
        <rect x="45" y="25" width="90" height="90" rx="17" fill="#cfbf9d" stroke="#e3d1ad" strokeWidth="2"/>
        {[[67,47],[113,47],[90,70],[67,93],[113,93]].map(([x,y])=><g key={`${x}-${y}`}><circle cx={x} cy={y+1} r="8" fill="#ead8b0"/><circle cx={x} cy={y} r="7" fill="#302938"/></g>)}
      </g>}
      <path d="m32 31 1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5ZM146 108l1.2 3.8 3.8 1.2-3.8 1.2-1.2 3.8-1.2-3.8-3.8-1.2 3.8-1.2Z" fill="#c8a66d" opacity=".8"/>
    </svg>
  );
}
