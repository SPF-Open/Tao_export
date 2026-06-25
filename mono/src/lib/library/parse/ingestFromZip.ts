import { ZipReader, TextWriter, type FileEntry } from '@zip.js/zip.js';
import { QtiAdapter } from '$lib/questions/index.js';
import type { Assessment, AssessmentItem } from '$lib/questions/types.js';
import type { IngestAsset, IngestPayload, IngestQuestion, LibraryAnswer } from '../types.js';
import { sha256Hex } from './hash.js';
import { extractCompetencies } from './competency.js';

/**
 * Main-thread entry point: turns an uploaded TAO ZIP `File` into a normalized,
 * plain-serializable {@link IngestPayload} that the worker can write to SQLite.
 *
 * Parsing relies on {@link QtiAdapter} (which needs `DOMParser` /
 * `URL.createObjectURL`, both unavailable in a Worker), so it must run here.
 * Raw item XML is captured in a second lightweight pass for audit/export.
 */
export async function buildIngestPayload(file: File): Promise<IngestPayload> {
	const bytes = await file.arrayBuffer();
	const sourceHash = await sha256Hex(bytes);

	const adapter = new QtiAdapter();
	const assessment = await adapter.read(file);
	const rawXmlByIdentifier = await readRawItemXml(file);

	const questions: IngestQuestion[] = [];
	for (const section of assessment.sections) {
		for (const item of section.items) {
			questions.push(toIngestQuestion(item, assessment.language ?? '', rawXmlByIdentifier));
		}
	}

	const assets = await toIngestAssets(assessment);

	return {
		filename: file.name,
		sourceHash,
		assessmentId: assessment.id,
		title: assessment.title,
		language: assessment.language ?? '',
		metadata: (assessment.metadata as unknown as Record<string, unknown>) ?? {},
		questions,
		assets
	};
}

function toIngestQuestion(
	item: AssessmentItem,
	fallbackLanguage: string,
	rawXmlByIdentifier: Map<string, string>
): IngestQuestion {
	const promptHtml = item.content.html ?? '';
	const answers = toAnswers(item);
	const answerText = answers
		.map((a) => a.textText)
		.filter(Boolean)
		.join(' • ');

	return {
		qtiIdentifier: item.id,
		title: item.title,
		type: item.type,
		promptHtml,
		promptText: htmlToText(promptHtml),
		answerText,
		language: fallbackLanguage,
		rawXml: rawXmlByIdentifier.get(item.id) ?? '',
		metadata: (item.metadata as Record<string, unknown>) ?? {},
		answers,
		competencies: extractCompetencies(item),
		assetRefs: item.assets ?? []
	};
}

function toAnswers(item: AssessmentItem): LibraryAnswer[] {
	const answers: LibraryAnswer[] = [];
	const scoreByAnswer = buildScoreMap(item);
	let position = 0;
	for (const response of item.responses ?? []) {
		for (const option of response.options ?? []) {
			const html = option.content.html ?? '';
			answers.push({
				identifier: option.id,
				position: position++,
				textHtml: html,
				textText: htmlToText(html),
				score: scoreByAnswer.get(option.id) ?? null,
				correct: Boolean(option.correct)
			});
		}
	}
	return answers;
}

function buildScoreMap(item: AssessmentItem): Map<string, number> {
	const map = new Map<string, number>();
	for (const response of item.responses ?? []) {
		if (response.mapping) {
			for (const [answerId, score] of Object.entries(response.mapping)) {
				map.set(answerId, score);
			}
		}
	}
	return map;
}

async function toIngestAssets(assessment: Assessment): Promise<IngestAsset[]> {
	// Map each asset filename to the first question that references it.
	const ownerByFilename = new Map<string, string>();
	for (const section of assessment.sections) {
		for (const item of section.items) {
			for (const ref of item.assets ?? []) {
				if (!ownerByFilename.has(ref)) ownerByFilename.set(ref, item.id);
			}
		}
	}

	const assets: IngestAsset[] = [];
	for (const asset of Object.values(assessment.assets)) {
		if (!asset.blob) continue;
		const buffer = await asset.blob.arrayBuffer();
		assets.push({
			questionIdentifier: ownerByFilename.get(asset.id) ?? null,
			path: asset.path,
			mime: asset.blob.type || mimeFromPath(asset.path),
			bytes: new Uint8Array(buffer)
		});
	}
	return assets;
}

/** Second ZIP pass: capture each item's raw XML keyed by its identifier. */
async function readRawItemXml(file: File): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	const reader = new ZipReader(file.stream());
	try {
		const entries = (await reader.getEntries()).filter(
			(e): e is FileEntry =>
				!e.directory &&
				e.filename.toLowerCase().endsWith('.xml') &&
				!e.filename.toLowerCase().endsWith('imsmanifest.xml')
		);
		for (const entry of entries) {
			const text = await entry.getData(new TextWriter());
			if (!text.includes('assessmentItem')) continue;
			const doc = new DOMParser().parseFromString(text, 'text/xml');
			const id = doc.querySelector('assessmentItem')?.getAttribute('identifier');
			if (id) map.set(id, text);
		}
	} finally {
		await reader.close();
	}
	return map;
}

/** Strips HTML to plain text using the DOM (main-thread only). */
function htmlToText(html: string): string {
	if (!html) return '';
	try {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
	} catch {
		return html
			.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
}

function mimeFromPath(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase() ?? '';
	const map: Record<string, string> = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		webp: 'image/webp'
	};
	return map[ext] ?? 'application/octet-stream';
}
