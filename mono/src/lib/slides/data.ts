/** Static content for the /slides presentation deck. */
import type { ComponentType } from 'svelte';
import {
	Upload,
	Hammer,
	Download,
	ScanSearch,
	ClipboardCheck,
	Library,
	FileSpreadsheet,
	FileArchive,
	FileText,
	Braces,
	ShieldCheck,
	ChartNoAxesColumn,
	Lock,
	Globe,
	Users,
	Layers,
	CloudOff,
	Sparkles,
	Cpu
} from 'lucide-svelte';

export const slides = [
	'Cover',
	'Problem',
	'Vision',
	'Audience',
	'Modules',
	'How it works',
	'Strengths',
	'Close'
] as const;

export const TOTAL = slides.length;

export interface PipelineStep {
	step: number;
	name: string;
	sub: string;
	icon: ComponentType;
}

// The exam pipeline, laid out as a serpentine: top row left→right, turn down,
// bottom row right→left.
export const pipeline: PipelineStep[] = [
	{ step: 1, name: 'Import', sub: 'Excel in', icon: Upload },
	{ step: 2, name: 'Forge', sub: 'Build', icon: Hammer },
	{ step: 3, name: 'Export', sub: 'PDF / JSON', icon: Download },
	{ step: 4, name: 'Audit', sub: 'Validate', icon: ScanSearch },
	{ step: 5, name: 'IAT', sub: 'Analyse', icon: ClipboardCheck },
	{ step: 6, name: 'Library', sub: 'Archive', icon: Library }
];
export const topRow = pipeline.slice(0, 3);
export const bottomRow = [pipeline[5], pipeline[4], pipeline[3]];

export interface MessCard {
	icon: ComponentType;
	label: string;
	rot: number;
	z: number;
	bad?: boolean;
	ghost?: boolean;
}

// A messy, overlapping heap of source files — the four real sources plus a
// little junk-drawer clutter — jittering as if about to topple.
export const messCards: MessCard[] = [
	{ icon: FileSpreadsheet, label: 'Excel banks', rot: -8, z: 5, bad: true },
	{ icon: FileArchive, label: 'QTI packages', rot: 5, z: 4 },
	{ icon: FileText, label: 'Print PDFs', rot: -4, z: 6, bad: true },
	{ icon: Braces, label: 'Result data', rot: 7, z: 4 },
	{ icon: FileSpreadsheet, label: 'bank_v3_FINAL.xlsx', rot: 3, z: 2, ghost: true },
	{ icon: FileText, label: 'draft_v7.pdf', rot: -6, z: 1, ghost: true }
];

// Excel-style error glyphs and version-soup, scattered over the heap.
export const glitchTags = [
	{ t: '#REF!', x: '4%', y: '2%', d: 0 },
	{ t: 'v2_final_FINAL', x: '64%', y: '-2%', d: 0.5 },
	{ t: 'broken link', x: '80%', y: '44%', d: 1 },
	{ t: 'merge conflict', x: '-2%', y: '60%', d: 0.7 },
	{ t: '#VALUE!', x: '46%', y: '72%', d: 1.3 },
	{ t: 'missing sheet', x: '28%', y: '-6%', d: 0.2 },
	{ t: 'NaN', x: '54%', y: '38%', d: 1.6 }
];

// Warning triangles pulsing over the pile.
export const warnMarks = [
	{ x: '18%', y: '16%', d: 0 },
	{ x: '70%', y: '58%', d: 0.6 },
	{ x: '86%', y: '8%', d: 1 }
];

export interface IconPoint {
	icon: ComponentType;
	text: string;
}

export const visionPoints: IconPoint[] = [
	{ icon: Layers, text: 'The full exam lifecycle in one place' },
	{ icon: CloudOff, text: '100% client-side — zero upload' },
	{ icon: ShieldCheck, text: 'Privacy-first by design' },
	{ icon: Sparkles, text: 'Calm, premium, distraction-free' }
];

export interface IconLabel {
	icon: ComponentType;
	label: string;
}

export const roles: IconLabel[] = [
	{ icon: Users, label: 'Authors' },
	{ icon: ShieldCheck, label: 'Reviewers / QA' },
	{ icon: FileText, label: 'Administrators' },
	{ icon: ChartNoAxesColumn, label: 'Item analysts' }
];

export const flowNodes: IconLabel[] = [
	{ icon: FileArchive, label: 'File' },
	{ icon: Cpu, label: 'Parse' },
	{ icon: Globe, label: 'Render' },
	{ icon: FileText, label: 'Export' }
];

export interface Strength {
	icon: ComponentType;
	label: string;
	note: string;
}

export const strengths: Strength[] = [
	{ icon: Layers, label: 'End to end', note: 'One tool, whole lifecycle' },
	{ icon: Lock, label: 'Private by default', note: 'Nothing leaves the device' },
	{ icon: ShieldCheck, label: 'Compliance-grade', note: 'Critical / major / minor audit' },
	{ icon: ChartNoAxesColumn, label: 'Built-in analysis', note: 'Psychometric item stats' },
	{ icon: FileArchive, label: 'Portable banks', note: 'Encrypted .taodb libraries' }
];
