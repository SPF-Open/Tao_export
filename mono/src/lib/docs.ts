import {
  Upload,
  Hammer,
  Download,
  Bold,
  ClipboardCheck,
  Library,
  ScanSearch,
  Layers,
} from 'lucide-svelte';
import type { ComponentType } from 'svelte';

export interface DocEntry {
  /** URL slug, markdown filename under static/docs/<lang>/<slug>.md, and route path. */
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: ComponentType;
  available?: boolean;
}

/** Single source of truth for all tools — order drives both the homepage and the docs nav. */
export const docs: DocEntry[] = [
  {
    slug: 'import',
    title: 'Import',
    eyebrow: 'Excel to TAO',
    description: 'Load a workbook, map the question columns, preview parsed items, and prepare a clean TAO question set.',
    icon: Upload,
  },
  {
    slug: 'forge',
    title: 'Forge',
    eyebrow: 'Question builder',
    description: 'Compose and schedule exams from scratch or from existing templates with language-aware tooling.',
    icon: Hammer,
  },
  {
    slug: 'format',
    title: 'Format',
    eyebrow: 'Bold prompts',
    description: 'Upload a TAO QTI export and get the same ZIP back with every question prompt wrapped in bold, ready to re-import.',
    icon: Bold,
  },
  {
    slug: 'export',
    title: 'Export',
    eyebrow: 'ZIP to PDF/JSON',
    description: 'Load ZIP exam archives, configure settings, preview questions and answers, and export formatted result tables.',
    icon: Download,
  },
  {
    slug: 'audit',
    title: 'Audit',
    eyebrow: 'Compliance review',
    description: 'Compare a TAO export against an Excel source: match questions and flag critical, major and minor differences by severity.',
    icon: ScanSearch,
  },
  {
    slug: 'iat',
    title: 'IAT',
    eyebrow: 'Item analysis',
    description: 'Review item difficulty, discrimination, and alternative statistics after an exam session.',
    icon: ClipboardCheck,
  },
  {
    slug: 'library',
    title: 'Library',
    eyebrow: 'Question bank',
    description: 'Build a portable SQLite question database from TAO exports, then search it instantly — all in your browser.',
    icon: Library,
  },
];

/** Infrastructure / stack documentation entries. */
export const stackDocs: DocEntry[] = [
  {
    slug: 'stack',
    title: 'Project stack',
    eyebrow: 'Infrastructure',
    description: 'SvelteKit app hosted on Cloudflare Pages, source on GitHub — how TAO is built and deployed.',
    icon: Layers,
  },
];

export function getDoc(slug: string): DocEntry | undefined {
  return [...docs, ...stackDocs].find((d) => d.slug === slug);
}
