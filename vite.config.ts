import { defineConfig } from 'vite';

export default defineConfig({
  base: '/phaser-tiny-world-adventure/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
