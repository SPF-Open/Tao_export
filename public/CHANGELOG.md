## Changelog

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
