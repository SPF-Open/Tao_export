import { writable, derived, get, } from "svelte/store";
import type { Assessment, AssessmentItem } from "$lib/questions/types.js";
import { pushError as pushUiError } from "$lib/ui/notifications";

/** Forwards to the app-wide notification queue ($lib/ui/notifications). */
export const pushError = (title: string, txt: string) => {
  pushUiError(title, txt);
}

// Assessments
export let assessments = writable<Assessment[]>([]);
export let activeItems = writable<AssessmentItem[]>([]);
export let oldItems = writable<AssessmentItem[]>([]);
export let examsIndex = writable<number>(0);
export let windowName = writable<string>("TAO Export");
export const sourceFileName = writable<string>("");

// Per-item visibility overrides (false = hidden by user, undefined/absent = visible)
export const showItems = writable<Map<string, boolean>>(new Map());

/** Activates the assessment at `index`: flattens its items and resets per-exam state. */
export const selectExam = (index: number) => {
  if (get(examsIndex) === index) return;
  examsIndex.set(index);
  const list = get(assessments);
  if (!list || index >= list.length) return;
  const assessment = list[index];
  if (!assessment) return;
  const items = assessment.sections.flatMap(s => s.items);
  activeItems.set(items);
  oldItems.set([]);
  showItems.set(new Map());
  resetOrderState();
  windowName.set(assessment.title || "TAO-Export" + Math.floor(Math.random() * 1000));
};

// Actions

export const resetQuestions = () => {
  activeItems.set([]);
  oldItems.set([]);
  showItems.set(new Map());
};

export const copyQuestion = () => {
  oldItems.set(get(activeItems));
};

export const sortQuestions = () => {
  copyQuestion();
  activeItems.update(items =>
    [...items].sort((a, b) => {
      if (a.type === 'instruction') return 1;
      if (b.type === 'instruction') return -1;
      const aNumber = a.title.match(/\d+/);
      const bNumber = b.title.match(/\d+/);
      if (aNumber && bNumber) return Number(aNumber[0]) - Number(bNumber[0]);
      return 0;
    })
  );
};

// Sidebar re-export
export { sidebarOpen as showMenu } from '$lib/sidebar';

// Settings
export const showAnswer = writable(true);
export const showInstruction = writable(true);
export const showLetter = writable(false);
export const inzage = writable(false);
export const sort = writable(false);
export const compareMode = writable(false);
export const compareExamIndex1 = writable<number>(-1);
export const compareExamIndex2 = writable<number>(-1);
export const zoom = writable(1);
export const multiple = writable(false);
export const merge = writable(false);

// ============================================================================
// PAGE MODE
// ============================================================================

// Audit now lives at its own /audit route; export switches between the
// question preview and the side-by-side comparison.
export type PageType = 'questions' | 'compare';
export const currentPage = writable<PageType>('questions');

// Randomization
export const randomizeAnswer = writable(false);
export const randomizeQuestion = writable(false);

// Imperative undo state for the two randomizers: remembers the original
// question order and per-question answer order so toggling off can restore.
let originalItemOrder: AssessmentItem[] = [];
let originalItemIndices: Map<AssessmentItem, number> = new Map();
let originalAnswerOrders: Map<string, { id: string; originalIndex: number }[]> = new Map();

const resetOrderState = () => {
  originalItemOrder = [];
  originalItemIndices = new Map();
  originalAnswerOrders = new Map();
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const randomizeItems = () => {
  const current = get(activeItems);
  if (current.length === 0) return;

  if (originalItemOrder.length === 0) {
    originalItemOrder = [...current];
    current.forEach((item, i) => originalItemIndices.set(item, i));
  }

  const nonInstructions = current.filter(item => item.type !== 'instruction');
  const instructions = current.filter(item => item.type === 'instruction');
  activeItems.set([...instructions, ...shuffleArray(nonInstructions)]);
};

const unrandomizeItems = () => {
  if (originalItemOrder.length > 0) {
    activeItems.set([...originalItemOrder]);
  }
};

/** Turns question shuffling on/off, restoring the original order when off. */
export const setRandomizeQuestion = (value: boolean) => {
  if (get(randomizeQuestion) === value) return;
  randomizeQuestion.set(value);
  if (value) randomizeItems();
  else unrandomizeItems();
};

export interface QuestionMappingEntry {
  currentIndex: number;
  originalIndex: number;
  title: string;
  type: string;
}

export interface AnswerMappingEntry {
  currentIndex: number;
  originalIndex: number;
  id: string;
}

export const getQuestionMapping = (items: AssessmentItem[]): QuestionMappingEntry[] => {
  return items.map((item, currentIdx) => {
    const originalIdx = originalItemIndices.get(item) ?? currentIdx;
    return { currentIndex: currentIdx + 1, originalIndex: originalIdx + 1, title: item.title, type: item.type };
  });
};

export const questionMapping = derived(
  [activeItems, randomizeQuestion, randomizeAnswer],
  ([$items, $rq, $ra]) => {
    if ((!$rq && !$ra) || $items.length === 0) return [];
    return getQuestionMapping($items);
  }
);

export const answerMapping = derived(
  [activeItems, randomizeAnswer],
  ([$items, $ra]) => {
    if (!$ra || $items.length === 0) return [];
    return $items
      .filter(item => item.type === 'single-choice')
      .map(item => ({
        title: item.title,
        mapping: getAnswerMapping(item.title, item.responses?.[0]?.options ?? [])
      }))
      .filter(entry => entry.mapping.length > 0);
  }
);

export const shuffleCurrentAnswers = (item: AssessmentItem): AssessmentItem => {
  const resp = item.responses?.[0];
  if (!resp?.options) return item;

  if (originalAnswerOrders.has(item.title)) {
    const order = originalAnswerOrders.get(item.title)!;
    const restored = order
      .map(o => resp.options!.find(a => a.id === o.id) ?? resp.options![o.originalIndex])
      .filter(Boolean) as typeof resp.options;
    return { ...item, responses: [{ ...resp, options: restored }, ...(item.responses?.slice(1) ?? [])] };
  }

  const newOrder = resp.options.map((a, i) => ({ id: a.id, originalIndex: i }));
  originalAnswerOrders.set(item.title, newOrder);
  const shuffled = shuffleArray(resp.options);
  return { ...item, responses: [{ ...resp, options: shuffled }, ...(item.responses?.slice(1) ?? [])] };
};

/** Turns answer shuffling on/off for single-choice items, restoring order when off. */
export const setRandomizeAnswer = (value: boolean) => {
  if (get(randomizeAnswer) === value) return;
  randomizeAnswer.set(value);
  const current = get(activeItems);
  if (current.length === 0) return;

  if (value) {
    activeItems.update(items =>
      items.map(item => {
        const resp = item.responses?.[0];
        if (item.type !== 'single-choice' || !resp?.options?.length) return item;
        if (!originalAnswerOrders.has(item.title)) {
          const newOrder = resp.options.map((a, i) => ({ id: a.id, originalIndex: i }));
          originalAnswerOrders.set(item.title, newOrder);
          return { ...item, responses: [{ ...resp, options: shuffleArray(resp.options) }, ...(item.responses?.slice(1) ?? [])] };
        }
        return item;
      })
    );
  } else {
    activeItems.update(items =>
      items.map(item => {
        const resp = item.responses?.[0];
        if (item.type !== 'single-choice' || !resp?.options) return item;
        const order = originalAnswerOrders.get(item.title);
        if (!order) return item;
        const restored = order
          .map(o => resp.options!.find(a => a.id === o.id) ?? resp.options![o.originalIndex])
          .filter(Boolean) as typeof resp.options;
        originalAnswerOrders.delete(item.title);
        return { ...item, responses: [{ ...resp, options: restored }, ...(item.responses?.slice(1) ?? [])] };
      })
    );
  }
};

export const getAnswerMapping =(title: string, options: { id: string }[]): AnswerMappingEntry[] => {
  const original = originalAnswerOrders.get(title);
  if (!original) return [];
  return options.map((opt, currentIdx) => {
    const entry = original.find(o => o.id === opt.id);
    return { currentIndex: currentIdx + 1, originalIndex: (entry?.originalIndex ?? currentIdx) + 1, id: opt.id };
  });
};

/**
 * Turns numeric sorting on/off. Note: the saved copy (oldItems) is sorted as
 * well, so toggling sort off keeps the sorted order — pinned by the store tests.
 */
export const setSort = (value: boolean) => {
  if (get(sort) === value) return;
  sort.set(value);
  if (value) {
    sortQuestions();
    oldItems.update(items => [...items].sort((a, b) => {
      if (a.type === 'instruction') return 1;
      if (b.type === 'instruction') return -1;
      const aNum = a.title.match(/\d+/);
      const bNum = b.title.match(/\d+/);
      if (aNum && bNum) return Number(aNum[0]) - Number(bNum[0]);
      return 0;
    }));
  } else {
    activeItems.set(get(oldItems));
  }
};

/** Enables/disables multi-exam mode; disabling cascades compare mode off. */
export const setMultiple = (value: boolean) => {
  if (get(multiple) === value) return;
  multiple.set(value);
  if (!value) {
    setCompareMode(false);
    compareExamIndex1.set(-1);
    compareExamIndex2.set(-1);
    currentPage.set('questions');
  }
};

/** Enters/leaves the side-by-side comparison view. */
export const setCompareMode = (value: boolean) => {
  if (get(compareMode) === value) return;
  compareMode.set(value);
  const isMultiple = get(multiple);
  const list = get(assessments);

  if (value && isMultiple && list.length > 1) {
    if (get(compareExamIndex1) === -1) compareExamIndex1.set(0);
    if (get(compareExamIndex2) === -1) compareExamIndex2.set(list.length > 1 ? 1 : 0);
    currentPage.set('compare');
  } else if (!value) {
    compareExamIndex1.set(-1);
    compareExamIndex2.set(-1);
    currentPage.set('questions');
  }
};

/** Merges every loaded exam into one list, or restores the selected exam. */
export const setMerge = (value: boolean) => {
  if (get(merge) === value) return;
  merge.set(value);
  const list = get(assessments);
  const index = get(examsIndex);
  let items: AssessmentItem[] = [];
  if (value) items = list.flatMap(a => a.sections.flatMap(s => s.items));
  else if (list[index]) items = list[index].sections.flatMap(s => s.items);
  activeItems.set(items);
  oldItems.set([]);
  showItems.set(new Map());
  resetOrderState();
};

export const settings = derived(
  [showAnswer, showInstruction, showLetter, inzage, sort],
  ([$showAnswer, $showInstruction, $showLetter, $inzage, $sort]) => ({
    showAnswer: $showAnswer,
    showInstruction: $showInstruction,
    showLetter: $showLetter,
    inzage: $inzage,
    sort: $sort
  })
);

export const resetSettings = () => {
  showAnswer.set(true);
  showInstruction.set(true);
  showLetter.set(false);
  inzage.set(false);
  setSort(false);
};

