import { docs, stackDocs, presentationDocs } from '$lib/docs';

export const prerender = true;

export function entries() {
  return [...docs, ...stackDocs, ...presentationDocs].map((d) => ({ slug: d.slug }));
}
