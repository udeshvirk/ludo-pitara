// Cross-platform "Install this app" detection.
//
// Chrome / Edge / Android: fires `beforeinstallprompt` which we capture and
// replay when the user taps our button.
//
// iOS Safari: no `beforeinstallprompt`. We detect iOS, check that we're not
// already running standalone, and surface a manual hint instead.

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

export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPhone / iPad / iPod, plus iPadOS 13+ which masquerades as Mac.
  const iOSlike = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);
  if (!iOSlike) return false;
  // Treat any WebKit-based iOS browser the same — they all use Safari's
  // Add to Home Screen path.
  return /Safari/i.test(ua) || /CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS uses a non-standard navigator.standalone flag.
  const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const cssStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  return navStandalone || cssStandalone;
}

export type InstallStatus =
  | { kind: 'unavailable' } // already installed, or browser doesn't support installing
  | { kind: 'prompt' }      // beforeinstallprompt is queued — call install()
  | { kind: 'ios-hint' };   // iOS Safari — show the manual hint

export function useInstallStatus(): InstallStatus {
  const [, force] = useState(0);

  useEffect(() => {
    const cb = () => force(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  if (isStandalone()) return { kind: 'unavailable' };
  if (deferred) return { kind: 'prompt' };
  if (isIOSSafari()) return { kind: 'ios-hint' };
  return { kind: 'unavailable' };
}

export async function install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach(l => l());
  return outcome;
}
