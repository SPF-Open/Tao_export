import { docs, stackDocs } from '$lib/docs';

export const prerender = true;

export function entries() {
  return [...docs, ...stackDocs].map((d) => ({ slug: d.slug }));
}
