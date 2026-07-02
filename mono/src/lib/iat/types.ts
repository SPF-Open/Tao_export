export interface TestInfo {
	name: string;
	diplome: { name: string; candidateNb: number; questionNb: number }[];
	page: number;
	question: number;
}

export interface PageInfo {
	page: number;
	instruction: boolean;
	duration: {
		mean: number;
		sd: number;
		q10: number;
		q25: number;
		q50: number;
		q75: number;
		q90: number;
	};
	questions: Question[];
}

export interface Question {
	testCode: string;
	diplome: string;
	nCandidates: number;
	nProcedures: number;
	page: number;
	itemRank: number;
	correct_pct: number;
	incorrect_pct: number;
	empty_pct: number;
	not_seen_pct: number;
	answered_pct: number;
	difficulty: number;
	discr_comp: number;
	discr_test: number;
	d_index_comp: number;
	d_index_test: number;
	alpha_drop_test: number;
	alternatives: Alternative[];
}

export interface Alternative {
	testCode: string;
	diplome: string;
	nCandidates: number;
	page: number;
	itemRank: number;
	interactionType: string;
	interactionMode: string;
	choiceId: string;
	text: string;
	isCorrect: boolean;
	pct: number;
	nAnswers: number;
	chosen: number;
	discr_comp: number;
	discr_test: number;
}
