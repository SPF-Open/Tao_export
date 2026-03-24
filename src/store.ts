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
export let exams = writable<{ questions: QuestionType[], error: null | Error, name: string }[]>([])
export let questions = writable<QuestionType[]>([]);
export let oldQuestions = writable<QuestionType[]>([]);
export let examsIndex = writable<number>(0);
export let windowName = writable<string>("TAO Export")

examsIndex.subscribe((index) => {
  const ex = get(exams)
  if (!ex) return
  if (index > ex.length) {
    index = (ex.length % index) - 1
  }
  const q = ex[index]
  if (!q) return

  questions.set(q.questions)
  originalQuestionOrder = [];
  originalQuestionIndices = new Map();
  originalAnswerOrders = new Map();
  windowName.set(q.name || "TAO-Export" + Math.floor(Math.random() * 1000))
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

// Randomization
export const randomizeAnswer = writable(false);
export const randomizeQuestion = writable(false);

// Store original question order for mapping
let originalQuestionOrder: QuestionType[] = [];
let originalQuestionIndices: Map<QuestionType, number> = new Map();
let originalAnswerOrders: Map<string, { id: string; originalIndex: number }[]> = new Map();

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const randomizeQuestions = () => {
  const currentQuestions = get(questions);
  if (currentQuestions.length === 0) return;
  
  const nonInstructions = currentQuestions.filter(q => 
    q.type !== 'Instruction' && 
    q.type !== 'Instruction QCM' && 
    q.type !== 'Instruction QO'
  );
  
  if (originalQuestionOrder.length === 0) {
    originalQuestionOrder = [...currentQuestions];
    currentQuestions.forEach((q, i) => originalQuestionIndices.set(q, i));
  }
  
  const instructionCount = currentQuestions.filter(q => 
    q.type === 'Instruction' || 
    q.type === 'Instruction QCM' || 
    q.type === 'Instruction QO'
  ).length;
  
  const shuffled = shuffleArray(nonInstructions);
  const instructions = currentQuestions.filter(q => 
    q.type === 'Instruction' || 
    q.type === 'Instruction QCM' || 
    q.type === 'Instruction QO'
  );
  
  questions.set([...instructions, ...shuffled]);
};

const unrandomizeQuestions = () => {
  if (originalQuestionOrder.length > 0) {
    questions.set([...originalQuestionOrder]);
  }
};

randomizeQuestion.subscribe((value) => {
  if (value) {
    randomizeQuestions();
  } else {
    unrandomizeQuestions();
  }
});

export const getQuestionMapping = (currentQuestions: QuestionType[]): { currentIndex: number; originalIndex: number; title: string; type: string }[] => {
  return currentQuestions.map((q, currentIdx) => {
    const originalIdx = originalQuestionIndices.get(q) ?? currentIdx;
    return {
      currentIndex: currentIdx + 1,
      originalIndex: originalIdx + 1,
      title: q.title,
      type: q.type
    };
  });
};

export const questionMapping = derived([questions, randomizeQuestion, randomizeAnswer], ([$questions, $randomizeQuestion, $randomizeAnswer]) => {
  if ((!$randomizeQuestion && !$randomizeAnswer) || $questions.length === 0) return [];
  return getQuestionMapping($questions);
});

export const answerMapping = derived([questions, randomizeAnswer], ([$questions, $randomizeAnswer]) => {
  if (!$randomizeAnswer || $questions.length === 0) return [];
  return $questions
    .filter(q => q.type === 'QCM')
    .map(q => ({
      title: q.title,
      mapping: getAnswerMapping(q.title, q.answers)
    }))
    .filter(item => item.mapping.length > 0);
});

export const shuffleCurrentAnswers = (question: QuestionType): QuestionType => {
  if (originalAnswerOrders.has(question.title)) {
    const currentOrder = originalAnswerOrders.get(question.title)!;
    const restored = currentOrder.map(order => 
      question.answers.find(a => a.id === order.id) || question.answers[order.originalIndex]
    ).filter(Boolean);
    return { ...question, answers: restored as typeof question.answers };
  }
  
  const newOrder = question.answers.map((a, i) => ({ id: a.id, originalIndex: i }));
  originalAnswerOrders.set(question.title, newOrder);
  
  const shuffled = shuffleArray(question.answers);
  return { ...question, answers: shuffled };
};

randomizeAnswer.subscribe((value) => {
  const currentQuestions = get(questions);
  if (currentQuestions.length === 0) return;
  
  if (value) {
    questions.update(qs => qs.map(q => {
      if ((q.type === 'QCM' || q.type === 'Instruction QCM') && q.answers.length > 0) {
        if (!originalAnswerOrders.has(q.title)) {
          const newOrder = q.answers.map((a, i) => ({ id: a.id, originalIndex: i }));
          originalAnswerOrders.set(q.title, newOrder);
          const shuffled = shuffleArray(q.answers);
          return { ...q, answers: shuffled };
        }
        return q;
      }
      return q;
    }));
  } else {
    questions.update(qs => qs.map(q => {
      if ((q.type === 'QCM' || q.type === 'Instruction QCM') && originalAnswerOrders.has(q.title)) {
        const currentOrder = originalAnswerOrders.get(q.title)!;
        const restored = currentOrder.map(order => 
          q.answers.find(a => a.id === order.id) || q.answers[order.originalIndex]
        ).filter(Boolean) as typeof q.answers;
        originalAnswerOrders.delete(q.title);
        return { ...q, answers: restored };
      }
      return q;
    }));
  }
});

export const getAnswerMapping = (questionTitle: string, currentAnswers: { id: string }[]): { currentIndex: number; originalIndex: number; id: string }[] => {
  const originalOrder = originalAnswerOrders.get(questionTitle);
  if (!originalOrder) return [];
  
  return currentAnswers.map((answer, currentIdx) => {
    const originalEntry = originalOrder.find(o => o.id === answer.id);
    return {
      currentIndex: currentIdx + 1,
      originalIndex: (originalEntry?.originalIndex ?? currentIdx) + 1,
      id: answer.id
    };
  });
};

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
  originalQuestionOrder = [];
  originalQuestionIndices = new Map();
  originalAnswerOrders = new Map();
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
