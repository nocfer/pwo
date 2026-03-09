import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'hooks/**/*.ts', 'context/**/*.tsx']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Test-only mock — Vite resolves react-native imports to our mock during vitest runs
      'react-native': path.resolve(__dirname, './__mocks__/react-native.ts')
    }
  }
})
