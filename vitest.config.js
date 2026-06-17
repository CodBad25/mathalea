import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    conditions: ['browser'],
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/unit/setup-vitest.ts'],
    testTimeout: 18_000_000, // prévoir 5h pour les test effectués la nuit
    /*coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: ['tests/e2e/**', '.pnpm-store/**'],
    },*/
    server: {
      deps: {
        inline: ['@cortex-js/compute-engine', '@scratch2latex/scratch-core'],
      },
    },
  },
})
