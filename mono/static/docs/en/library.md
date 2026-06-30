# Library

**Question bank.** Library builds a portable SQLite question database from your
TAO exports and Excel files, then lets you search it instantly — all in your
browser.

## What it does

Library keeps a `.taodb` SQLite database of questions that you can grow over
time, search with filters, and carry between machines as a single portable file.
The database lives in your browser (OPFS) so it survives a page refresh.

## The three tabs

- **Database** — create, open and export your portable `.taodb` library. You can
  set, change or remove a password; exported files are then encrypted with
  AES-GCM and unreadable without it.
- **Import** — ingest content into the library from TAO `.zip` exports, Excel
  files, or a ZIP enriched with Excel competencies.
- **Search** — query the bank instantly and refine results with the filters in
  the left sidebar. Power users can open the **SQL query** modal for direct
  queries.

## Using Library

1. On **Database**, create a new library or open an existing `.taodb` file.
2. On **Import**, add your TAO exports and/or Excel files to populate it.
3. On **Search**, find questions and refine with the filters.
4. Back on **Database**, **export** the library to save or share it (optionally
   password-protected).

## Notes

- An in-memory (non-persistent) database with unsaved content will warn you
  before you close or refresh the page — export it first.
- Everything runs client-side; your question bank never leaves your browser.
