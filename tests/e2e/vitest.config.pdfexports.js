import { resolve } from 'node:path'
import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

const sanitizedViteConfig = {
  ...viteConfig,
  plugins: (viteConfig.plugins ?? []).filter(
    (plugin) => !plugin?.name?.includes('dynamic-import'),
  ),
}

export default mergeConfig(
  sanitizedViteConfig,
  defineConfig({
    resolve: {
      alias: {
        testBrowser: resolve(__dirname, 'e2e'),
      },
    },
    test: {
      include: ['./tests/pdfexports/*.test.{js,ts}'],
      exclude: ['./tests/pdfexports/pdfexport.moule.test.ts'],
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          url: 'http://localhost:80/alea/',
        },
      },
      hookTimeout: 120_000,
      testTimeout: 3_600_000,
      reporters: ['html', 'junit', 'json', 'default'],
      outputFile: {
        junit: './logs/junit-report.xml',
        json: './logs/json-report.json',
        html: './logs/testconsole.html',
      },
      pool: 'threads',
      maxWorkers: 1,
      isolate: false,
      disableConsoleIntercept: true,
    },
  }),
)
