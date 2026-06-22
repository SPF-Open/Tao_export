export interface QO extends Question {
  answerLenght: number;
}

interface TxtType {
  h: string;
  r: string;
  t: string;
  v: string;
  w: string;
}

class Txt implements TxtType {
  h: string;
  r: string;
  t: string;
  v: string;
  w: string;

  constructor({ h, r, t, v, w }: TxtType) {
    this.h = h;
    this.r = r;
    this.t = t;
    this.v = v;
    this.w = w;
  }

  toString() {
    return this.r ? this.r : this.w;
  }
}

export class Question {
  id: Txt;
  prompt: Txt;

  competency?: Txt;
  indicator?: Txt;
  competencyDescr?: Txt;
  masteryDescr?: Txt;

  constructor({ id, prompt, competency, indicator, competencyDescr, masteryDescr }: Question) {
    this.id = new Txt(id);
    this.prompt = new Txt(prompt);
    if (competency) this.competency = new Txt(competency);
    if (indicator) this.indicator = new Txt(indicator);
    if (competencyDescr) this.competencyDescr = new Txt(competencyDescr);
    if (masteryDescr) this.masteryDescr = new Txt(masteryDescr);
  }

  static parseSheet(
    sheet,
    column: {
      title: string;
      prompt: string;
      correct: string;
      competency: string;
      indicator: string;
      competencyDescr: string;
      masteryDescr: string;
    },
    row: { offset: number; alternative: number, skipRow: number }
  ) {
    let currentRow = row.offset;
    const questions: QCM[] = [];
    let currentQuestion: QCM;

    const previousDataInfo = {
      competency: undefined,
      indicator: undefined,
      competencyDescr: undefined,
      masteryDescr: undefined,
    };

    while (sheet[column.prompt + currentRow]) {
      if ((currentRow - row.offset) % (row.alternative + 1 + row.skipRow) == 0 || currentRow == row.offset) {
        if (column.competency)
          previousDataInfo.competency = sheet[column.competency + currentRow]
            ? sheet[column.competency + currentRow]
            : previousDataInfo.competency;
        if (column.indicator)
          previousDataInfo.indicator = sheet[column.indicator + currentRow]
            ? sheet[column.indicator + currentRow]
            : previousDataInfo.indicator;
        if (column.competencyDescr)
          previousDataInfo.competencyDescr = sheet[column.competencyDescr + currentRow]
            ? sheet[column.competencyDescr + currentRow]
            : previousDataInfo.competencyDescr;
        if (column.masteryDescr)
          previousDataInfo.masteryDescr = sheet[column.masteryDescr + currentRow]
            ? sheet[column.masteryDescr + currentRow]
            : previousDataInfo.masteryDescr;

        if (currentQuestion && !column.correct) {
          currentQuestion.answers[0].correct = true;
        }
        try {
          currentQuestion = new QCM({
            id: sheet[column.title + currentRow],
            prompt: sheet[column.prompt + currentRow],
            competency: previousDataInfo.competency,
            indicator: previousDataInfo.indicator,
            competencyDescr: previousDataInfo.competencyDescr,
            masteryDescr: previousDataInfo.masteryDescr,
          });
        }
        catch (e) {
          console.log(e);
          console.log(sheet[column.title + currentRow]);
          console.log(sheet[column.prompt + currentRow]);
          currentRow = currentRow + row.alternative + 2;
          continue;
        }

        // On new template we have a empty row after the question
        currentRow += row.skipRow;

        questions.push(currentQuestion);
      } else {
        currentQuestion.addAlt({
          prompt: sheet[column.prompt + currentRow],
          correct: !column.correct ?
            false :
            sheet[column.correct + currentRow] && sheet[column.correct + currentRow].w ?
              sheet[column.correct + currentRow].w === "x" :
              false,
        });
      }
      currentRow++;
    }
    return questions;
  }
}

export interface Answer {
  prompt: Txt;
  correct: boolean;
}

export class QCM extends Question {
  answers: Answer[];

  constructor({
    id,
    prompt,
    answers,
    competency,
    indicator,
    competencyDescr,
    masteryDescr,
  }: {
    id: Txt;
    prompt: Txt;
    answers?: Answer[];
    competency?: Txt;
    indicator?: Txt;
    competencyDescr?: Txt;
    masteryDescr?: Txt;
  }) {
    super({
      id: new Txt(id),
      prompt: new Txt(prompt),
      competency,
      indicator,
      competencyDescr,
      masteryDescr,
    });
    this.answers = answers ? answers : [];
  }

  addAlt({ prompt, correct }: Answer) {
    this.answers.push({
      prompt: new Txt(prompt),
      correct,
    });
  }

  getFakeId(lang: string, n: number) {
    return (
      langZone(lang).titlePrefix +
      (n + 1 < 10 ? '0' + (n + 1) : n + 1).toString()
    );
  }
}

export const langZone = (lang: string) => {
  let zone = '';
  let titlePrefix = '';
  switch (lang) {
    case 'FR':
      zone = 'fr-FR';
      titlePrefix = 'QCM ';
      break;
    case 'NL':
      zone = 'nl-NL';
      titlePrefix = 'MKV ';
      break;
    case 'DE':
      zone = 'de-DE';
      titlePrefix = 'Frage ';
      break;
  }
  return { zone, titlePrefix };
};
