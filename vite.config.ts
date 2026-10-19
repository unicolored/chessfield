import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Externalize three.js core + examples/jsm addons + rxjs
const external = [
  'three',
  'three/webgpu',
  'three/tsl',
  //'three/addons/inspector/Inspector.js',
  'three/examples/jsm/controls/OrbitControls.js',
  'three/examples/jsm/loaders/DRACOLoader.js',
  'three/examples/jsm/loaders/GLTFLoader.js',
  'three/examples/jsm/loaders/FontLoader.js',
  'three/examples/jsm/utils/BufferGeometryUtils.js',
  'three/examples/jsm/utils/SkeletonUtils.js',
  'three/examples/jsm/geometries/TextGeometry.js',
  '@lichess-org/chessground',
  'rxjs',
];

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/chessfield.ts'),
      name: 'Chessfield',
      fileName: format => (format === 'es' ? 'chessfield.js' : `chessfield.${format}.js`),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external,
      output: {
        globals: {
          three: 'THREE',
          'three/webgpu': 'THREE',
          'three/tsl': 'THREE',
          'three/addons/inspector/Inspector.js': 'THREE.Inspector',
          'three/examples/jsm/controls/OrbitControls.js': 'THREE.OrbitControls',
          'three/examples/jsm/loaders/DRACOLoader.js': 'THREE.DRACOLoader',
          'three/examples/jsm/loaders/GLTFLoader.js': 'THREE.GLTFLoader',
          'three/examples/jsm/loaders/FontLoader.js': 'THREE.FontLoader',
          'three/examples/jsm/utils/BufferGeometryUtils.js': 'THREE.BufferGeometryUtils',
          'three/examples/jsm/utils/SkeletonUtils.js': 'THREE.SkeletonUtils',
          'three/examples/jsm/geometries/TextGeometry.js': 'THREE.TextGeometry',
          '@lichess-org/chessground': 'Chessground',
          rxjs: 'rxjs',
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

  plugins: [
    dts({
      entryRoot: 'src',
      outDirs: 'dist',
      tsconfigPath: 'tsconfig.build.json',
      insertTypesEntry: true,
    }),
  ],

  publicDir: 'public',
});
