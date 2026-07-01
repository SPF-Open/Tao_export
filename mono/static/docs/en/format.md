# Format

**Auto-format every question, then preview and adjust.** Format opens a TAO
QTI export and, when you export it, auto-formats every question: bullet
lists and line breaks are detected in each stem, and every plain-text prompt
is bolded. Pick a question first if you want to preview or tweak its result
before exporting.

## What it does

Format reads every question in your QTI `.zip` and lists them in the side
panel. Exporting applies two automatic passes to the whole package:

- **Stem formatting** — in each question's stem (the intro/context text
  shown before the answer choices), lines starting with `•` or `-` become a
  real bulleted list, and any other line break becomes a line break in the
  rendered question.
- **Bold prompts** — every prompt that's still plain text gets wrapped in
  bold, matching TAO's own convention. Prompts that already contain
  formatting are left alone.

You don't need to open a question for either of these to apply — they run
on every question when you export. Opening a question lets you preview
exactly how its stem will render, and edit the text by hand if the automatic
detection missed something or you want a different result.

## Using Format

1. **Upload** your TAO QTI `.zip` export.
2. *(Optional)* **Pick a question** from the list in the side panel to
   preview its auto-formatted stem, and edit the text if you want to adjust
   it — the preview pane updates as you type.
3. Click **Export ZIP**. Every question's stem is auto-formatted (using your
   edited text for any question you adjusted) and every plain prompt is
   bolded.
4. **Download** the new archive. Its name has `-stems` appended (for example
   `exam.zip` → `exam-stems.zip`).
5. **Re-import** the `-stems.zip` into TAO.

## Notes

- Only the question stem is editable — answer choices are left untouched.
- Questions with no recognizable stem (e.g. an instruction-only page) still
  appear in the list, but their editor is disabled; they're unaffected by
  stem formatting (bold prompts still applies if relevant).
- Only formatting you create here (bullet lists and line breaks) is applied;
  other rich formatting already present in a stem (e.g. bold text) is reduced
  to plain text once that stem goes through the automatic formatting.
- Processing is fully client-side — the ZIP never leaves your browser.
