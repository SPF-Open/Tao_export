# Audit

**Compliance review.** Audit compares a TAO QTI export against the Excel source
it was built from and flags every difference by severity, so you can confirm the
exported exam faithfully matches its source.

## What it does

Audit reads both files, matches questions by their order/position (the TAO export
is generated from the Excel, so they share order and count), and reports any
differences in titles, prompts and answers — classified as critical, major or
minor.

## Using Audit

1. **Upload the TAO `.zip`** export. Its questions are parsed and counted.
2. **Upload the Excel source** and pick the **sheet** to compare against.
3. **Choose the template** (for example FIN / OLD_BOSA / OLD_FIN) so the Excel is
   read the same way the Import route reads it. Optionally **ignore titles** if
   only prompts and answers matter.
4. **Run** the audit and review the results.

## Reading the results

Differences are graded by severity:

- **Critical (blocking)** — major data differences, including unmatched questions
  and Excel↔QTI count mismatches. These fail the audit.
- **Major** — significant discrepancies.
- **Minor** — small formatting or presentation differences.

You can export the report (JSON, Markdown, HTML or CSV) and print it with full
detail, one question per page.

## Notes

- Audit reuses the Import parser and templates, so a workbook that imports
  cleanly audits cleanly.
- Both files are processed entirely in your browser.
