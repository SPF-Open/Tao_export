import { TextWriter, BlobWriter, type Entry } from '@zip.js/zip.js';

export type zipObj = {
  path: string;
  dir: boolean;
  name: string;
  questionId: string[];
  _raw: Entry;
  xml: Document | undefined;
};

export type EntryObj ={
  path:string
  dir:boolean
  name:string
  questionId:string
  _raw:Entry
  xml:Document | undefined
} 

export const entryToObj = (entry: Entry): EntryObj => {
  const { filename, directory } = entry;
  const pathArr = filename.split('/');
  return {
    path: filename,
    dir: directory,
    name: pathArr[
      pathArr.findIndex((path: string | string[]) => path.includes('.'))
    ],
    questionId: pathArr[1],
    _raw: entry,
    xml: undefined,
  };
};

export const associateAssets = (xml: zipObj, assets: zipObj[]) => {
  const asset = assets.filter((asset) => asset.questionId === xml.questionId);
  return { ...xml, assets: asset };
};

export const readAndParseXml = async (xml: EntryObj, assets: EntryObj[]) => {
  const writter = new TextWriter();
  const parser = new DOMParser();

  if(!xml._raw || !xml._raw.getData){
    return { ...xml, xml: undefined };
  }

  const xmlDoc = parser.parseFromString(
    await xml._raw.getData(writter),
    'text/xml'
  );

  // Inject assets
  const imgs = xmlDoc.getElementsByTagName('img');

  if (imgs.length > 0) {
    await Promise.all(
      Array.from(imgs).map(async (img) => {
        const data = {
          id: img.getAttribute('src').split('/').pop(),
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt'),
          type: img.getAttribute('type'),
          width: img.getAttribute('width'),
        };
        const asset = assets.find((asset) => asset.name === data.id);
        if (asset) {
          const writter = new BlobWriter();
          asset._raw.getData(writter);
          img.setAttribute('src', URL.createObjectURL(await writter.getData()));
          img.parentElement.replaceChild(img, img);
        }
      })
    );
  }

  return { ...xml, xml: xmlDoc };
};

export type QuestionType = {
  title: string;
  type:
  | 'QCM'
  | 'QO'
  | 'Instruction'
  | 'Instruction QCM'
  | 'Instruction QO'
  | 'unknown';
  prompt: Element[];
  answers: { txt: string; point: string; id: string; correct: boolean }[];
  maxLenght?: string;
  show: boolean
};

export const xmlToObj = (xml: EntryObj): QuestionType => {
  if (!xml.xml) {
    return {
      title: 'unknown',
      type: 'unknown',
      prompt: [],
      answers: [],
      show: false
    };
  }
  const xDoc = xml.xml;
  const Instructie = xDoc.getElementsByTagName('assessmentTest').length > 0;

  let title: string | null ;

  if (Instructie) {
    title = xDoc
      .getElementsByTagName('assessmentTest')[0]
      .getAttribute('title');
  } else {
    title = xDoc
      .getElementsByTagName('assessmentItem')[0]
      .getAttribute('title');
  }

  if(!title) title = 'unknown';

  const QCM = xDoc.getElementsByTagName('mapping').length > 0;

  const QO =
    xDoc.getElementsByTagName('extendedTextInteraction').length > 0 ||
    xDoc.getElementsByTagName('textEntryInteraction').length > 0;
  if (!QCM && !QO && !Instructie) {
    return {
      title,
      type: 'Instruction',
      prompt: Array.from(xDoc.getElementsByClassName('grid-row')),
      answers: [],
      show: true
    };
  }

  let answers = [];
  let prompt;
  let type;
  let maxLenght = undefined;

  const inner = Array.from(xDoc.getElementsByTagName('itemBody'))[0];

  if (Instructie) {
    prompt = Array.from(xDoc.getElementsByTagName('assessmentTest'));
    type = 'Instruction';
  } else if (QO) {
    if (
      ['Voorbeeld', 'Exemple'].find((t) =>
        title.toLowerCase().includes(t.toLowerCase())
      )
    ) {
      type = 'Instruction QO';
    } else {
      type = 'QO';
    }
    prompt = inner.getElementsByClassName('grid-row');
    const maxLenghtTemp = Array
      .from(xDoc.getElementsByTagName('extendedTextInteraction'))
      .map(i => i.getAttribute('patternMask'))
      .map(i => {
        try {
          if(i === null) return '∞';
          return i.split(',')[1].split('}')[0];
        } catch (e) {
          return '∞';
        }
      });
      maxLenght = [];
      for (let index = 0; index < prompt.length; index++) {
        const p = prompt.item(index);
        const extendedTextInteraction = p.getElementsByTagName('extendedTextInteraction');

        if (extendedTextInteraction.length > 0) {
          maxLenght.push(maxLenghtTemp.shift());
        }
        else {
          maxLenght.push(undefined);
        }
      }
  } else {
    if (
      ['Voorbeeld', 'Exemple'].find((t) =>
        title.toLowerCase().includes(t.toLowerCase())
      )
    ) {
      type = 'Instruction QCM';
    } else {
      type = 'QCM';
    }

    prompt = Array.from(inner.getElementsByClassName('grid-row')).filter(
      (d) => d.getElementsByTagName('simpleChoice').length === 0
    );

    prompt = prompt.concat(Array.from(inner.getElementsByTagName('prompt')));

    // Get correct answer mapping

    const answerMapping = Array.from(
      xDoc.getElementsByTagName('mapping')[0].children
    ).map((child) => ({
      id: child.attributes[0].nodeValue,
      point: child.attributes[1].nodeValue || 0,
      correct: Number.parseInt(child.attributes[1].nodeValue) > 0 || false,
    }));
    answers = Array.from(xDoc.getElementsByTagName('simpleChoice')).map(
      (answer) => ({
        txt: answer.innerHTML,
        point:
          answerMapping.find((m) => m.id === answer.getAttribute('identifier'))
            ?.point || 0,
        id: answer.getAttribute('identifier'),
        correct:
          answerMapping.find((m) => m.id === answer.getAttribute('identifier'))
            ?.correct || false,
      })
    );
  }

  return {
    title,
    type,
    prompt,
    answers,
    maxLenght,
    show: true
  };
};
