import React from 'react';
import { motion } from 'framer-motion';
import { playTap } from '../../lib/sound';
import { haptics } from '../../lib/haptics';

type Variant = 'primary' | 'danger' | 'ghost' | 'soft';

interface BtnProps {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: Variant;
  small?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  // Imperative ref to the underlying button — used by WinnerModal for
  // focus management (autoFocus on open + 2-element focus trap).
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(180deg, #dcc393, #b99660)',
    color: '#241d16',
    boxShadow: '0 3px 0 #715735, 0 6px 14px #0003, inset 0 1px 0 #ead9b5',
    border: '1px solid rgba(255, 195, 150, 0.55)',
  },
  danger: {
    background: 'linear-gradient(180deg, #9c344c, #78253d)',
    color: '#fff',
    boxShadow: '0 6px 18px rgba(229, 57, 53, 0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
    border: '1px solid rgba(255, 180, 170, 0.4)',
  },
  ghost: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--ink)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  soft: {
    background: 'rgba(255, 255, 255, 0.10)',
    color: 'var(--ink)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
  },
};

const Btn: React.FC<BtnProps> = ({
  children,
  variant = 'soft',
  small,
  icon,
  fullWidth,
  onClick,
  style,
  className,
  disabled,
  type = 'button',
  buttonRef,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    playTap();
    haptics.tap();
    onClick?.(e);
  };

  return (
    <motion.button
      ref={buttonRef}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={handleClick}
      className={`pitara-button ${className || ''}`}
      type={type}
      disabled={disabled}
      aria-label={rest['aria-label']}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: small ? '10px 18px' : '15px 26px',
        borderRadius: 999,
        fontWeight: 600,
        letterSpacing: 0.2,
        fontSize: small ? 14 : 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        fontFamily: 'var(--font-display)',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.55 : 1,
        ...VARIANT_STYLES[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </motion.button>
  );
};

export default Btn;
