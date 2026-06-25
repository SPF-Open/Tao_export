import { writable, derived, get } from "svelte/store";
import type { Assessment, AssessmentItem } from "$lib/questions/types.js";

export let errors = writable<{ title: string, txt: string, visible: boolean }[]>([]);

export const pushError = (title: string, txt: string) => {
  const obj = { txt, title, visible: true };
  errors.update(errors => [...errors, obj]);
  setTimeout(() => {
    errors.update(errors => errors.filter(err => err !== obj));
  }, 5000);
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

examsIndex.subscribe((index) => {
  const list = get(assessments);
  if (!list || index >= list.length) return;
  const assessment = list[index];
  if (!assessment) return;
  const items = assessment.sections.flatMap(s => s.items);
  activeItems.set(items);
  oldItems.set([]);
  showItems.set(new Map());
  originalItemOrder = [];
  originalItemIndices = new Map();
  originalAnswerOrders = new Map();
  windowName.set(assessment.title || "TAO-Export" + Math.floor(Math.random() * 1000));
});

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
export const darkMode = writable(false);

// ============================================================================
// AUDIT STORES
// ============================================================================

import type { AuditReport, ExcelConfig } from '$lib/export/audit/types';
import { DEFAULT_CONFIG } from '$lib/export/audit/config';

export type PageType = 'questions' | 'audit' | 'compare';
export const currentPage = writable<PageType>('questions');

export const auditTab = writable<boolean>(false);
export const auditLoading = writable<boolean>(false);
export const auditReport = writable<AuditReport | null>(null);
export const auditConfig = writable<ExcelConfig>(DEFAULT_CONFIG);
export const auditFilename = writable<string>('');
export const auditError = writable<string | null>(null);

export const resetAudit = () => {
  auditLoading.set(false);
  auditReport.set(null);
  auditFilename.set('');
  auditError.set(null);
  auditConfig.set(DEFAULT_CONFIG);
};

// Randomization
export const randomizeAnswer = writable(false);
export const randomizeQuestion = writable(false);

let originalItemOrder: AssessmentItem[] = [];
let originalItemIndices: Map<AssessmentItem, number> = new Map();
let originalAnswerOrders: Map<string, { id: string; originalIndex: number }[]> = new Map();

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

randomizeQuestion.subscribe((value) => {
  if (value) randomizeItems();
  else unrandomizeItems();
});

export const getQuestionMapping = (items: AssessmentItem[]): { currentIndex: number; originalIndex: number; title: string; type: string }[] => {
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

randomizeAnswer.subscribe((value) => {
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
});

export const getAnswerMapping = (title: string, options: { id: string }[]): { currentIndex: number; originalIndex: number; id: string }[] => {
  const original = originalAnswerOrders.get(title);
  if (!original) return [];
  return options.map((opt, currentIdx) => {
    const entry = original.find(o => o.id === opt.id);
    return { currentIndex: currentIdx + 1, originalIndex: (entry?.originalIndex ?? currentIdx) + 1, id: opt.id };
  });
};

sort.subscribe((value) => {
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
});

multiple.subscribe((value) => {
  if (!value) {
    compareMode.set(false);
    compareExamIndex1.set(-1);
    compareExamIndex2.set(-1);
    currentPage.set('questions');
  }
});

compareMode.subscribe((value) => {
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
});

merge.subscribe((merge) => {
  const list = get(assessments);
  const index = get(examsIndex);
  let items: AssessmentItem[] = [];
  if (merge) items = list.flatMap(a => a.sections.flatMap(s => s.items));
  else if (list[index]) items = list[index].sections.flatMap(s => s.items);
  activeItems.set(items);
  oldItems.set([]);
  showItems.set(new Map());
  originalItemOrder = [];
  originalItemIndices = new Map();
  originalAnswerOrders = new Map();
});

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
  sort.set(false);
};

export const auditStats = derived([auditReport], ([$report]) => {
  if (!$report) {
    return { total: 0, matched: 0, unmatched: 0, bloquants: 0, majeurs: 0, mineurs: 0, status: 'idle' as const };
  }
  return {
    total: $report.summary.total,
    matched: $report.summary.matched,
    unmatched: $report.summary.unmatched,
    bloquants: $report.summary.bloquants,
    majeurs: $report.summary.majeurs,
    mineurs: $report.summary.mineurs,
    status: $report.summary.bloquants > 0 ? 'fail' : $report.summary.majeurs > 0 ? 'warning' : 'pass' as const,
  };
});
