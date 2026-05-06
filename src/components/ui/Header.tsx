import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { playTap } from '../../lib/sound';
import { haptics } from '../../lib/haptics';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: (() => void) | null;
  action?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, action }) => {
  const navigate = useNavigate();
  const showBack = onBack !== null; // explicit null hides it
  const handleBack = () => {
    playTap();
    haptics.tap();
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px 14px',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={showBack ? handleBack : undefined}
        aria-label={showBack ? 'Back' : undefined}
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showBack ? 1 : 0,
          cursor: showBack ? 'pointer' : 'default',
          color: 'var(--ink)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
      <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: 0.2,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-dim)',
              marginTop: 2,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {action}
      </div>
    </div>
  );
};

export default Header;
