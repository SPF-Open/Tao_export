import {
  Upload,
  Hammer,
  Download,
  Bold,
  FilePenLine,
  ClipboardCheck,
  Library,
  ScanSearch,
  Layers,
  Presentation,
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
    slug: 'editor',
    title: 'Editor',
    eyebrow: 'Full QTI editor',
    description: 'Open a TAO QTI export and edit every question in full: prompt, answers, character limits and metadata — in a simple form or raw XML — then export a ZIP ready to re-import.',
    icon: FilePenLine,
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

/** Standalone presentation / pitch-deck documentation entries — not part of the exam workflow. */
export const presentationDocs: DocEntry[] = [
  {
    slug: 'slides',
    title: 'Slides',
    eyebrow: 'Presentation',
    description: 'A guided slide deck walking through the TAO pitch: problem, modules, workflow and strengths.',
    icon: Presentation,
  },
];

export function getDoc(slug: string): DocEntry | undefined {
  return [...docs, ...stackDocs, ...presentationDocs].find((d) => d.slug === slug);
}
