## Changelog

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
