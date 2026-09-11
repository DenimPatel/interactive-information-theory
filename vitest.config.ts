import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['{utils,content,routing}/**/*.test.ts'],
    environment: 'node',
  },
});
