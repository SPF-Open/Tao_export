import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const routesDir = join(root, 'src', 'routes');
const sitemapPath = join(root, 'static', 'sitemap.xml');
const pagePattern = /^\+page\.(svelte|svx|md|js|ts)$/;

const defaultBaseUrl = 'https://tao.lv0.eu';

/**
 * @param {string} value
 */
function escapeXml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

/**
 * @param {string} pageFile
 * @returns {string | null}
 */
function toRoutePath(pageFile) {
	const routeDir = relative(routesDir, dirname(pageFile));

	if (!routeDir) {
		return '/';
	}

	const segments = routeDir.split(sep).filter((segment) => {
		return segment && !segment.startsWith('(') && !segment.startsWith('_');
	});

	if (segments.some((segment) => segment.startsWith('['))) {
		return null;
	}

	return `/${segments.join('/')}`;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function findPages(dir) {
	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir).flatMap(/** @returns {string[]} */ (entry) => {
		const path = join(dir, entry);
		const stats = statSync(path);

		if (stats.isDirectory()) {
			return findPages(path);
		}

		return pagePattern.test(entry) ? [path] : [];
	});
}

/**
 * @param {string | null} route
 * @returns {route is string}
 */
function isRoute(route) {
	return Boolean(route);
}

/**
 * @param {{ baseUrl?: string, lastmod?: string }} [options]
 */
export function generateSitemap({
	baseUrl = process.env.SITEMAP_BASE_URL ?? defaultBaseUrl,
	lastmod = new Date().toISOString().slice(0, 10)
} = {}) {
	const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
	const routes = [...new Set(findPages(routesDir).map(toRoutePath).filter(isRoute))].sort((a, b) => {
		if (a === '/') return -1;
		if (b === '/') return 1;

		return a.localeCompare(b);
	});

	const urls = routes.map((route) => {
		const loc = route === '/' ? `${normalizedBaseUrl}/` : `${normalizedBaseUrl}${route}`;
		const changefreq = route === '/' ? 'weekly' : 'monthly';
		const priority = route === '/' ? '1.0' : '0.8';

		return [
			'  <url>',
			`    <loc>${escapeXml(loc)}</loc>`,
			`    <lastmod>${lastmod}</lastmod>`,
			`    <changefreq>${changefreq}</changefreq>`,
			`    <priority>${priority}</priority>`,
			'  </url>'
		].join('\n');
	});

	const sitemap = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		'</urlset>',
		''
	].join('\n');

	writeFileSync(sitemapPath, sitemap);

	return { routes, sitemapPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const { routes, sitemapPath } = generateSitemap();
	console.log(`Generated ${relative(process.cwd(), sitemapPath)} with ${routes.length} routes.`);
}
