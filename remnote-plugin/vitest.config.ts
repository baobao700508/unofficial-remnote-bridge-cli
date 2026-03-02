import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules',
        'dist',
        'test',
        '**/*.config.ts',
        '**/*.config.js',
        'public',
        'src/widgets/**/*.tsx',
      ],
    },
  },
});
