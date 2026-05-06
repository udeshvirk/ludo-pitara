import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const games = [
  {
    id: 'ludo',
    title: 'Ludo',
    emoji: '🎲',
    description: 'Classic board game for 2-4 players',
    path: '/ludo',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
    features: ['2-4 Players', 'Capture & Safe Zones', 'Bonus Turns'],
  },
  {
    id: 'snl',
    title: 'Snake & Ladders',
    emoji: '🐍',
    description: 'Climb ladders, dodge snakes!',
    path: '/snakes-and-ladders',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
    shadowColor: 'rgba(34, 197, 94, 0.4)',
    features: ['2-4 Players', '9 Ladders & 10 Snakes', 'Classic Fun'],
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-0">
        {/* Logo / Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <motion.div
            className="text-5xl mb-3"
            animate={{
              rotate: [0, -5, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            🎲
          </motion.div>
          <h1
            className="text-4xl font-black tracking-tight mb-2"
            style={{
              fontFamily: 'Outfit, sans-serif',
              background: 'linear-gradient(135deg, #a78bfa, #6366f1, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ludo Pitara
          </h1>
          <p className="text-sm opacity-50 font-medium">
            Pass & Play Board Games
          </p>
        </motion.div>

        {/* Game Cards */}
        <div className="flex flex-col gap-6 w-full max-w-md mt-4">
          {games.map((game, index) => (
            <motion.button
              key={game.id}
              onClick={() => navigate(game.path)}
              className="relative w-full rounded-2xl p-6 text-left overflow-hidden border border-white/10"
              style={{
                background: game.gradient,
                boxShadow: `0 12px 40px ${game.shadowColor}`,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + index * 0.15,
                duration: 0.5,
                type: 'spring',
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl">{game.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-0.5">{game.title}</h2>
                    <p className="text-sm text-white/80">{game.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  {game.features.map(feature => (
                    <span
                      key={feature}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/20 text-white/90"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs opacity-30">
            Offline PWA • No internet needed
          </p>
          <div className="flex items-center justify-center gap-1 mt-1 opacity-20">
            <span className="text-[10px]">Built with</span>
            <span className="text-[10px]">❤️</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
