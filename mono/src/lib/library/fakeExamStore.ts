import { writable } from 'svelte/store';
import { libraryClient } from './client.js';
import { pushError } from '$lib/ui/notifications';
import { ExcelAdapter } from '$lib/questions/adapters/excel.js';
import type { Assessment, AssessmentItem, ChoiceOption } from '$lib/questions/types.js';
import type { LibraryFakeExam, LibraryFakeExamItem, LibraryFakeExamSummary } from './types.js';

/**
 * Store for hand-built "fake exams" — created and edited from the library
 * Exams tab. Every mutation (create/add/remove/reorder/rename/delete) writes
 * straight to the DB via the worker (live save); there is no local-only draft
 * state, so `activeFakeExamItems` always mirrors what's actually persisted.
 */

/** All saved fake exams (summary form), shown in the list panel. */
export const fakeExams = writable<LibraryFakeExamSummary[]>([]);
/** The exam currently open in the builder, if any. */
export const activeFakeExam = writable<LibraryFakeExam | null>(null);
/** Whether a fake-exam operation is in flight. */
export const fakeExamBusy = writable<boolean>(false);

async function run<T>(fn: () => Promise<T>): Promise<T | null> {
	fakeExamBusy.set(true);
	try {
		return await fn();
	} catch (err) {
		pushError('Fake exam', err instanceof Error ? err.message : String(err));
		return null;
	} finally {
		fakeExamBusy.set(false);
	}
}

export async function loadFakeExams(): Promise<void> {
	const list = await run(() => libraryClient.call('fakeExam:list', {}));
	if (list) fakeExams.set(list);
}

export async function openFakeExam(id: number): Promise<void> {
	const exam = await run(() => libraryClient.call('fakeExam:get', { id }));
	if (exam) activeFakeExam.set(exam);
}

export async function createFakeExam(title: string, language = ''): Promise<LibraryFakeExam | null> {
	const exam = await run(() => libraryClient.call('fakeExam:create', { title, language }));
	if (exam) {
		activeFakeExam.set(exam);
		await loadFakeExams();
	}
	return exam;
}

export async function renameActiveFakeExam(id: number, title: string): Promise<void> {
	const exam = await run(() => libraryClient.call('fakeExam:rename', { id, title }));
	if (exam) {
		activeFakeExam.set(exam);
		await loadFakeExams();
	}
}

export async function deleteFakeExam(id: number): Promise<void> {
	const result = await run(() => libraryClient.call('fakeExam:delete', { id }));
	if (result) {
		activeFakeExam.update((cur) => (cur?.id === id ? null : cur));
		await loadFakeExams();
	}
}

export async function addQuestionsToActiveExam(examId: number, questionIds: number[]): Promise<void> {
	const exam = await run(() => libraryClient.call('fakeExam:addItems', { examId, questionIds }));
	if (exam) {
		activeFakeExam.set(exam);
		await loadFakeExams();
	}
}

export async function removeFakeExamItem(itemId: number): Promise<void> {
	const exam = await run(() => libraryClient.call('fakeExam:removeItem', { itemId }));
	if (exam) {
		activeFakeExam.set(exam);
		await loadFakeExams();
	}
}

export async function reorderFakeExamItems(examId: number, orderedItemIds: number[]): Promise<void> {
	const exam = await run(() => libraryClient.call('fakeExam:reorderItems', { examId, orderedItemIds }));
	if (exam) activeFakeExam.set(exam);
}

/**
 * Loads every item's copied assets and returns a map of `asset:<path>` marker
 * → object URL, so the shared `Question.svelte` preview template can resolve
 * images embedded in item HTML. Caller revokes the returned URLs when done.
 */
export async function loadFakeExamAssetUrls(exam: LibraryFakeExam): Promise<Map<string, string>> {
	const urls = new Map<string, string>();
	for (const item of exam.items) {
		if (item.assetRefs.length === 0) continue;
		try {
			const assets = await libraryClient.call('fakeExam:getItemAssets', { itemId: item.id });
			for (const a of assets) {
				const blob = new Blob([a.bytes.slice()], { type: a.mime });
				urls.set(`asset:${a.path}`, URL.createObjectURL(blob));
			}
		} catch {
			// Assets are optional; render without images on failure.
		}
	}
	return urls;
}

/** Maps a fake exam's snapshot items into a renderable/exportable `Assessment`. */
export function buildAssessment(exam: LibraryFakeExam): Assessment {
	const items: AssessmentItem[] = exam.items.map((item) => fakeExamItemToAssessmentItem(item));
	return {
		id: `fake-exam-${exam.id}`,
		title: exam.title,
		language: exam.language || undefined,
		metadata: { tools: {} },
		sections: [{ id: 'main', title: exam.title, items }],
		assets: {}
	};
}

/** Maps a single snapshot item to an `AssessmentItem` (exported for preview rendering). */
export function fakeExamItemToAssessmentItem(item: LibraryFakeExamItem): AssessmentItem {
	const options: ChoiceOption[] = item.answers.map((a, i) => ({
		id: a.identifier || `choice_${i + 1}`,
		content: { html: a.textHtml, text: a.textText },
		correct: a.correct
	}));
	const correctAnswers = options.filter((o) => o.correct).map((o) => o.id);

	return {
		id: `fake-item-${item.id}`,
		title: item.title,
		type: item.type,
		content: { html: item.promptHtml, text: item.promptText },
		responses:
			options.length > 0
				? [
						{
							id: 'RESPONSE',
							cardinality: correctAnswers.length > 1 ? 'multiple' : 'single',
							baseType: 'identifier',
							correctAnswers,
							options
						}
					]
				: undefined,
		metadata: item.metadata
	};
}

/** Builds the exam's Excel workbook and triggers a browser download. */
export async function exportFakeExamToExcel(exam: LibraryFakeExam): Promise<void> {
	await run(async () => {
		const assessment = buildAssessment(exam);
		const blob = await new ExcelAdapter().write(assessment);
		const filename = `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'fake_exam'}.xlsx`;
		downloadBlob(blob, filename);
	});
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
