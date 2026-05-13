import React from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import Section from '../components/ui/Section';
import OptionTile from '../components/ui/OptionTile';
import { useSettings } from '../games/settings/store';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const settings = useSettings();

  return (
    <PhoneShell contentMaxWidth={560}>
      <Header title="Settings" onBack={() => navigate(-1)} />

      <div style={{ flex: 1, padding: '8px 22px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Section title="Audio & motion">
          <OptionTile
            label="Sound effects"
            description="Synthesized in-browser"
            checked={settings.sound}
            onChange={v => settings.set('sound', v)}
          />
          <OptionTile
            label="Haptic feedback"
            description="Vibration on actions"
            checked={settings.haptics}
            onChange={v => settings.set('haptics', v)}
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

export default SettingsPage;
