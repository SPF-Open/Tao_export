import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
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
    },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/**/__tests__/**/*.test.ts'],
                    exclude: ['src/**/*.svelte.test.ts']
                }
            },
            {
                extends: true,
                resolve: {
                    conditions: ['browser']
                },
                test: {
                    name: 'component',
                    environment: 'jsdom',
                    include: ['src/**/*.svelte.test.ts'],
                    setupFiles: ['./vitest-setup-client.ts']
                }
            }
        ]
    }
});
