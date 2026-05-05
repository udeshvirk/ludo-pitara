import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface GameHeaderProps {
  title: string;
  onNewGame?: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ title, onNewGame }) => {
  const navigate = useNavigate();

  return (
    <motion.header
      className="flex items-center justify-between px-4 py-2 glass-strong"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Menu
      </button>

      <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        {title}
      </h1>

      {onNewGame && (
        <button
          onClick={onNewGame}
          className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 1 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          New
        </button>
      )}
    </motion.header>
  );
};

export default GameHeader;
