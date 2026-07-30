import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Relative base for GitHub Pages deployment
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', 'postprocessing'],
          'audio-vendor': ['howler'],
          'state-vendor': ['zustand'],
        },
      },
    },
  },
});
