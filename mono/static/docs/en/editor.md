# Editor

**Open a TAO QTI export and edit everything about a question.** Editor
reads a `.zip` exported from TAO and lets you change the prompt, the
answers, the character limit on open questions, and metadata — in a
friendly form or directly as raw XML — then export a ZIP ready to
re-import into TAO.

## What it does

Editor lists every question in your QTI `.zip` in the side panel. Selecting
a question opens it in an editor with two modes:

- **Simple mode** — a form for the question's fields: the prompt/stem,
  each answer choice's text, which answer (or answers) is correct, a
  per-choice score, a character limit for open/free-text questions, and a
  **Metadata** section covering the question's own title/label/language,
  TAO's per-question test options (zoom, calculator, highlighter, review
  screen, warnings — when the package includes a `test.xml`), and LOM
  metadata from `imsmanifest.xml` when present.
- **Raw XML mode** — the question's underlying XML, editable directly. When
  the package includes a `test.xml` and/or `imsmanifest.xml`, separate tabs
  let you edit those files' relevant sections too. Switching back to Simple
  mode re-reads the current XML, so both views always stay in sync.

Every edit is applied as a targeted change to the original XML text — every
other byte of the package (attributes, response processing, everything
Editor doesn't show a field for) is left untouched, so the exported package
stays importable into TAO.

## Using Editor

1. **Upload** your TAO QTI `.zip` export.
2. **Pick a question** from the list in the side panel.
3. Edit it in **Simple** mode, or switch to **Raw XML** for full control.
4. Click **Export ZIP**.
5. **Download** the new archive (its name has `-edited` appended) and
   **re-import** it into TAO.

## Notes

- Answering "correct" toggles as a single choice or several, matching the
  question's own choice cardinality.
- Only existing answer choices can be edited — choices can't be added or
  removed.
- The character-limit field maps to the open question's response
  constraint; setting it back to empty removes the limit.
- LOM/manifest metadata support is best-effort: real TAO exports don't
  reliably embed this metadata, so Editor shows whatever it finds and lets
  you add a minimal starting block when there is none. Re-import the
  exported package into TAO to confirm it before relying on it.
- A question with an unsupported interaction type still appears in the
  list; Simple mode shows a notice and Raw XML mode remains fully available.
- Processing is fully client-side — the ZIP never leaves your browser.
