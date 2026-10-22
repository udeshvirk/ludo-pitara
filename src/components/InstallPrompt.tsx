import React from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from './ui/Btn';
import { useInstallStatus, install } from '../lib/install';

// "Install app" button. Hidden once the app is installed. Where the
// browser offers a native install prompt we fire it directly; everywhere
// else (iOS, Samsung, Firefox, in-app browsers…) it opens the /install
// guide with steps for that browser.
const InstallPrompt: React.FC<{ variant?: 'pill' | 'inline' }> = ({ variant = 'pill' }) => {
  const status = useInstallStatus();
  const navigate = useNavigate();

  if (status.kind === 'installed') return null;

  const onClick = async () => {
    if (status.kind === 'prompt') await install();
    else navigate('/install');
  };

  if (variant === 'inline') {
    return <Btn variant="ghost" small onClick={onClick}>Install app</Btn>;
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid rgba(255, 138, 61, 0.5)',
        background: 'rgba(255, 138, 61, 0.10)',
        color: 'var(--saffron)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      Install app
    </button>
  );
};

export default InstallPrompt;
