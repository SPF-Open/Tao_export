# Import

**Excel to TAO.** Import turns a raw Excel workbook of questions into a clean,
previewable TAO question set by mapping each spreadsheet column to a question
field.

## What it does

You load a `.xlsx` / `.xls` workbook, tell Import which columns hold the title,
prompt, correct answer and competency metadata, and it parses the sheet into
structured questions you can preview before using them elsewhere in TAO.

## Using Import

1. **Drop your workbook** onto the drop zone (or browse for it). The sheet is
   read entirely in your browser.
2. **Pick the sheet** to parse if the workbook has several.
3. **Map the columns** in the left sidebar:
   - **Title**, **Prompt**, **Correct** — the core question fields.
   - **Competency**, **Indicator**, and the **competency / mastery descriptions**
     — optional metadata used for reporting.
4. **Tune parsing** with the row **offset**, **skip-row** and **alternative**
   options so the parser starts on the right row and reads answer alternatives
   correctly.
5. **Preview** the parsed questions on the right. Toggle **Show / hide answers**
   with the eye button, and open the **meta matrix** to review competency
   coverage across the set.

## Tips

- The same parser (`Question.parseSheet`) powers the Audit route, so a workbook
  that imports cleanly will also audit cleanly.
- Everything runs client-side — your workbook never leaves your machine.
