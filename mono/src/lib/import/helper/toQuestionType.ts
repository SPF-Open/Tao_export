import type { QuestionType } from "$lib/export/helper";
import type { QCM } from "./question";

/**
 * Adapt the import-side `QCM` model into the export-side `QuestionType` so the
 * import preview can be rendered with the exact same `Question.svelte`
 * component the export route uses. Keeping a single renderer guarantees both
 * routes stay visually and behaviourally in sync.
 */
export function qcmToQuestionType(qcm: QCM): QuestionType {
  // The export renderer expects each prompt entry to be an Element it reads
  // `innerHTML` from. Wrap the rich-text string in a detached element so the
  // markup survives untouched.
  const promptEl =
    typeof document !== "undefined"
      ? document.createElement("div")
      : ({ innerHTML: "" } as unknown as HTMLDivElement);
  promptEl.innerHTML = qcm.prompt?.toString() ?? "";

  return {
    title: qcm.id?.toString() ?? "",
    type: "QCM",
    prompt: [promptEl],
    answers: qcm.answers.map((answer, i) => ({
      txt: answer.prompt?.toString() ?? "",
      // No explicit scoring exists on the import side; mirror the historical
      // PreviewTAO weighting (correct = 3, incorrect = -1).
      point: answer.correct ? "3" : "-1",
      id: String(i),
      correct: answer.correct,
    })),
    maxLenght: [],
    show: true,
  };
}

export function qcmsToQuestionTypes(qcms: QCM[]): QuestionType[] {
  return qcms.map(qcmToQuestionType);
}
