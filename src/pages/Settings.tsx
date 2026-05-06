import React from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import { useSettings, type AnimationSpeed, type BoardTheme, type Language } from '../games/settings/store';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const settings = useSettings();

  return (
    <PhoneShell>
      <Header title="Settings" onBack={() => navigate(-1)} />

      <div style={{ flex: 1, padding: '8px 22px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Section title="Audio & motion">
          <Toggle label="Sound effects" sub="Synthesized in-browser" value={settings.sound} onChange={v => settings.set('sound', v)} />
          <Toggle label="Haptic feedback" sub="Vibration on actions" value={settings.haptics} onChange={v => settings.set('haptics', v)} />
          <Picker<AnimationSpeed>
            label="Animation speed"
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'normal', label: 'Normal' },
              { value: 'fast', label: 'Fast' },
            ]}
            value={settings.animationSpeed}
            onChange={v => settings.set('animationSpeed', v)}
          />
        </Section>

        <Section title="Board">
          <Picker<BoardTheme>
            label="Theme"
            options={[
              { value: 'cream', label: 'Cream' },
              { value: 'night', label: 'Night' },
              { value: 'royal', label: 'Royal' },
            ]}
            value={settings.boardTheme}
            onChange={v => settings.set('boardTheme', v)}
          />
          <Picker<Language>
            label="Language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी' },
            ]}
            value={settings.language}
            onChange={v => settings.set('language', v)}
          />
        </Section>

        <Section title="Data">
          <Btn variant="danger" onClick={settings.reset}>Reset all settings</Btn>
        </Section>

        <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 6 }}>
          Ludo Pitara v1.0 · made offline
        </div>
      </div>
    </PhoneShell>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 10, paddingLeft: 6 }}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
  </div>
);

const Toggle: React.FC<{ label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, sub, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        width: 48, height: 28, borderRadius: 999,
        background: value ? 'var(--saffron)' : 'rgba(255,255,255,0.16)',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.18s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: value ? 23 : 3,
        width: 22, height: 22,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'left 0.18s',
      }} />
    </button>
  </div>
);

interface PickerProps<T extends string> {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}
function Picker<T extends string>({ label, options, value, onChange }: PickerProps<T>) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 999,
              border: '1px solid ' + (value === opt.value ? 'var(--saffron)' : 'rgba(255,255,255,0.10)'),
              background: value === opt.value ? 'rgba(255, 138, 61, 0.16)' : 'transparent',
              color: value === opt.value ? 'var(--saffron)' : 'var(--ink-dim)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SettingsPage;
