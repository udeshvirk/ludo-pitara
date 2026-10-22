import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import {
  currentPlatform,
  install,
  isStandalone,
  useInstallStatus,
  type InstallPlatform,
} from '../lib/install';

// Shareable install guide (linked from social posts as /#/install).
// Shows the steps for the visitor's own browser first, then the rest
// behind expandable sections for people helping someone else.

// Small inline glyphs so steps can say "tap [icon]" without assets.
const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-2px' }} aria-label="Share">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);
const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong style={{ color: 'var(--gold-hi)', whiteSpace: 'nowrap' }}>{children}</strong>
);

interface Guide {
  title: string;
  steps: React.ReactNode[];
  note?: React.ReactNode;
}

const GUIDES: Record<Exclude<InstallPlatform, 'in-app'>, Guide> = {
  'ios-safari': {
    title: 'iPhone & iPad · Safari',
    steps: [
      <>Tap the <Key>Share <ShareIcon /></Key> button (bottom of the screen on iPhone, top on iPad).</>,
      <>Scroll down and tap <Key>Add to Home Screen</Key>.</>,
      <>Tap <Key>Add</Key>. Ludo Pitara now opens from your home screen like any app.</>,
    ],
    note: <>Don't see "Add to Home Screen"? Tap <Key>Edit Actions</Key> at the bottom of the share sheet and add it.</>,
  },
  'ios-other': {
    title: 'iPhone & iPad · Chrome, Edge, Firefox',
    steps: [
      <>Tap the <Key>Share <ShareIcon /></Key> button in the address bar.</>,
      <>Tap <Key>Add to Home Screen</Key> (you may need to tap <Key>More</Key> first).</>,
      <>Tap <Key>Add</Key>.</>,
    ],
    note: <>Needs iOS 16.4 or newer. On older iPhones, open this page in Safari instead.</>,
  },
  'android-chrome': {
    title: 'Android · Chrome',
    steps: [
      <>Tap the <Key>⋮</Key> menu in the top-right corner.</>,
      <>Tap <Key>Install app</Key> or <Key>Add to Home screen</Key>.</>,
      <>Tap <Key>Install</Key>. The app appears in your app drawer and home screen.</>,
    ],
  },
  'android-samsung': {
    title: 'Android · Samsung Internet',
    steps: [
      <>Tap the <Key>☰</Key> menu at the bottom of the screen.</>,
      <>Tap <Key>Add page to</Key>, then <Key>Home screen</Key>.</>,
      <>Tap <Key>Add</Key>.</>,
    ],
    note: <>You may also see an install icon inside the address bar — tapping it does the same thing.</>,
  },
  'android-firefox': {
    title: 'Android · Firefox',
    steps: [
      <>Tap the <Key>⋮</Key> menu.</>,
      <>Tap <Key>Add app to Home screen</Key> (or <Key>Install</Key>).</>,
      <>Confirm with <Key>Add</Key>.</>,
    ],
  },
  'android-other': {
    title: 'Android · other browsers',
    steps: [
      <>Open the browser menu (usually <Key>⋮</Key> or <Key>☰</Key>).</>,
      <>Look for <Key>Add to Home screen</Key> or <Key>Install app</Key>.</>,
      <>Confirm.</>,
    ],
    note: <>If your browser has no such option, open this page in Chrome.</>,
  },
  'desktop-chromium': {
    title: 'Computer · Chrome, Edge, Brave',
    steps: [
      <>Click the <Key>install icon</Key> at the right end of the address bar (a small screen with a down-arrow).</>,
      <>Click <Key>Install</Key>.</>,
    ],
    note: <>No icon? Chrome: <Key>⋮</Key> → <Key>Cast, save and share</Key> → <Key>Install page as app</Key>. Edge: <Key>⋯</Key> → <Key>Apps</Key> → <Key>Install this site as an app</Key>.</>,
  },
  'desktop-safari': {
    title: 'Mac · Safari',
    steps: [
      <>In the menu bar, click <Key>File</Key> → <Key>Add to Dock</Key>.</>,
      <>Click <Key>Add</Key>.</>,
    ],
    note: <>Needs macOS Sonoma (14) or newer.</>,
  },
  'desktop-other': {
    title: 'Computer · Firefox & others',
    steps: [
      <>Firefox on desktop can't install web apps. Open this page in <Key>Chrome</Key> or <Key>Edge</Key> and follow their steps.</>,
      <>Or just bookmark it — after your first visit the game still loads without internet.</>,
    ],
  },
};

const GROUPS: { label: string; keys: (keyof typeof GUIDES)[] }[] = [
  { label: 'iPhone & iPad', keys: ['ios-safari', 'ios-other'] },
  { label: 'Android', keys: ['android-chrome', 'android-samsung', 'android-firefox', 'android-other'] },
  { label: 'Computer', keys: ['desktop-chromium', 'desktop-safari', 'desktop-other'] },
];

const PERKS = [
  ['📴', 'Plays offline', 'Works with no internet once installed.'],
  ['🚫', 'No ads, ever', 'No banners, no videos, no pop-ups.'],
  ['🔒', 'No sign-up', 'No account, no tracking. Your games stay on your device.'],
  ['⚡', 'Full screen', 'Opens like a normal app from your home screen.'],
];

const card: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  background: 'var(--bg-card)',
  border: '1px solid rgba(255,255,255,0.10)',
};

const StepList: React.FC<{ guide: Guide }> = ({ guide }) => (
  <>
    <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {guide.steps.map((s, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(180deg, #ffa771, var(--saffron))',
            color: '#fff', fontWeight: 800, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{i + 1}</span>
          <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)', paddingTop: 2 }}>{s}</span>
        </li>
      ))}
    </ol>
    {guide.note && (
      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.45, color: 'var(--ink-dim)' }}>{guide.note}</div>
    )}
  </>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
    textTransform: 'uppercase', color: 'var(--ink-dim)', margin: '22px 0 10px 6px',
  }}>{children}</div>
);

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useInstallStatus();
  const [platform] = useState(currentPlatform);
  const [installed] = useState(isStandalone);
  const [copied, setCopied] = useState(false);

  // Visitors arriving straight from a shared link have no history to
  // go back to, so send them to the game list instead.
  const goBack = () => (location.key === 'default' ? navigate('/select') : navigate(-1));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked inside some in-app browsers; the URL
      // is still visible in the address bar, so fail quietly.
    }
  };

  const mine = platform === 'in-app' ? null : GUIDES[platform];

  return (
    <PhoneShell contentMaxWidth={560}>
      <Header title="Install the app" onBack={goBack} />

      <div style={{ flex: 1, padding: '0 22px 32px', overflow: 'auto' }}>
        <p style={{ margin: '0 4px 16px', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-dim)' }}>
          Ludo Pitara is free Ludo and Snakes &amp; Ladders that installs straight from your browser — no app store needed.
        </p>

        {installed ? (
          <div style={{ ...card, borderColor: 'rgba(46,157,79,0.6)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>✅ You're all set</div>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.45 }}>
              You're already using the installed app.
            </div>
          </div>
        ) : status.kind === 'prompt' ? (
          <div style={card}>
            <div style={{ fontSize: 14, color: 'var(--ink-dim)', marginBottom: 12, lineHeight: 1.45 }}>
              Your browser can install it in one tap:
            </div>
            <Btn variant="primary" fullWidth onClick={() => { void install(); }}>Install Ludo Pitara</Btn>
          </div>
        ) : platform === 'in-app' ? (
          <div style={{ ...card, borderColor: 'rgba(255,138,61,0.6)', background: 'rgba(255,138,61,0.10)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19 }}>Open in your browser first</div>
            <div style={{ marginTop: 6, marginBottom: 14, fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.45 }}>
              You opened this link inside an app (like X, Instagram or Facebook). Their built-in browser can't install apps.
            </div>
            <StepList guide={{
              title: '',
              steps: [
                <>Tap the <Key>⋯</Key> or <Key>⋮</Key> menu (usually top-right), or the <Key>Share <ShareIcon /></Key> button.</>,
                <>Choose <Key>Open in browser</Key> (or <Key>Open in Safari</Key> / <Key>Chrome</Key>).</>,
                <>This page opens again with the right install steps.</>,
              ],
            }} />
            <div style={{ marginTop: 14 }}>
              <Btn variant="ghost" small onClick={copyLink}>{copied ? 'Link copied ✓' : 'Copy link'}</Btn>
            </div>
          </div>
        ) : mine ? (
          <div style={card}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginBottom: 14 }}>
              {mine.title}
            </div>
            <StepList guide={mine} />
          </div>
        ) : null}

        <SectionLabel>Why install</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {PERKS.map(([icon, title, body]) => (
            <div key={title} style={{ ...card, padding: 14, display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
                <div style={{ marginTop: 3, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.4 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <SectionLabel>Other devices</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GROUPS.map(group => (
            <details key={group.label} style={{ ...card, padding: 0 }}>
              <summary style={{ padding: 16, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>{group.label}</summary>
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {group.keys.map(k => (
                  <div key={k}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink-dim)', marginBottom: 10 }}>{GUIDES[k].title}</div>
                    <StepList guide={GUIDES[k]} />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div style={{ marginTop: 26 }}>
          <Btn variant={installed ? 'primary' : 'ghost'} fullWidth onClick={() => navigate('/select')}>
            {installed ? 'Play now' : 'Skip — play in the browser'}
          </Btn>
        </div>
      </div>
    </PhoneShell>
  );
};

export default InstallPage;
