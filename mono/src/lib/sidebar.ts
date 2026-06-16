import { writable } from 'svelte/store';

/** Whether the current page has a sidebar (set by pages on mount/destroy). */
export const sidebarEnabled = writable(false);

/** Whether the sidebar is currently open. */
export const sidebarOpen = writable(true);
