## Changelog

### 2.11.8
- Improve : The IAT page now shows a guiding empty state before a workbook is loaded, instead of a blank area

### 2.11.7
- Improve : Full end-to-end browser test suite (18 tests)
  - Every page is loaded and checked for rendering and console errors; the error page, Library SQLite worker boot, Format tool happy path (real QTI zip), phone drawer navigation and slides keyboard navigation are all covered

### 2.11.6
- Refactor : The presentation deck (/slides) is split into one component per slide
  - The 1991-line page becomes 8 slide components plus shared data, styles and a reusable card-tilt helper — no visual change
  - Unused styles from removed slides were dropped along the way

### 2.11.5
- Remove : Dead code cleanup — obsolete export helper copy, unused CSV adapter, unused styles and leftover debug logging removed
- Refactor : One shared file-download helper now serves Export, Format, Library, Audit and IAT (five separate copies before)
- Fix : Every button now declares its type explicitly, and the shared Button component honours its `type` prop
- Improve : "Coming soon" tiles on the home page are no longer fake links; tooltips show on keyboard focus and dismiss with Escape

### 2.11.4
- Improve : Dialogs are now fully keyboard-accessible
  - Escape closes any dialog, Tab stays trapped inside it, and focus returns to where you were when it closes
  - Screen readers now announce the dialog with its title
- Feat : Friendly error page — broken links and unexpected errors now show a styled page with a way back home instead of a blank default

### 2.11.3
- Fix : Import page no longer re-parses the workbook once per past visit
  - Store subscriptions leaked every time the page was opened, multiplying parse work after navigating back and forth
- Fix : Unreadable or corrupt Excel files now show an error notification in Import and IAT instead of failing silently
- Improve : IAT statistics parsing extracted into a typed, unit-tested module; missing sheets (`Speed_Pages`, `Questions`, `Alternatives`) now produce a clear error
- Fix : A flaky license test that could accept a tampered signature is now deterministic

### 2.11.2
- Refactor : Export tool internals reorganized for reliability — no behaviour change
  - Sorting, shuffling, merge and compare logic now runs through explicit, tested functions instead of hidden store side effects
  - Question lists in the preview and mapping table are now keyed, so per-question show/hide toggles stay attached to the right question when the order changes
  - Removed an unused internal error queue in favour of the app-wide notification system

### 2.11.1
- Improve : The Export tool's question logic (exam switching, sorting, shuffling, mappings, compare mode) is now covered by an automated test suite, protecting these behaviours against future regressions

### 2.11.0
- Improve : Test suite now runs with Vitest under npm, and Playwright end-to-end tests are in place
  - All existing unit tests were migrated from `bun test` to Vitest (`npm run test:unit`) so the whole project works with a single package manager
  - New `npm run test:e2e` runs browser tests against the built site; `npm test` runs both
  - Tests are now type-checked by `npm run check` (they were previously excluded), and outdated library-schema tests were fixed to follow the current database version
- Fix : Corrected a TypeScript import error on the home page (`$lib/docs.ts` extension)

### 2.10.1
- Fix : Bullet detection now catches markers running together in one paragraph
  - Previously only a bullet at the very start of a line was recognized; now `• item` or `- item` is detected anywhere in the text, so a question opens with its list already correct, before any editing
  - The preview now also shows the question's own prompt text, bolded, exactly as it will appear after export — previously bold was invisible until you downloaded the ZIP

### 2.10.0
- Feat : Format now auto-formats every question on export, and bold is back
  - Exporting a package auto-detects bullet lists and line breaks for every question's stem, and bolds every plain-text prompt — no need to open a question first
  - The per-question editor is now for previewing the automatic result and adjusting anything the detection missed, not the only way to get a question formatted

### 2.9.1
- Improve : Audit's "Custom" Excel template now seeds from the previously selected preset
  - Switching to Custom copies the column letters and row layout of the preset that was active, so you only need to adjust the field(s) that actually differ instead of retyping the whole mapping

### 2.9.0
- Feat : Audit gets a "Custom" Excel template
  - Alongside the fixed FIN / OLD_BOSA / OLD_FIN presets, you can now type in your own column letters (title, prompt, answer, competency, indicator, descriptions) and row layout (first data row, answers per question, rows to skip) — the same manual mapping the Import route already offers — so any Excel source can be audited, not just the three known layouts

### 2.9.0
- Feat : Format is now an interactive question-stem editor
  - Pick any question from an uploaded TAO QTI export and rewrite its stem by hand, with a live preview
  - Lines starting with "•" or "-" are auto-detected as a bulleted list; other line breaks become line breaks
  - Replaces the previous one-click "bold every prompt" behavior — export now produces an `-stems.zip`
### 2.8.1
- Fix : The exam's extracted time limit is now visible in the printed/PDF export
  - The time badge was wrapped in a `hide-print` container together with the on-screen-only tool badges (Zoom, Highlighter, …); it now prints while those screen-only badges stay hidden

### 2.8.0
- Fix : Open-question ("QO"/"OV") prompts no longer appear twice in the export
  - The extra-prompt dedup check compared serialized HTML strings, which silently failed for open questions because the XML serializer re-declares the inherited namespace on isolated fragments; it now checks DOM ancestry instead
- Fix : "Exemple question ouverte" / "Voorbeeld open vraag" are now recognized as instruction pages
  - They're hidden/shown together with the other instructions via the existing "Show Instructions" setting, matching the QCM example page
- Feat : Each question now shows its own TAO tools badge (Zoom, Highlighter, Calculator, Review screen, …) below its content, instead of only once for the whole exam

### 2.7.4
- Improve : Presentation deck remembers the current slide in the URL
  - Each slide updates `?slide=N` (shallow routing, no navigation), so a reload or a shared link lands on the same slide instead of resetting to the cover
  - Out-of-range or missing values fall back gracefully to a valid slide

### 2.7.3
- Fix : Pipeline slide — bottom row now fills the full width on mobile
  - The collapsed serpentine's bottom row switches to a `column-reverse` flex but inherited the base `align-items: center`, shrinking each card to its content width; set `align-items: stretch` so it matches the full-width top row

### 2.7.2
- Improve : Problem slide now *shows* the scattered-work chaos
  - The calm chip row is replaced by a jittering heap of overlapping file cards — the four real sources plus version-soup clutter (`bank_v3_FINAL.xlsx`, `draft_v7.pdf`) — with a card tumbling loose, floating Excel-error tags (`#REF!`, `#VALUE!`, `merge conflict`, …), pulsing warning marks and a nervous "panic" shudder over an alarm-tinted halo
  - Uses the danger token for errors only, stays monochrome elsewhere, and freezes into a static layout under `prefers-reduced-motion`

### 2.7.1
- Feat : Slides doc card — `/docs` now links to the presentation deck
  - New "Presentation" section on the docs page with its own card, icon and description, pointing to `/docs/slides`; kept out of the homepage's numbered module grid since it's not an exam-workflow tool
  - Added `slides.md` documentation in EN/FR/NL describing the deck and how to navigate it

### 2.7.0
- Feat : Presentation deck at `/slides` — a full-screen, keyboard-driven tour of TAO
  - 11 slides covering the problem, vision, audience, the seven modules, the exam pipeline, architecture, strengths, a use case, roadmap and a close
  - Arrow / space navigation, clickable progress dots and a slide counter, built with the TAO design language (dot grid, single accent, reduced-motion aware)

### 2.6.0
- Feat : Build fake exams in Library mode
  - New "Exams" tab — pick questions from the library, assemble them into a new exam, reorder and remove items, with a live preview matching the export-page look
  - Fake exams are stored in their own database tables (separate from imported tests/questions) and export straight to Excel

### 2.5.3
- Feat : Doc switcher in breadcrumb — clicking the doc slug on any `/docs/[slug]` page opens a dropdown to jump to another doc, mirroring the tool switcher

### 2.5.2
- Fix : `.taodb` inline code invisible in dark mode on docs pages
  - Tailwind typography was overriding the code element text color; added explicit `color: var(--text)` to the Markdown.svelte code rule

### 2.5.1
- Fix : Sidebar open/close now slides the main content smoothly instead of teleporting it
  - Replaced `{#if}` Svelte transition with a CSS width transition on a sticky wrapper so both panels animate together

### 2.5.0
- Feat : Multilingual documentation (EN / FR / NL) with stack page
  - All tool docs reorganised into `static/docs/en|fr|nl/` — language switcher on each doc page
  - All 7 tool docs translated to French and Dutch from the English source
  - New "Project stack" documentation page (`/docs/stack`) covering Cloudflare Pages hosting and GitHub, also translated to FR and NL
  - Stack section added as a distinct section on the `/docs` index page
- Refactor : `docs.ts` is now the single source of truth for tool metadata
  - Homepage `routes` array removed — derived from `docs` at runtime (`slug → path`)
  - `stackDocs` export added for infrastructure entries; `getDoc` searches both arrays

### 2.4.0
- Feat : Global debug panel, changelog page, and per-tool documentation
  - The debug panel now opens from a button in the top navigation bar on every route, instead of only on the landing page
  - New `/changelog` page renders the full version history
  - New `/docs` section with a dedicated documentation page for each tool (Import, Forge, Export, Format, IAT, Library, Audit), linked from the header
  - Replaced the export-only documentation/changelog modals with the shared pages

### 2.3.0
- Fix : Audit now parses Excel the same way as the Import route
  - The audit reads the Excel source with the Import parser (`Question.parseSheet`) and templates (FIN / OLD_BOSA / OLD_FIN) instead of a separate parser, so a file that imports cleanly now audits cleanly
  - Questions are matched by order/position (the TAO export is generated from the Excel, so they share order and count) instead of fuzzy text similarity — far more reliable matching
  - Unmatched questions and Excel↔QTI count mismatches are now treated as critical (Bloquant) and fail the audit, instead of being shown as a soft warning
  - Replaced the audit's match-threshold slider and bespoke column config with an Import-style template picker

### 2.2.0
- Feat : Password-protected, encrypted library export
  - Set, change, or remove a password in the Database panel
  - Exported `.taodb` files are encrypted with AES-GCM (PBKDF2-derived key) — unreadable without the password
  - Opening an encrypted library prompts for the password; wrong passwords are rejected
  - Plaintext `.taodb` files still open as before (backward compatible)
  - Encryption protects the exported file; the in-browser working copy stays unencrypted

### 2.1.0
- Feat : Excel import support in the Library route
  - Import questions directly from Excel files (Excel-only mode)
  - Import TAO ZIP exports enriched with competency data from a matching Excel file (ZIP + Excel merged mode)
  - Column picker (ExcelColumnConfig) embedded in the Import tab with preset selector, answer layout toggle, and per-column letter inputs
  - Source badges on import job rows to distinguish ZIP, Excel, and merged imports
  - Queue supports all three sources via a builder-closure pattern — no new worker commands required

### 1.7.1
- Fix : Excel sheet selection dropdown now works properly
  - Fixed reactive state binding for availableSheets and selectedSheet in AuditTab
  - Sheet selector now properly displays and updates when different sheets are selected
  - Converted variables to Svelte 5 reactive state for proper change detection

### 1.7.0
- Feat : Export format selector in sidebar
  - Added dropdown selector below "Get PDF" button to choose between PDF or JSON export
  - Button dynamically updates icon and text based on selected format
  - Minimal design: no border, subtle chevron arrow rotates to indicate open/closed state
  - Smooth transitions and hover effects for better UX
  - Active format highlighted with accent color in dropdown

### 1.6.3
- Refactor : Remove @gzlab/uui dependency and replace with custom UI components
  - Created lightweight custom Svelte 5 components (Switch, TextInput, Button, FileInput)
  - Custom components integrate seamlessly with existing CSS variable design system
  - Reduced bundle size by eliminating external UI library dependency
  - Full dark mode support maintained across all custom components
  - Accessibility first: ARIA labels, keyboard navigation, focus states (WCAG 2.1 AA)
- Feat : Add new "Paper Test" settings category
  - Organized paper test-specific options: Letter display (A,B,C), Randomize Answer, Randomize Question
  - Improved settings organization with dedicated collapsible sections
- Feat : Enhanced button styling
  - Get PDF button now uses darker blue (#1d4ed8 light / #2563eb dark) for better visual prominence
  - Updated primary color throughout the application for consistency
- Improve : Component sizing and spacing refinements
  - Switch component reduced by 20% (more compact)
  - File input area reduced padding for slimmer appearance
  - Optimized icon sizes and spacing for better visual hierarchy
- Fix : File input no longer transitions background color on hover (border only)

### 1.6.2
- Feat : Enhanced audit report generation and styling
  - Improved markdown and HTML report with extended summary metrics (match rate, duplicate titles, potential copy-paste errors)
  - Added dedicated Minor Issues section to audit reports showing up to 15 minor issues
  - Enhanced unmatched items display with code blocks showing full question text and close match scores
  - Improved HTML rendering with proper markdown-to-HTML conversion (tables, lists, code blocks)
  - Refined HTML report styling for professional print and screen display
  - Updated color palette and typography for consistent, readable output
  - Added blue accent borders and improved spacing for better visual hierarchy
- Fix : HTML report generation no longer includes commas between paragraphs

### 1.6.1
- Refactor : Audit error display and configuration improvements
  - Standardized string formatting and improved layout in ErrorDetails component
  - Streamlined preset configurations by consolidating to DEFAULT_CONFIG

### 1.6.0
- Feat : Enhance error comparison and diff highlighting
  - Introduced HighlightedText component for displaying differences in titles, prompts, and answers between Excel and QTI questions
  - Updated ErrorDetails component to utilize HighlightedText for better visual representation of discrepancies
  - Implemented character-level diff generation in normalize.ts to support detailed comparison
  - Enhanced matcher and comparator logic to include diff information in error reporting
  - Added functionality to detect potential copy-paste errors based on scoring patterns
  - Adjusted scoring weights for question matching, focusing on prompt and answer accuracy
  - Updated audit report structure to include counts for duplicate titles and potential copy-paste errors
  - Modified default configuration for row offset in audit settings
  - Added test script for validating diff generation functionality
- Fix : Print table header no longer breaks across multiple lines

### 1.5.2
- Change : Default matching threshold increased to 0.95 for more accurate audit matching

### 1.5.1
- Fix : Audit link color now properly displays when active

### 1.5.0
- Refactor : Audit functionality styling unified with app design system
  - Migrated all hardcoded colors in audit components to CSS variables for consistency
  - Added full dark mode support for audit interface (AuditTab, AuditConfig, AuditResults, ErrorDetails)
  - Updated button and form element styling to match app design language
  - Severity color indicators now use semantic CSS variables (--danger, --warning, --accent)
- Feat : Audit components now automatically adapt to theme changes (light/dark mode)
- Fix : Responsive audit panel adapts to sidebar width changes via CSS variable system

### 1.4.0
- Fix : TypeScript type errors in XML parsing with proper type casting and error handling
- Fix : Modal onMount callback async/await handling in ChangelogModal and DocumentationModal
- Fix : A11y improvements - dialog elements now have proper tabindex and keyboard event handlers
- Fix : Escape key now closes modals for better accessibility
- Refactor : Remove unused CSS selectors (.footer, .footer-left, .footer-right, .version, .questions-container.compare-mode)
- Fix : Improve modal accessibility with proper role attributes and keyboard support

### 1.3.0
 - Feat : Audit based on original Excel file

### 1.2.0
- Refactor : remove unused transition import and adjust font size and padding in settings

### 1.1.0
- Feat : Changelog modal accessible from header
- Feat : Documentation modal with 3 languages (FR/EN/NL)
- Feat : Horizontal language selector for documentation
- Feat : Documentation preloads all languages in background
- Feat : Modal scroll locks body, only modal scrolls
- Feat : Larger modals by default (900px/90vh)

### 0.2.2
- Refactor : Complete UI redesign with modern admin dashboard aesthetic
  - New design tokens (colors, shadows, radius, animations)
  - Inter font instead of Source Sans Pro
  - Custom scrollbar styling
- Feat : Dark mode with manual toggle in settings
- Feat : Collapsible settings sections with icons
- Feat : Sidebar with smooth slide animation
- Feat : Compare mode shows tests side by side with labels (Test A / Test B)
- Feat : All toggles affect both tests in compare mode
- Feat : Inzage mode shows test name and RRN in print
- Feat : Debug menu in header (version, build time)
- Fix : Inzage print header showing both in screen and print
- Fix : Sidebar scroll and layout issues
- Fix : Unused CSS and accessibility warnings

### 0.2.1
- Feat : Window name change according to file name

### 0.2.0

- Feat : Multiple file support
  - One test a the time
  - Merge all file
- Update : Settings more compact
- Update : Dev container now install bun
- Refactor : Migration to svelte 5 in progress

### 0.1.8
- Feat : New lib style

### 0.1.7
- Feat : Change item order
- Update : dependencies
- Fix : Global typing on PKG
- Feat : Zoom level for the preview
- Update : User Doc

### 0.1.6
- Feat : Properly show table and it's content (Test de dossier)
- Feat : Better log
- Update : dependencies

### 0.1.5

- Feat : Error menu
- Fix : Using store to prevent var inject hell
- Fix : One answer per questions for test review
- Update : Svelte 4.x 

### 0.1.4

- Feat : Unified the layout
- Update dependencies

### 0.1.3

- Feat : Reorder item
- Feat : Comapre two tests side by side
- Feat : Hide left menu
- Feat : Select answer of candidate for test review
- Refactor : Tao_export and Tao_import are now two seperated repo
- Feat : Count the number of questions displayed and their total 
- Feat : Order questions by title (ignore instruction)

### 0.1.2

- Feat : Max length of the open question is now showed
- Feat : Show/Hide question
  - Checkbox
  - TextInput
- Feat : Grid layout (menu on the left and preview on the right)
