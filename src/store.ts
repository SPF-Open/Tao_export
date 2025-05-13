import { writable, derived, get, } from "svelte/store";
import type { QuestionType } from "./lib/helper";

export let errors = writable<{ title: string, txt: string, visible: boolean }[]>([]);

export const pushError = (title: string, txt: string) => {
  const obj = { txt, title, visible: true };
  errors.update(errors => [...errors, obj]);
  // remove error after 5 seconds
  setTimeout(() => {
    errors.update(errors => errors.filter(err => err !== obj));
  }, 5000);
}

// Assesments
export let exams = writable<{ questions: QuestionType[], error: null | Error }[]>([])
export let questions = writable<QuestionType[]>([]);
export let oldQuestions = writable<QuestionType[]>([]);
export let examsIndex = writable(0);

examsIndex.subscribe((index) => {
  const ex = get(exams)
  if (!ex) return
  if (index > ex.length) {
    index = (ex.length % index) - 1
  }
  const q = ex[index]
  if (!q) return

  questions.set(q.questions)
  console.log(questions)
})
// Assesments action

export const resetQuestions = () => {
  questions.set([]);
  oldQuestions.set([]);
}

export const copyQuestion = () => {
  oldQuestions.set(get(questions));
}


export const sortQuestions = () => {
  copyQuestion();
  questions.update(() =>
    get(questions).sort((a, b) => {
      if (a.type.includes('Instruction') || a.type === 'Instruction QCM')
        return 1;
      // sort by number find after QO and QCM
      const aNumber = a.title.match(/\d+/);
      const bNumber = b.title.match(/\d+/);
      if (aNumber && bNumber) {
        return Number(aNumber[0]) - Number(bNumber[0]);
      }
      return 0;
    })
  );
}

// Menu
export const showMenu = writable(true);

// Settings
export const showAnswer = writable(true);
export const showInstruction = writable(true);
export const showLetter = writable(false);
export const inzage = writable(false);
export const sort = writable(false);
export const compareMode = writable(false);
export const zoom = writable(1);
export const multiple = writable(false)
export const merge = writable(false)

sort.subscribe((value) => {
  if (value) sortQuestions();
  else questions.set(get(oldQuestions));
});

compareMode.subscribe((value) => {
  if (value) copyQuestion();
  else questions.set(get(oldQuestions));
});

showInstruction.subscribe((showInstruction) => {
  questions.update((o) => o.map((q) => ({
    ...q,
    show:
      q.type === 'Instruction' ||
        q.type === 'Instruction QCM' ||
        q.type === 'Instruction QO'
        ? showInstruction
        : q.show,
  })))
});

merge.subscribe((merge) => {
  const ex = get(exams);
  const index = get(examsIndex);
  let q: QuestionType[] = []
  if (merge) q = ex.flatMap((e) => e.questions)
  else if (ex[index]) q = ex[index].questions
  else q = []
  questions.set(q)
})

// Derived Settings
export const settings = derived([showAnswer, showInstruction, showLetter, inzage, sort], ([$showAnswer, $showInstruction, $showLetter, $inzage, $sort]) => {
  return {
    showAnswer: $showAnswer,
    showInstruction: $showInstruction,
    showLetter: $showLetter,
    inzage: $inzage,
    sort: $sort
  }
});

// Store action
export const resetSettings = () => {
  showAnswer.set(true);
  showInstruction.set(true);
  showLetter.set(false);
  inzage.set(false);
  sort.set(false);
}
