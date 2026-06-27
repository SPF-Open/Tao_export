import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { generateSitemap } from './scripts/generate-sitemap.mjs';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

const timeOption = { timeZone: "Europe/Brussels" };


export default defineConfig({
    plugins: [
        {
            name: 'generate-sitemap',
            apply: 'build',
            buildStart() {
                generateSitemap();
            }
        },
        tailwindcss(),
        sveltekit()
    ],
    define: {
        PKG: pkg,
        BUILD_DATE: JSON.stringify(new Date().toLocaleDateString("FR-fr", timeOption) + " - " + new Date().toLocaleTimeString("FR-fr", timeOption)),
    },
    optimizeDeps: {
        // sqlite-wasm ships its own .wasm and must not be pre-bundled by esbuild,
        // otherwise the worker fails to locate sqlite3.wasm at runtime.
        exclude: ['@sqlite.org/sqlite-wasm']
    },
    worker: {
        format: 'es'
    }
});
