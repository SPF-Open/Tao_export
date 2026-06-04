import { CSV } from '../helper/csv';
import { langZone, type QCM } from './question';

const headerSCV = [
  'name',
  'question',
  'shuffle',
  'language',
  'min_choices',
  'max_choices',
  'choice_1',
  'choice_2',
  'choice_3',
  'choice_4',
  'choice_5',
  'choice_1_score',
  'choice_2_score',
  'choice_3_score',
  'choice_4_score',
  'choice_5_score',
  'correct_answer',
  'metadata_Specdimension',
  'metadata_Speccompetence',
  'metadata_Specindicator',
];

export const exportToCSV = (questions: QCM[], { lang, }: { lang: string }) => {
  const prefix = langZone(lang);

  const csv = new CSV({ header: headerSCV });

  questions.forEach((question, n) => {
    csv.addSequentially(
      prefix.titlePrefix + (n + 1 < 10 ? '0' + (n + 1) : n + 1).toString(),
    );
    csv.addSequentially(
      question.prompt.v ? question.prompt.v : question.prompt.w,
    );

    csv.addSequentially(1);
    csv.addSequentially(prefix.zone);
    csv.addSequentially(0);
    csv.addSequentially(1);

    const offset = 5 - question.answers.length;

    question.answers // Map question proposition
      .map((answ) => (answ.prompt.v ? answ.prompt.v : answ.prompt.w))
      .forEach((p) => csv.addSequentially(p));

    for (let i = 0; i < offset; i++) {
      csv.addSequentially('');
    }

    question.answers // Map question points
      .map((answ, i, arr) => (answ.correct ? arr.length - 1 : '-1'))
      .forEach((p) => csv.addSequentially(p));

    for (let i = 0; i < offset; i++) {
      csv.addSequentially('');
    }

    csv.addSequentially(
      'choice_' + (question.answers.findIndex((q) => q.correct) + 1),
    );

    csv.addSequentially(question.dimension ? question.dimension.v : '');
    csv.addSequentially(question.competency ? question.competency.v : '');
    csv.addSequentially(question.indicator ? question.indicator.v : '');
  });

  return csv.toStringEncoded();
};

// export const exportToQTI = (questions: QCM[], { lang }: { lang: string }) => {
//   const { zone, titlePrefix } = langZone(lang);
//   const questionsManifest = [];
//   const manifest = create({ version: '1.0' })
//     .ele('manifest', {
//       identifier: 'QTI-TEST-MANIFEST-tao' + Math.floor(Math.random() * 1000000),
//       xmlns: 'http://www.imsglobal.org/xsd/imscp_v1p1',
//       'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
//       'xsi:schemaLocation': [
//         'http://www.imsglobal.org/xsd/imscp_v1p1',
//         'http://www.imsglobal.org/xsd/qti/qtiv2p2/qtiv2p2_imscpv1p2_v1p0.xsd',
//         'http://ltsc.ieee.org/xsd/LOM',
//         'http://www.imsglobal.org/xsd/imsmd_loose_v1p3p2.xsd',
//       ].join(' '),
//       'xmlns:imsmd': 'http://ltsc.ieee.org/xsd/LOM',
//     })
//     .ele('metadata')
//     .ele('schema')
//     .txt('QTIv2.2 Package')
//     .up()
//     .ele('schemaversion')
//     .txt('1.0.0')
//     .up()
//     .up()
//     .ele('organizations')
//     .up()
//     .ele('resources');

//   questions.forEach((q, n) => {
//     // Manifest creation
//     const href = `items/${n}/qti.xml`;
//     manifest
//       .ele('resource', {
//         identifier: n + 'idk',
//         type: 'imsqti_item_xmlv2p2',
//         href,
//       })
//       .ele('metadata')
//       .ele('imsmd:lom')
//       .ele('imsmd:classification')
//       .ele('imsmd:taxonPath')
//       .ele('imsmd:source')
//       .ele('imsmd:string', { 'xml:lang': zone })
//       .txt('http://www.w3.org/2000/01/rdf-schema#label')
//       .up()
//       .up()
//       .ele('imsmd:taxon')
//       .ele('imsmd:entry')
//       .ele('imsmd:string', { 'xml:lang': zone })
//       .txt(titlePrefix + n);

//     manifest.ele('file', { href });

//     // Question file creation
//     let questionQti = create({ version: '1.0' })
//       .ele('assessmentItem', {
//         title: titlePrefix + n,
//         identifier: n + '',
//         labal: titlePrefix + n,
//         'xml:lan': zone,
//       })
//       .ele('responseDeclaration', {
//         identifier: 'RESPONSE',
//         cardinality: 'single',
//         baseType: ' identifier',
//       })
//       .ele('correctResponse')
//       .ele('value')
//       .txt(`<![CDATA[choice_${q.answers.findIndex((a) => a.correct) + 1}]]>`)
//       .up()
//       .up()
//       .ele('mapping', { defaultValue: '0' });
//     q.answers.forEach((a, n) => {
//       questionQti.ele('mapEntry', {
//         mapKey: `choice_${n + 1}`,
//         mappedValue: a.correct ? '3' : '-1',
//       });
//     });
//     questionQti = questionQti
//       .up()
//       .up()
//       .ele('outcomeDeclaration', {
//         identifier: 'SCORE',
//         cardinality: 'single',
//         baseType: 'float',
//         normalMaximum: '3',
//       })
//       .up()
//       .ele('outcomeDeclaration', {
//         identifier: 'MAXSCORE',
//         cardinality: 'single',
//         baseType: 'float',
//       })
//       .up()
//       .ele('defaultValue')
//       .ele('value')
//       .txt('3')
//       .up()
//       .up()
//       .ele('itemBody')
//       .ele('div', { class: 'grid-row' })
//       .ele('div', { class: 'col-12' })
//       .ele('choiceInteraction', {
//         reposonseIdentifier: 'RESPONSE',
//         shuffle: 'true',
//         maxChoices: '1',
//         minChoices: '0',
//         orientation: 'vertical',
//       })
//       .ele('prompt')
//       .ele('div')
//       .up()
//       .ele('strong')
//       .txt(q.prompt.r)
//       .up()
//       .ele('div')
//       .up()
//       .up();

//     q.answers.forEach((a, n) => {
//       questionQti
//         .ele('simpleChoice', {
//           identifier: `choice_${n + 1}`,
//           fixed: 'false',
//           showHide: 'show',
//         })
//         .txt(a.prompt.r);
//     });
//     questionsManifest.push(questionQti.root());
//   });
//   return { manifest: manifest.root(), questionsManifest };
// };

// const detectLangage = () => {
//   // TODO :
// };
