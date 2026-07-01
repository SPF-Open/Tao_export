# Format

**Edit a question's stem.** Format opens a TAO QTI export, lets you pick a
question and rewrite its stem by hand — with bullet lists and line breaks
auto-detected and a live preview — then gives you the same ZIP back, ready to
re-import into TAO.

## What it does

Format reads every question in your QTI `.zip` and lists them in the side
panel. Pick one to edit its stem (the intro/context text shown before the
answer choices) as plain text: lines starting with `•` or `-` become a real
bulleted list, and any other line break becomes a line break in the rendered
question. A live preview shows exactly how the result will look before you
export.

## Using Format

1. **Upload** your TAO QTI `.zip` export.
2. **Pick a question** from the list in the side panel.
3. **Edit the stem** in the text pane — the preview pane updates as you type.
4. Repeat for any other question you want to change.
5. Click **Export ZIP**, then **Download** the new archive. Its name has
   `-stems` appended (for example `exam.zip` → `exam-stems.zip`).
6. **Re-import** the `-stems.zip` into TAO.

## Notes

- Only the question stem is editable — answer choices are left untouched.
- Questions with no recognizable stem (e.g. an instruction-only page) still
  appear in the list, but their editor is disabled.
- Only formatting you create here (bullet lists and line breaks) is applied;
  other rich formatting already present in the export (e.g. bold text) is
  reduced to plain text the first time you edit that question's stem.
- Processing is fully client-side — the ZIP never leaves your browser.
