import React from 'react';
import Card from './Card';
import Toggle from './Toggle';

// Card with a leading control (toggle by default) + label + description.
// Used by the Game Options panel and the Settings page.
//
// Either supply a `checked` + `onChange` pair (renders a Toggle), or
// supply a custom `control` node for richer affordances like a
// SegmentedPicker. `active` drives the saffron highlight regardless of
// which control variant is in use.
interface OptionTileProps {
  label: string;
  description?: string;
  active?: boolean;
  // Toggle variant
  checked?: boolean;
  onChange?: (v: boolean) => void;
  // Custom-control variant (rendered AFTER the label/desc block)
  control?: React.ReactNode;
}

const OptionTile: React.FC<OptionTileProps> = ({
  label, description, active, checked, onChange, control,
}) => {
  const isToggle = onChange !== undefined && checked !== undefined;
  const isActive = active ?? (isToggle ? !!checked : false);

  return (
    <Card active={isActive}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {isToggle && (
          <Toggle checked={!!checked} onChange={onChange!} size="sm" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
            {label}
          </div>
          {description && (
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.4 }}>
              {description}
            </div>
          )}
          {control && (
            <div style={{ marginTop: 10 }}>{control}</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OptionTile;
