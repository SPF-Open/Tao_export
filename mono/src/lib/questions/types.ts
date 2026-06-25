export type ItemType =
	| 'instruction'
	| 'single-choice'
	| 'multiple-choice'
	| 'text'
	| 'matching'
	| 'ordering'
	| 'custom'
	| 'unknown';

export interface RichContent {
	html?: string;
	text?: string;
}

export interface TimeLimits {
	minTime?: number;
	maxTime?: number;
}

export interface TaoTools {
	zoom?: boolean;
	highlighter?: boolean;
	calculator?: boolean;
	reviewScreen?: boolean;
	markReview?: boolean;
	endTestWarning?: boolean;
	nextPartWarning?: boolean;
	[key: string]: boolean | undefined;
}

export interface Assessment {
	id: string;
	title: string;
	language?: string;
	metadata: AssessmentMetadata;
	sections: Section[];
	assets: Record<string, Asset>;
}

export interface AssessmentMetadata {
	source?: string;
	toolName?: string;
	toolVersion?: string;
	navigationMode?: 'linear' | 'nonlinear';
	submissionMode?: 'individual' | 'simultaneous';
	timeLimits?: TimeLimits;
	tools: TaoTools;
}

export interface Section {
	id: string;
	title: string;
	testPart?: string;
	timeLimits?: TimeLimits;
	items: AssessmentItem[];
}

export interface AssessmentItem {
	id: string;
	title: string;
	label?: string;
	type: ItemType;
	content: RichContent;
	responses?: ResponseDefinition[];
	scoring?: Scoring;
	feedback?: Feedback[];
	assets?: string[];
	metadata?: ItemMetadata;
}

export interface ItemMetadata {
	tools?: TaoTools;
	informational?: boolean;
	competency?: string;
	indicator?: string;
	competencyDescr?: string;
	masteryDescr?: string;
	sourceRow?: number;
	[k: string]: unknown;
}

export interface ResponseDefinition {
	id: string;
	cardinality: 'single' | 'multiple' | 'ordered';
	baseType: 'identifier' | 'string' | 'integer' | 'float';
	correctAnswers?: string[];
	options?: ChoiceOption[];
	mapping?: Record<string, number>;
	constraints?: ResponseConstraints;
}

export interface ResponseConstraints {
	maxLength?: number;
	minChoices?: number;
	maxChoices?: number;
}

export interface ChoiceOption {
	id: string;
	content: RichContent;
	correct?: boolean;
}

export interface Scoring {
	maxScore?: number;
	rules?: ScoreRule[];
}

export interface ScoreRule {
	answerId: string;
	score: number;
}

export interface Feedback {
	id: string;
	title?: string;
	content: RichContent;
}

export interface Asset {
	id: string;
	type: 'image' | 'pdf' | 'video' | 'css' | 'other';
	path: string;
	blob?: Blob;
	originalName?: string;
}

export interface AssessmentDatabase {
	assessment: Omit<Assessment, 'sections' | 'assets'>;
	items: Record<string, AssessmentItem>;
	sections: Record<string, Section>;
	assets: Record<string, Asset>;
}
