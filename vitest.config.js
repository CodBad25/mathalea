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
    testTimeout: 300000,
    server: {
      deps: {
        inline: ['@cortex-js/compute-engine'],
      },
    },
  },
})
