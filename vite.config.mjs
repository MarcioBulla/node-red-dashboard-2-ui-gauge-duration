import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
    plugins: [vue(), cssInjectedByJsPlugin()],
    build: {
        outDir: 'resources',
        lib: {
            entry: fileURLToPath(new URL('./ui/index.js', import.meta.url)),
            name: 'ui-gauge-duration',
            formats: ['umd'],
            fileName: () => 'ui-gauge-duration.umd.js'
        },
        rollupOptions: {
            external: ['vue', 'vuex'],
            output: { globals: { vue: 'Vue', vuex: 'vuex' } }
        }
    }
})
