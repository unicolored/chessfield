import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/chessfield.ts'),
      name: 'Chessfield',
      fileName: (format) => `chessfield.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['three', '@lichess-org/chessground'],
      output: {
        globals: {
          three: 'THREE',
          '@lichess-org/chessground': 'Chessground',
        },
      },
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },

  server: {
    port: 8000,
    https: {
      key: path.resolve(__dirname, 'localhost-key.pem'),
      cert: path.resolve(__dirname, 'localhost.pem'),
    },
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 8000,
    },
  },

  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.json'],

  resolve: {
    alias: {
      'three/webgpu': 'three/webgpu',
      'three/examples/jsm/': 'three/examples/jsm/',
    },
  },

  plugins: [],

  publicDir: 'public',
});