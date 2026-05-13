import React from 'react';
import { playTap } from '../../lib/sound';
import { haptics } from '../../lib/haptics';

// Pill-shaped segmented control. Used for player count (2/3/4) and
// bot difficulty. Previously duplicated as inline JSX in multiple
// places.

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedPickerProps<T extends string | number> {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (v: T) => void;
  // Visual size — `chunky` is used by the count selector at the top of
  // PlayerSetup; `compact` is for in-card pickers like Bot difficulty.
  size?: 'compact' | 'chunky';
  ariaLabel?: string;
}

function SegmentedPicker<T extends string | number>({
  options, value, onChange, size = 'compact', ariaLabel,
}: SegmentedPickerProps<T>) {
  const chunky = size === 'chunky';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: chunky ? 8 : 6,
        padding: chunky ? 4 : 0,
        borderRadius: 999,
        background: chunky ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: chunky ? '1px solid rgba(255,255,255,0.10)' : 'none',
      }}
    >
      {options.map(opt => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="radio"
            aria-checked={selected}
            onClick={() => { onChange(opt.value); playTap(); haptics.tap(); }}
            style={{
              flex: 1,
              padding: chunky ? '10px 0' : '8px 0',
              borderRadius: 999,
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: chunky ? 14 : 12,
              letterSpacing: chunky ? 0.4 : 0.4,
              textTransform: 'capitalize',
              color: selected ? (chunky ? '#fff' : 'var(--saffron)') : 'var(--ink-dim)',
              background: selected
                ? (chunky
                    ? 'linear-gradient(180deg, #ffa771, var(--saffron))'
                    : 'rgba(255, 138, 61, 0.16)')
                : 'transparent',
              boxShadow: selected && chunky ? 'inset 0 1px 0 rgba(255,255,255,0.35)' : 'none',
              border: chunky
                ? 'none'
                : '1px solid ' + (selected ? 'var(--saffron)' : 'rgba(255,255,255,0.10)'),
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedPicker;
