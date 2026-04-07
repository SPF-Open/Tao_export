# TAO Audit Feature - User Guide

## Overview
The Audit feature compares questions from an Excel file with questions loaded from a TAO QTI package to detect inconsistencies, mismatches, and potential issues.

## How to Use

### Step 1: Load TAO Questions
1. Click the **menu button** (hamburger icon) to open the sidebar
2. Use **ZipInput** to upload your TAO QTI ZIP package
3. Wait for questions to load
4. You should see your questions displayed in the main area

### Step 2: Access Audit Tab
1. Once questions are loaded, an "Audit" button appears in the header (next to Docs and Changelog)
2. Click the "Audit" button to switch to audit view
3. The button will highlight in green when active

### Step 3: Configure Excel Structure
1. Click "Select Template" and choose a preset (default: SPL 2024)
2. Or manually configure:
   - **Starting Row**: Row number where questions begin (0-based). Default: 17 (row 18)
   - **Skip Rows**: Blank rows between questions. Default: 1
   - **Number of Answer Options**: Typically 4
3. Expand "Column Mapping" to customize column letters if needed:
   - **Prompt Column**: Required (e.g., F)
   - **Answer Columns**: List answer column letters (e.g., G, H, I, J)
   - **Other Columns**: Title, competency, dimension, indicator (optional)

### Step 4: Upload Excel File
1. Click **"📁 Choose Excel File"**
2. Select your audit Excel file
3. Filename appears next to button

### Step 5: Run Audit
1. Click **"▶️ Run Audit"** button
2. Processing indicator shows: "⏳ Processing..."
3. Results load automatically when complete

### Step 6: Review Results

#### Summary Statistics
- **Total Questions Audited**: Number of matched pairs
- **Matched Pairs**: Successfully matched questions
- **Unmatched**: Questions not matched
- **Critical (Bloquant)**: Issues that must be fixed
- **Major (Majeur)**: Issues to address
- **Minor (Mineur)**: Informational

#### Filter Results
- Click severity buttons to show only issues of that level
- **All**: All matched pairs
- **🔴 Critical**: Only critical issues
- **🟡 Major**: Only major issues
- **🔵 Minor**: Only minor issues

#### View Details
1. Click the **▶** arrow to expand a question row
2. See:
   - Match score (percentage)
   - Question comparison
   - Answer comparison
   - Detailed error descriptions
3. Click **▼** to collapse

#### Issue Types

**🔴 Critical (BLOQUANT)** - Must fix:
- Multiple correct answers in QTI
- Answer count mismatch (Excel vs QTI)
- No correct answer marked in QTI
- Question appears in wrong order

**🟡 Major (MAJEUR)** - Should fix:
- Correct answer not in position 1
- Randomization flag mismatch
- Question type mismatch

**🔵 Minor (MINEUR)** - Informational:
- Question text differs
- Title differs
- Answer text differs (typically spacing/punctuation)

### Step 7: Export Results
Available formats:
- **📄 JSON**: For programmatic analysis
- **📝 Markdown**: For documents/reports
- **🌐 HTML**: For viewing in browser
- **📊 CSV**: For spreadsheet analysis

Click button to download with timestamp.

## Configuration Presets

### Default / SPL 2024
- Row Offset: 17 (questions start at Excel row 18)
- Skip Rows: 1 (blank rows between questions)
- Title: Column E
- Prompt: Column F
- Answers: Columns G, H, I, J
- Competency: Column A
- Dimension: Column B
- Indicator: Column C

### Generic
- Row Offset: 0 (questions start at Excel row 1)
- Skip Rows: 0 (no gaps)
- Title: Column A
- Answers: Columns C, D, E, F

## Tips & Troubleshooting

### No questions loaded
- Make sure TAO ZIP was successfully imported
- Check main view shows questions before clicking Audit

### No matches found
- Verify Excel row offset is correct
- Check column letters match your file
- Try lowering match threshold (default: 85%)
- Ensure question text is similar between files

### Match score below 85%
- Differences in question text (typos, punctuation)
- Different question order
- Reword matching in Excel/QTI

### Questions not appearing in results
- They may be unmatched (see "Unmatched Items" section)
- They may have critical errors (check filters)

### Export not working
- Check browser allows downloads
- Try different format
- Ensure browser console shows no errors

## Match Scoring
Match score combines:
- **Prompt similarity**: 50% weight
- **Answer similarity**: 30% weight
- **Title similarity**: 20% weight

Similarity uses Jaro-Winkler algorithm (0-100%):
- 95%+: Excellent match
- 85-94%: Good match
- 70-84%: Fair match
- Below 70%: Poor/no match

## What Gets Compared
For each matched pair:
✅ Question title
✅ Question prompt/body
✅ Number of answer options
✅ Answer text content
✅ Position of correct answer
✅ Multiple correct answers flag
✅ Question order

## Dark Mode
The audit interface respects your dark mode setting. Use the moon/sun icon in the header to toggle.

## Keyboard Shortcuts
None currently implemented. All interactions via mouse/touch.

## Performance
- Typical audit: <5 seconds for 100 questions
- Larger files (500+ questions): May take 10-30 seconds
- No performance issues expected for standard QTI packages

## Limitations
- Match algorithm is greedy (not Hungarian matching)
- No ML-based content comparison
- One-to-one matching only (each Excel matches one QTI, vice versa)
- No batch history tracking

## Future Enhancements
- Custom similarity thresholds per field
- Hungarian algorithm for better matching
- Audit history/batch processing
- Custom error rules
- Integration with QTI generation
