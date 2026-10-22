// Cross-platform "Install this app" detection.
//
// Chrome / Edge / Android: fires `beforeinstallprompt` which we capture and
// replay when the user taps our button.
//
// Everywhere else (iOS, Samsung, Firefox, in-app browsers): no native
// prompt, so the UI links to the /install guide. `detectPlatform` picks
// which set of manual steps to show first.

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach(l => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach(l => l());
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS uses a non-standard navigator.standalone flag.
  const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const cssStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  return navStandalone || cssStandalone;
}

// Which set of manual "add to home screen" steps fits this browser.
// Pure on the user-agent string so it can be unit-tested.
export type InstallPlatform =
  | 'in-app'          // X / Instagram / Facebook etc. webview — can't install at all
  | 'ios-safari'
  | 'ios-other'       // Chrome / Firefox / Edge on iOS (iOS 16.4+ supports Add to Home Screen)
  | 'android-chrome'
  | 'android-samsung'
  | 'android-firefox'
  | 'android-other'
  | 'desktop-chromium' // Chrome / Edge / Brave / Opera
  | 'desktop-safari'
  | 'desktop-other';

export function detectPlatform(ua: string, iPadAsMac = false): InstallPlatform {
  // Social apps' built-in browsers identify themselves in the UA.
  if (/FBAN|FBAV|FB_IAB|Instagram|Twitter|TwitterAndroid|LinkedInApp|Snapchat|musical_ly|TikTok|Line\/|Pinterest/i.test(ua)) {
    return 'in-app';
  }
  const iOS = /iPad|iPhone|iPod/.test(ua) || iPadAsMac;
  if (iOS) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return 'ios-other';
    // A real Safari UA carries "Safari/"; app webviews (incl. X) usually don't.
    if (/Safari\//.test(ua)) return 'ios-safari';
    return 'in-app';
  }
  if (/Android/i.test(ua)) {
    if (/; wv\)/.test(ua)) return 'in-app'; // Android WebView
    if (/SamsungBrowser/i.test(ua)) return 'android-samsung';
    if (/Firefox/i.test(ua)) return 'android-firefox';
    if (/Chrome\//.test(ua) && !/OPR\/|EdgA|YaBrowser|UCBrowser|MiuiBrowser/i.test(ua)) return 'android-chrome';
    return 'android-other';
  }
  if (/Chrome\/|Chromium|Edg\//.test(ua) && !/Firefox/.test(ua)) return 'desktop-chromium';
  if (/Safari\//.test(ua) && /Macintosh/.test(ua)) return 'desktop-safari';
  return 'desktop-other';
}

export function currentPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'desktop-other';
  const iPadAsMac = navigator.platform === 'MacIntel' &&
    ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1;
  return detectPlatform(navigator.userAgent, iPadAsMac);
}

export type InstallStatus =
  | { kind: 'installed' } // running as the installed app
  | { kind: 'prompt' }    // beforeinstallprompt is queued — call install()
  | { kind: 'manual' };   // no native prompt — show the /install guide

export function useInstallStatus(): InstallStatus {
  const [, force] = useState(0);

  useEffect(() => {
    const cb = () => force(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  if (isStandalone()) return { kind: 'installed' };
  if (deferred) return { kind: 'prompt' };
  return { kind: 'manual' };
}

export async function install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach(l => l());
  return outcome;
}
