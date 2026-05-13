import React from 'react';

// Catches descendant render / lifecycle errors so one bad component
// doesn't brick the whole app. The fallback offers two recoveries:
//   - "Go home" hard-reloads to the splash route (clearing in-memory
//     state but keeping localStorage; resumes work as normal).
//   - "Reload" hard-refreshes the tab in case the underlying issue is
//     a stale service-worker / chunk.
// We deliberately keep this client-side only (no telemetry) so the
// PWA stays fully offline.

interface ErrorBoundaryState {
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No remote telemetry — the app is offline-first. Log to the
    // browser console so a developer inspecting can still see the
    // stack trace.
    console.error('Ludo Pitara crashed:', error, info.componentStack);
  }

  private goHome = () => {
    // Hard navigation rather than react-router; the goal is to leave
    // the broken render tree behind entirely.
    window.location.href = import.meta.env.BASE_URL || '/';
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          textAlign: 'center',
          background: 'var(--bg-deep)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 32,
            lineHeight: 1.05,
            marginBottom: 8,
          }}
        >
          Something went wrong
        </div>
        <div
          style={{
            color: 'var(--ink-dim)',
            fontSize: 14,
            maxWidth: 360,
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          The game hit an unexpected error. Your saved games are still in storage — try heading back home or reloading.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
          <button
            type="button"
            onClick={this.goHome}
            style={{
              padding: '14px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255, 195, 150, 0.55)',
              background: 'linear-gradient(180deg, #ffa771, var(--saffron) 55%, #c25a1f)',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Go home
          </button>
          <button
            type="button"
            onClick={this.reload}
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255, 255, 255, 0.16)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>

        {/* Error details — useful when a friend reports a bug, hidden
            by default so the fallback stays calm. */}
        <details style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-faint)', maxWidth: 360 }}>
          <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-ui)', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>
            Error details
          </summary>
          <pre
            style={{
              marginTop: 10,
              padding: 10,
              background: 'rgba(0, 0, 0, 0.28)',
              borderRadius: 10,
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--ink-dim)',
            }}
          >
            {this.state.error.name}: {this.state.error.message}
          </pre>
        </details>
      </div>
    );
  }
}

export default ErrorBoundary;
