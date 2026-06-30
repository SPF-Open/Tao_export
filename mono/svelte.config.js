import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-cloudflare';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The /docs/[slug] route is prerenderable but, with SSR disabled, the crawler
// can't discover its links. Enumerate one entry per documentation markdown file
// (static/docs/*.md) so each tool's doc page is prerendered.
const docsDir = fileURLToPath(new URL('./static/docs', import.meta.url));
const docEntries = existsSync(docsDir)
	? readdirSync(docsDir)
			.filter((name) => name.endsWith('.md'))
			.map((name) => `/docs/${name.replace(/\.md$/, '')}`)
	: [];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		prerender: {
			entries: ['*', ...docEntries]
		}
	},
	preprocess: [mdsvex({ extensions: ['.svx', '.md'] })],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
