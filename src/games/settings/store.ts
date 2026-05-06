import { create } from 'zustand';
import { load, save } from '../../lib/persist';
import { setSoundEnabled } from '../../lib/sound';
import { setHapticsEnabled } from '../../lib/haptics';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type BoardTheme = 'cream' | 'night' | 'royal';
export type Language = 'en' | 'hi';

export interface Settings {
  sound: boolean;
  haptics: boolean;
  animationSpeed: AnimationSpeed;
  boardTheme: BoardTheme;
  language: Language;
}

const DEFAULTS: Settings = {
  sound: true,
  haptics: true,
  animationSpeed: 'normal',
  boardTheme: 'cream',
  language: 'en',
};

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

// Merge with defaults so newly added fields fill in for users with
// older persisted settings.
const initial: Settings = { ...DEFAULTS, ...load<Partial<Settings>>('settings', DEFAULTS) };
setSoundEnabled(initial.sound);
setHapticsEnabled(initial.haptics);

export const useSettings = create<SettingsStore>((set) => ({
  ...initial,
  set: (key, value) => {
    set({ [key]: value } as Partial<Settings>);
    if (key === 'sound') setSoundEnabled(value as boolean);
    if (key === 'haptics') setHapticsEnabled(value as boolean);
    const next = { ...useSettings.getState(), [key]: value };
    save('settings', extractSettings(next));
  },
  reset: () => {
    set(DEFAULTS);
    setSoundEnabled(DEFAULTS.sound);
    setHapticsEnabled(DEFAULTS.haptics);
    save('settings', DEFAULTS);
  },
}));

function extractSettings(s: SettingsStore): Settings {
  return {
    sound: s.sound,
    haptics: s.haptics,
    animationSpeed: s.animationSpeed,
    boardTheme: s.boardTheme,
    language: s.language,
  };
}

// Convenience for animation duration scaling.
export function speedMultiplier(speed: AnimationSpeed): number {
  return speed === 'slow' ? 1.5 : speed === 'fast' ? 0.6 : 1;
}
