import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../games/settings/store';
import { playTap } from '../../lib/sound';
import { haptics } from '../../lib/haptics';

// Compact mute/unmute button intended as a Header action while a game
// is in progress — saves a trip to the Settings page when a kid is
// already mid-roll.
const SoundToggle: React.FC = () => {
  const sound = useSettings(s => s.sound);
  const setSetting = useSettings(s => s.set);
  const toggle = () => {
    // Tap sound BEFORE we flip the flag, so the press is audible when
    // muting. Once flipped, future taps stay silent.
    if (sound) playTap();
    haptics.tap();
    setSetting('sound', !sound);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={toggle}
      aria-label={sound ? 'Mute sound' : 'Unmute sound'}
      style={{
        width: 40,
        height: 40,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--ink)',
        padding: 0,
      }}
    >
      {sound ? (
        // speaker on
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 6.5h2.5L8 3.5v11L4.5 11.5H2v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M11.5 6c.9 1 .9 5 0 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M13.5 4c1.8 1.8 1.8 8.2 0 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        // speaker muted (cross)
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 6.5h2.5L8 3.5v11L4.5 11.5H2v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M11 6.5l5 5M16 6.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </motion.button>
  );
};

export default SoundToggle;
