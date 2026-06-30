import { writable } from 'svelte/store';

export type DocLang = 'en' | 'fr' | 'nl';

export const LANG_LABELS: Record<DocLang, string> = {
  en: 'EN',
  fr: 'FR',
  nl: 'NL',
};

function createDocLang() {
  const stored =
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('docLang') as DocLang | null)
      : null;

  const { subscribe, set } = writable<DocLang>(stored ?? 'en');

  return {
    subscribe,
    set(lang: DocLang) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('docLang', lang);
      }
      set(lang);
    },
  };
}

export const docLang = createDocLang();
