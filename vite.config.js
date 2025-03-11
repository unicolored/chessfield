import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/chessfield.ts'),
            name: 'Chessfield', // Global name for UMD/CDN
            fileName: (format) => `chessfield${format === 'umd' ? '.umd' : ''}.js`,
            formats: ['es', 'umd']
        },
        rollupOptions: {
            output: {
                exports: "named",
            },
        },
        sourcemap: true,
        minify: "terser"
    },
    assetsInclude: ['**/*.glb'], // Ensure .glb files are treated as assets
    plugins: [dts({ entryRoot: 'src', outputDir: 'dist' })]
})
