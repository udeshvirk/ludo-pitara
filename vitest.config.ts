import { defineConfig } from 'vitest/config';

// Vitest runs without the full Vite plugins (PWA, tailwind) — those
// are app-only concerns. A separate config keeps the test bootstrap
// fast and avoids the prebuild icon-generation step.
export default defineConfig({
  test: {
    // jsdom would only be needed if we test React components; for now
    // every test target is a pure module, so `node` is faster.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: false,
  },
});
