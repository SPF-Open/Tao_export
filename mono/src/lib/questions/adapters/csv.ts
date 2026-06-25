import { CSV } from '$lib/import/helper/csv.js';
import type { Assessment, AssessmentItem, Section } from '../types.js';
import type { AssessmentAdapter, AdapterReadOptions, AdapterWriteOptions } from './base.js';

const HEADER = [
	'name',
	'question',
	'shuffle',
	'language',
	'min_choices',
	'max_choices',
	'choice_1',
	'choice_2',
	'choice_3',
	'choice_4',
	'choice_5',
	'choice_1_score',
	'choice_2_score',
	'choice_3_score',
	'choice_4_score',
	'choice_5_score',
	'correct_answer',
	'metadata_SpeccompetenceDecr',
	'metadata_masteryDescr',
	'metadata_Speccompetence',
	'metadata_Specindicator'
];

const MAX_CHOICES = 5;

export class CsvAdapter implements AssessmentAdapter {
	readonly name = 'CSV';

	async read(source: File | ArrayBuffer, options?: AdapterReadOptions): Promise<Assessment> {
		const text =
			source instanceof File
				? await source.text()
				: new TextDecoder().decode(source instanceof ArrayBuffer ? source : source);

		const lines = text.split(/\r?\n/).filter((l) => l.trim());
		if (lines.length < 2) {
			return {
				id: options?.assessmentId ?? 'csv-import',
				title: options?.assessmentTitle ?? 'CSV Import',
				metadata: { tools: {} },
				sections: [{ id: 'main', title: 'Questions', items: [] }],
				assets: {}
			};
		}

		const headerLine = lines[0];
		const cols = parseCsvLine(headerLine);
		const colIndex = Object.fromEntries(cols.map((c, i) => [c, i]));

		const items: AssessmentItem[] = [];

		for (let r = 1; r < lines.length; r++) {
			const row = parseCsvLine(lines[r]);
			if (row.length === 0) continue;

			const name = row[colIndex['name']] ?? '';
			const question = row[colIndex['question']] ?? '';
			const language = row[colIndex['language']] ?? '';
			const correctAnswer = row[colIndex['correct_answer']] ?? '';
			const competencyDescr = row[colIndex['metadata_SpeccompetenceDecr']] ?? '';
			const masteryDescr = row[colIndex['metadata_masteryDescr']] ?? '';
			const competency = row[colIndex['metadata_Speccompetence']] ?? '';
			const indicator = row[colIndex['metadata_Specindicator']] ?? '';

			const options = [];
			for (let i = 1; i <= MAX_CHOICES; i++) {
				const text = row[colIndex[`choice_${i}`]] ?? '';
				if (!text) continue;
				const choiceId = `choice_${i}`;
				const score = Number(row[colIndex[`choice_${i}_score`]] ?? '-1');
				options.push({
					id: choiceId,
					content: { html: text, text },
					correct: correctAnswer === choiceId
				});
			}

			const correctIndex = options.findIndex((o) => o.correct);
			const correctId = correctIndex >= 0 ? options[correctIndex].id : undefined;
			const rules = options.map((o, i) => ({
				answerId: o.id,
				score: o.correct ? options.length - 1 : -1
			}));

			const item: AssessmentItem = {
				id: `row_${r}`,
				title: name,
				type: 'single-choice',
				content: { html: question, text: question },
				responses: [
					{
						id: 'RESPONSE',
						cardinality: 'single',
						baseType: 'identifier',
						correctAnswers: correctId ? [correctId] : [],
						options,
						mapping: Object.fromEntries(rules.map((ru) => [ru.answerId, ru.score]))
					}
				],
				scoring: {
					maxScore: options.length - 1,
					rules
				},
				metadata: {
					competencyDescr: competencyDescr || undefined,
					masteryDescr: masteryDescr || undefined,
					competency: competency || undefined,
					indicator: indicator || undefined
				}
			};

			items.push(item);
		}

		const section: Section = {
			id: 'main',
			title: 'Questions',
			items
		};

		return {
			id: options?.assessmentId ?? 'csv-import',
			title: options?.assessmentTitle ?? 'CSV Import',
			metadata: { tools: {} },
			sections: [section],
			assets: {}
		};
	}

	async write(assessment: Assessment, options?: AdapterWriteOptions): Promise<Blob> {
		const lang = options?.lang ?? 'FR';
		const { zone, titlePrefix } = langZone(lang);

		const items = assessment.sections
			.flatMap((s) => s.items)
			.filter((i) => i.type !== 'instruction');

		const csv = new CSV({ header: HEADER });

		items.forEach((item, n) => {
			const name = item.title || titlePrefix + (n + 1 < 10 ? '0' + (n + 1) : n + 1).toString();
			const questionText = item.content.text ?? stripHtml(item.content.html ?? '');
			const choiceOptions = item.responses?.[0]?.options ?? [];

			csv.addSequentially(name);
			csv.addSequentially(questionText);
			csv.addSequentially(1);
			csv.addSequentially(zone);
			csv.addSequentially(0);
			csv.addSequentially(1);

			const offset = MAX_CHOICES - choiceOptions.length;
			choiceOptions.forEach((opt) => {
				csv.addSequentially(opt.content.text ?? stripHtml(opt.content.html ?? ''));
			});
			for (let i = 0; i < offset; i++) csv.addSequentially('');

			choiceOptions.forEach((opt) => {
				const score = item.responses?.[0]?.mapping?.[opt.id];
				csv.addSequentially(score !== undefined ? score : opt.correct ? choiceOptions.length - 1 : -1);
			});
			for (let i = 0; i < offset; i++) csv.addSequentially('');

			const correctIndex = choiceOptions.findIndex((o) => o.correct);
			csv.addSequentially(correctIndex >= 0 ? `choice_${correctIndex + 1}` : '');

			csv.addSequentially(item.metadata?.competencyDescr ?? '');
			csv.addSequentially(item.metadata?.masteryDescr ?? '');
			csv.addSequentially(item.metadata?.competency ?? '');
			csv.addSequentially(item.metadata?.indicator ?? '');
		});

		const encoded = csv.toStringEncoded();
		return new Blob([encoded], { type: 'text/csv;charset=utf-8;' });
	}
}

function langZone(lang: string): { zone: string; titlePrefix: string } {
	switch (lang.toUpperCase()) {
		case 'FR':
			return { zone: 'fr-FR', titlePrefix: 'QCM ' };
		case 'NL':
			return { zone: 'nl-NL', titlePrefix: 'MKV ' };
		case 'DE':
			return { zone: 'de-DE', titlePrefix: 'Frage ' };
		default:
			return { zone: lang, titlePrefix: 'Q ' };
	}
}

function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;
	while (i < line.length) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i += 2;
				continue;
			}
			inQuotes = !inQuotes;
		} else if (ch === ';' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
		i++;
	}
	result.push(current);
	return result;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
