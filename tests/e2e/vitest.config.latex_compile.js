import { resolve } from 'node:path'
import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from '../../vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        testBrowser: resolve(__dirname, 'e2e'),
      },
    },
    test: {
      include: ['./tests/latex_compile/*.test.{js,ts}'],
      environment: 'jsdom',
      hookTimeout: 120_000,
      testTimeout: 1_200_000,
      pool: 'threads',
      maxWorkers: 1,
      isolate: false,
    },
  }),
)
