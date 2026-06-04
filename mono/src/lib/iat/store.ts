import { writable } from "svelte/store";
import { read, utils } from "xlsx";

export const file = writable<File | null>(null);
export const pagesData = writable<Record<number, PageInfo> | null>(null);
export const testInfo = writable<TestInfo[] | null>(null)

export interface TestInfo {
  name: string
  diplome: { name: string, candidateNb: number, questionNb: number }[]
  page: number,
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

file.subscribe((file) => {
  if (!file) {
    pagesData.set(null)
    return;
  }
  if (file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = event.target?.result as ArrayBuffer;
    const workbook = read(data, { type: 'array' });

    // Get all sheets
    const speedPages = workbook.Sheets['Speed_Pages'];
    const questions = workbook.Sheets['Questions'];
    const alternatives = workbook.Sheets['Alternatives'];

    // Convert sheets to JSON
    const speedPagesData = utils.sheet_to_json(speedPages);
    const questionsData = utils.sheet_to_json(questions);
    const alternativesData = utils.sheet_to_json(alternatives);

    // Create pages object
    const pages: Record<number, PageInfo> = {};

    // Process speed pages data
    speedPagesData.forEach((row: any) => {
      const page = row.Page;
      if (!pages[page]) {
        pages[page] = {
          page,
          instruction: row.Instruction === 'TRUE',
          duration: {
            mean: row.duration_mean,
            sd: row.duration_sd,
            q10: row.duration_Q10,
            q25: row.duration_Q25,
            q50: row.duration_Q50,
            q75: row.duration_Q75,
            q90: row.duration_Q90
          },
          questions: []
        };
      }
    });

    // Process questions data
    questionsData.forEach((row: any) => {
      const page = row.Page;
      if (!pages[page]) return;

      const question: Question = {
        testCode: row.TestCode,
        diplome: row.Diplome,
        nCandidates: row.nCandidates,
        nProcedures: row.nProcedures,
        page: row.Page,
        itemRank: row.ItemRank,
        correct_pct: row.correct_pct,
        incorrect_pct: row.incorrect_pct,
        empty_pct: row.empty_pct,
        not_seen_pct: row.not_seen_pct,
        answered_pct: row.answered_pct,
        difficulty: row.difficulty,
        discr_comp: row.discr_comp,
        discr_test: row.discr_test,
        d_index_comp: row.d_index_comp,
        d_index_test: row.d_index_test,
        alpha_drop_test: row.alpha_drop_test,
        alternatives: []
      };

      pages[page].questions.push(question);
    });

    // Process alternatives data
    alternativesData.forEach((row: any, i) => {
      const page = row.Page;
      if (!pages[page]) return;

      let question = pages[page].questions.find(q => q.itemRank === row.ItemRank && q.diplome === row.Diplome);
      if (!question) return;

      if (question.alternatives.length > 3) {
        question = pages[page].questions.findLast(q => q.itemRank === row.ItemRank && q.diplome === row.Diplome);
      }
      if (!question) return;

      const alternative: Alternative = {
        testCode: row.TestCode,
        diplome: row.Diplome,
        nCandidates: row.nCandidates,
        page: row.Page,
        itemRank: row.ItemRank,
        interactionType: row.Inter_type,
        interactionMode: row.cardinality,
        choiceId: row.answer_Id,
        text: row.Answer,
        isCorrect: row.correct === 'TRUE',
        pct: row.chosen_pct,
        nAnswers: row.nAnswers,
        chosen: row.chosen_n,
        discr_comp: row.discr_comp,
        discr_test: row.discr_test,
      };

      question.alternatives.push(alternative);
      if (question.alternatives.length === 4) {
        question.alternatives.sort((a, b) =>
          a.isCorrect === b.isCorrect ? 0 : a.isCorrect ? -1 : 1
        );
      }
    });

    // Populate testInfo from questionsData
    const testMap = new Map<string, { 
      name: string, 
      diplomeMap: Map<string, { name: string, candidateNb: number, questionNb: number }>,
      page: number, 
      question: number 
    }>();

    questionsData.forEach((row: any) => {
      const testCode = row.TestCode;
      if (!testMap.has(testCode)) {
        testMap.set(testCode, {
          name: testCode,
          diplomeMap: new Map(),
          page: row.Page,
          question: row.ItemRank
        });
      }
      const entry = testMap.get(testCode)!;
      // Update diplome info
      if (!entry.diplomeMap.has(row.Diplome)) {
        entry.diplomeMap.set(row.Diplome, { name: row.Diplome, candidateNb: row.nCandidates, questionNb: 0 });
      }
      const diplomaEntry = entry.diplomeMap.get(row.Diplome)!;
      diplomaEntry.questionNb += 1;

      // Optionally choose minimum page and question values
      if (row.Page < entry.page) entry.page = row.Page;
      if (row.ItemRank < entry.question) entry.question = row.ItemRank;
    });

    const testInfoArray = Array.from(testMap.values()).map(entry => ({
      name: entry.name,
      diplome: Array.from(entry.diplomeMap.values()),
      page: entry.page,
      question: entry.question
    }));

    testInfo.set(testInfoArray);

    // Set pages data
    pagesData.set(pages);
  };
  reader.readAsArrayBuffer(file);
});
