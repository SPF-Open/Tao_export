import { ZipReader, TextWriter, BlobWriter, type FileEntry } from '@zip.js/zip.js';
import type {
	Assessment,
	AssessmentItem,
	AssessmentMetadata,
	Section,
	ChoiceOption,
	ResponseDefinition,
	ResponseConstraints,
	Scoring,
	Asset,
	TaoTools,
	ItemType
} from '../types.js';
import { parseCategory, mergeTools } from '../tao-tools.js';
import type { AssessmentAdapter, AdapterReadOptions, AdapterWriteOptions } from './base.js';
import { AdapterWriteNotSupportedError } from './base.js';

export class QtiAdapter implements AssessmentAdapter {
	readonly name = 'QTI 2.2';

	async read(source: File, options?: AdapterReadOptions): Promise<Assessment> {
		const zipReader = new ZipReader(source.stream());
		const entries = await zipReader.getEntries();

		const fileEntries = entries.filter((e): e is FileEntry => !e.directory);
		const xmlEntries = fileEntries.filter(
			(e) =>
				e.filename.toLowerCase().endsWith('.xml') &&
				!e.filename.toLowerCase().endsWith('imsmanifest.xml')
		);
		const assetEntries = fileEntries.filter(
			(e) =>
				!e.filename.toLowerCase().endsWith('.xml') &&
				!e.filename.toLowerCase().endsWith('.css')
		);

		// Find test.xml
		const testEntry = xmlEntries.find((e) => e.filename.includes('/tests/'));
		if (!testEntry) throw new Error('No test.xml found in ZIP');

		const testXmlText = await testEntry.getData(new TextWriter());
		const testDoc = new DOMParser().parseFromString(testXmlText, 'text/xml');

		const assessmentTest = testDoc.querySelector('assessmentTest');
		if (!assessmentTest) throw new Error('No assessmentTest element found');

		const id = assessmentTest.getAttribute('identifier') ?? options?.assessmentId ?? 'unknown';
		const title = assessmentTest.getAttribute('title') ?? options?.assessmentTitle ?? 'Untitled';
		const toolName = assessmentTest.getAttribute('toolName') ?? undefined;
		const toolVersion = assessmentTest.getAttribute('toolVersion') ?? undefined;

		// Parse testParts for navigation mode and timeLimits
		const testPartEls = Array.from(testDoc.querySelectorAll('testPart'));
		const navigationMode = (testPartEls[0]?.getAttribute('navigationMode') ?? undefined) as
			| 'linear'
			| 'nonlinear'
			| undefined;
		const submissionMode = (testPartEls[0]?.getAttribute('submissionMode') ?? undefined) as
			| 'individual'
			| 'simultaneous'
			| undefined;

		let overallMaxTime = 0;

		// item ref map: itemId → { href, tools, informational, sectionId, testPart }
		const itemRefMap = new Map<
			string,
			{ href: string; tools: TaoTools; informational: boolean; sectionId: string; testPart: string }
		>();
		const sections: Section[] = [];

		for (const tp of testPartEls) {
			const testPartId = tp.getAttribute('identifier') ?? '';
			const tpTl = tp.querySelector(':scope > timeLimits');
			const tpMaxTime = tpTl ? Number(tpTl.getAttribute('maxTime') ?? 0) : 0;
			if (tpMaxTime > overallMaxTime) overallMaxTime = tpMaxTime;

			for (const sectionEl of Array.from(tp.querySelectorAll('assessmentSection'))) {
				const sectionId = sectionEl.getAttribute('identifier') ?? '';
				const sectionTitle = sectionEl.getAttribute('title') ?? '';
				const secTl = sectionEl.querySelector(':scope > timeLimits');
				const secMaxTime = secTl ? Number(secTl.getAttribute('maxTime') ?? 0) : undefined;

				for (const ref of Array.from(sectionEl.querySelectorAll('assessmentItemRef'))) {
					const itemId = ref.getAttribute('identifier') ?? '';
					const href = ref.getAttribute('href') ?? '';
					const { tools, informational } = parseCategory(ref.getAttribute('category'));
					if (itemId) itemRefMap.set(itemId, { href, tools, informational, sectionId, testPart: testPartId });
				}

				sections.push({
					id: sectionId,
					title: sectionTitle,
					testPart: testPartId,
					timeLimits: tpMaxTime ? { maxTime: secMaxTime ?? tpMaxTime } : undefined,
					items: []
				});
			}
		}

		// Build asset lookup by filename
		const assetByFilename = new Map<string, (typeof assetEntries)[0]>();
		for (const ae of assetEntries) {
			const name = ae.filename.split('/').pop() ?? ae.filename;
			assetByFilename.set(name, ae);
		}

		const assets: Record<string, Asset> = {};
		const itemAssets: Record<string, string[]> = {};

		// Parse item XMLs
		const itemXmlEntries = xmlEntries.filter((e) => e.filename.includes('/items/'));
		const itemById = new Map<string, AssessmentItem>();

		let examLanguage: string | undefined;

		for (const xmlEntry of itemXmlEntries) {
			const xmlText = await xmlEntry.getData(new TextWriter());
			const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

			const assessmentItemEl = doc.querySelector('assessmentItem');
			if (!assessmentItemEl) continue;

			const itemId = assessmentItemEl.getAttribute('identifier') ?? xmlEntry.filename;
			const itemTitle = assessmentItemEl.getAttribute('title') ?? 'unknown';
			const itemLabel = assessmentItemEl.getAttribute('label') ?? undefined;
			const lang = assessmentItemEl.getAttribute('xml:lang') ?? undefined;
			if (!examLanguage && lang) examLanguage = lang;

			// Inject blob URLs for images
			const imgs = Array.from(doc.getElementsByTagName('img'));
			const itemAssetIds: string[] = [];
			for (const img of imgs) {
				const src = img.getAttribute('src');
				if (!src) continue;
				const filename = src.split('/').pop() ?? src;
				const ae = assetByFilename.get(filename);
				if (ae) {
					const blobWriter = new BlobWriter();
					const blob = await ae.getData(blobWriter);
					const blobUrl = URL.createObjectURL(blob);
					img.setAttribute('src', blobUrl);
					if (!assets[filename]) {
						assets[filename] = {
							id: filename,
							type: 'image',
							path: src,
							blob,
							originalName: filename
						};
					}
					itemAssetIds.push(filename);
				}
			}
			if (itemAssetIds.length) itemAssets[itemId] = itemAssetIds;

			const item = parseItem(doc, itemId, itemTitle, itemLabel, itemAssets);
			const ref = itemRefMap.get(itemId);
			if (ref) {
				item.metadata = {
					...item.metadata,
					tools: Object.keys(ref.tools).length ? ref.tools : undefined,
					informational: ref.informational || undefined
				};
			}
			itemById.set(itemId, item);
		}

		// Place items into sections in test.xml order
		let allTools: TaoTools = {};
		for (const section of sections) {
			for (const [itemId, ref] of itemRefMap.entries()) {
				if (ref.sectionId !== section.id) continue;
				const item = itemById.get(itemId);
				if (item) {
					section.items.push(item);
					if (item.metadata?.tools) allTools = mergeTools(allTools, item.metadata.tools);
				}
			}
		}

		const metadata: AssessmentMetadata = {
			source: source.name,
			toolName,
			toolVersion,
			navigationMode,
			submissionMode,
			timeLimits: overallMaxTime > 0 ? { maxTime: overallMaxTime } : undefined,
			tools: allTools
		};

		await zipReader.close();

		return { id, title, language: examLanguage, metadata, sections, assets };
	}

	async write(_assessment: Assessment, _options?: AdapterWriteOptions): Promise<Blob> {
		throw new AdapterWriteNotSupportedError(this.name);
	}
}

function parseItem(
	doc: Document,
	id: string,
	title: string,
	label: string | undefined,
	itemAssets: Record<string, string[]>
): AssessmentItem {
	const hasChoice = doc.querySelector('choiceInteraction') !== null;
	const hasExtended = doc.querySelector('extendedTextInteraction, textEntryInteraction') !== null;
	const hasMapping = doc.querySelector('mapping') !== null;

	let type: ItemType;
	if (hasChoice || hasMapping) {
		const maxChoices = Number(doc.querySelector('choiceInteraction')?.getAttribute('maxChoices') ?? 1);
		type = maxChoices > 1 ? 'multiple-choice' : 'single-choice';
	} else if (hasExtended) {
		type = 'text';
	} else {
		type = 'instruction';
	}

	// Build content HTML from itemBody
	const itemBody = doc.querySelector('itemBody');
	let contentHtml = '';
	if (itemBody) {
		const gridRows = Array.from(itemBody.getElementsByClassName('grid-row'));
		if (gridRows.length > 0) {
			const promptRows = hasChoice
				? gridRows.filter((el) => el.getElementsByTagName('simpleChoice').length === 0)
				: gridRows;
			contentHtml = promptRows.map((el) => el.outerHTML).join('');
			// Include <prompt> element content for choice/text interactions
			if (hasChoice || hasExtended) {
				const promptEls = Array.from(
					doc.querySelectorAll(
						'choiceInteraction > prompt, extendedTextInteraction > prompt, textEntryInteraction > prompt'
					)
				);
				const extra = promptEls.map((el) => el.innerHTML).join('');
				if (extra && !contentHtml.includes(extra)) contentHtml += extra;
			}
		} else {
			contentHtml = itemBody.innerHTML;
		}
	}

	// Parse response declarations
	const responses: ResponseDefinition[] = [];
	const scoring: Scoring = {};

	for (const respDecl of Array.from(doc.querySelectorAll('responseDeclaration'))) {
		const respId = respDecl.getAttribute('identifier') ?? 'RESPONSE';
		const cardinality = (respDecl.getAttribute('cardinality') ?? 'single') as
			| 'single'
			| 'multiple'
			| 'ordered';
		const baseType = (respDecl.getAttribute('baseType') ?? 'identifier') as
			| 'identifier'
			| 'string'
			| 'integer'
			| 'float';

		const correctAnswers = Array.from(respDecl.querySelectorAll('correctResponse > value'))
			.map((el) => el.textContent?.trim() ?? '')
			.filter(Boolean);

		const mappingEl = respDecl.querySelector('mapping');
		const mapping: Record<string, number> = {};
		if (mappingEl) {
			for (const entry of Array.from(mappingEl.querySelectorAll('mapEntry'))) {
				const key = entry.getAttribute('mapKey') ?? '';
				const val = Number(entry.getAttribute('mappedValue') ?? 0);
				if (key) mapping[key] = val;
			}
		}

		// Parse choice options
		const options: ChoiceOption[] = [];
		if (hasChoice) {
			for (const choice of Array.from(doc.querySelectorAll('simpleChoice'))) {
				const choiceId = choice.getAttribute('identifier') ?? '';
				options.push({
					id: choiceId,
					content: { html: choice.innerHTML },
					correct: correctAnswers.includes(choiceId)
				});
			}
		}

		// Build scoring rules
		const rules = Object.entries(mapping).map(([answerId, score]) => ({ answerId, score }));
		if (rules.length > 0) {
			scoring.maxScore = Math.max(...rules.map((r) => r.score));
			scoring.rules = rules;
		}

		// QO constraints from patternMask
		let constraints: ResponseConstraints | undefined;
		const extText = doc.querySelector('extendedTextInteraction');
		if (extText) {
			const patternMask = extText.getAttribute('patternMask');
			if (patternMask) {
				const m = patternMask.match(/\{0,(\d+)\}/);
				if (m) constraints = { maxLength: Number(m[1]) };
			}
		}

		responses.push({
			id: respId,
			cardinality,
			baseType,
			correctAnswers: correctAnswers.length ? correctAnswers : undefined,
			options: options.length ? options : undefined,
			mapping: Object.keys(mapping).length ? mapping : undefined,
			constraints
		});
	}

	return {
		id,
		title,
		label,
		type,
		content: { html: contentHtml },
		responses: responses.length ? responses : undefined,
		scoring: scoring.rules?.length ? scoring : undefined,
		assets: itemAssets[id]
	};
}
