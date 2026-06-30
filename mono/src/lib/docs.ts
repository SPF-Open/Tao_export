import {
  Upload,
  Hammer,
  Download,
  Bold,
  ClipboardCheck,
  Library,
  ScanSearch,
} from 'lucide-svelte';
import type { ComponentType } from 'svelte';

/** A documentation entry, one per tool reachable from the top nav. */
export interface DocEntry {
  /** URL slug + markdown filename under static/docs/<slug>.md. */
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  /** A lucide-svelte icon component (matches the homepage route card). */
  icon: ComponentType;
}

/**
 * The tools documented under /docs. Order and metadata mirror the route
 * cards on the landing page (src/routes/+page.svelte) so the two stay in sync.
 */
export const docs: DocEntry[] = [
  {
    slug: 'import',
    title: 'Import',
    eyebrow: 'Excel to TAO',
    description: 'Load a workbook, map the question columns, and prepare a clean TAO question set.',
    icon: Upload,
  },
  {
    slug: 'forge',
    title: 'Forge',
    eyebrow: 'Question builder',
    description: 'Compose and schedule exams from scratch or from existing templates.',
    icon: Hammer,
  },
  {
    slug: 'export',
    title: 'Export',
    eyebrow: 'ZIP to PDF/JSON',
    description: 'Load ZIP exam archives, configure the view, and export formatted results.',
    icon: Download,
  },
  {
    slug: 'format',
    title: 'Format',
    eyebrow: 'Bold prompts',
    description: 'Wrap every question prompt in bold and get the same ZIP back, ready to re-import.',
    icon: Bold,
  },
  {
    slug: 'iat',
    title: 'IAT',
    eyebrow: 'Item analysis',
    description: 'Review item difficulty, discrimination, and alternative statistics.',
    icon: ClipboardCheck,
  },
  {
    slug: 'library',
    title: 'Library',
    eyebrow: 'Question bank',
    description: 'Build a portable SQLite question database and search it instantly in your browser.',
    icon: Library,
  },
  {
    slug: 'audit',
    title: 'Audit',
    eyebrow: 'Compliance review',
    description: 'Compare a TAO export against an Excel source and flag differences by severity.',
    icon: ScanSearch,
  },
];

/** Look up a single documentation entry by slug. */
export function getDoc(slug: string): DocEntry | undefined {
  return docs.find((d) => d.slug === slug);
}
