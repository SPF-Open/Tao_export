import type { AssessmentItem } from "$lib/questions/types.js";
import type { QCM } from "./question";

function plainText(txt: { w?: string; r?: string; v?: string } | undefined): string {
  if (!txt) return "";
  const raw = txt.w ?? txt.r ?? txt.v ?? "";
  return String(raw)
    .replace(/<[^>]*>/g, "")
    .trim();
}

export function qcmToAssessmentItem(qcm: QCM, index: number): AssessmentItem {
  const options = qcm.answers.map((answer, i) => ({
    id: `choice_${i + 1}`,
    content: { html: answer.prompt?.toString() ?? "", text: answer.prompt?.toString() ?? "" },
    correct: answer.correct,
  }));

  const correctId = options.find(o => o.correct)?.id;
  const rules = options.map(o => ({
    answerId: o.id,
    score: o.correct ? options.length - 1 : -1
  }));

  return {
    id: `row_${index}`,
    title: plainText(qcm.id),
    type: 'single-choice',
    content: { html: qcm.prompt?.toString() ?? "", text: qcm.prompt?.toString() ?? "" },
    responses: [
      {
        id: 'RESPONSE',
        cardinality: 'single',
        baseType: 'identifier',
        correctAnswers: correctId ? [correctId] : [],
        options,
        mapping: Object.fromEntries(rules.map(r => [r.answerId, r.score]))
      }
    ],
    scoring: { maxScore: options.length - 1, rules },
    metadata: {
      competency: qcm.competency ? String(qcm.competency.v ?? '') : undefined,
      indicator: qcm.indicator ? String(qcm.indicator.v ?? '') : undefined,
    }
  };
}

export function qcmsToAssessmentItems(qcms: QCM[]): AssessmentItem[] {
  return qcms.map(qcmToAssessmentItem);
}

// Keep old names as aliases for backward compatibility during transition
export const qcmToQuestionType = qcmToAssessmentItem;
export const qcmsToQuestionTypes = qcmsToAssessmentItems;
