# Format

**Bold prompts.** Format takes a TAO QTI export and gives you the same ZIP back
with every question prompt wrapped in bold — ready to re-import into TAO.

## What it does

Some exams read better when the question prompt stands out. Format opens your
QTI `.zip`, finds each plain-text prompt, wraps it in bold, and repackages the
archive without touching anything else.

## Using Format

1. **Upload** your TAO QTI `.zip` export.
2. Click **Run** (the formatter processes every question in the package).
3. Review the result summary — it reports how many of the total prompts were
   bolded.
4. **Download** the new archive. Its name has `-bold` appended (for example
   `exam.zip` → `exam-bold.zip`).
5. **Re-import** the `-bold.zip` into TAO.

## Notes

- Prompts that already contain formatting are left unchanged; the summary tells
  you how many were actually modified.
- Processing is fully client-side — the ZIP never leaves your browser.
