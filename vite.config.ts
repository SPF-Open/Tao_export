import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

const timeOption = { timeZone: "Europe/Brussels" };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    PKG: pkg,
    BUILD_DATE: JSON.stringify(new Date().toLocaleDateString("FR-fr", timeOption) + " - " + new Date().toLocaleTimeString("FR-fr", timeOption)),
  }
})  
