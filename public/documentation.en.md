# Export-TAO

**Version: 02-10-2024**

---

## Table of Contents

1. [Introduction](#introduction)
2. [File Preparation](#file-preparation)
3. [Export](#export)
4. [Support](#support)
5. [Technical Info](#technical-info)

---

## Introduction

This document is designed to guide you through the TAO test export platform. The site supports open-ended questions and multiple-choice questions.

This application is intended for the testing team at SPF Finances. No modifications will be made to accommodate use cases other than those of the SPF Finances testing team.

---

## File Preparation

### Step 1: Export an exam or questions

1. Go to **TAO** and select the exam or folder containing the questions you want to export as PDF.
2. Click the **Export** button at the bottom left of your screen.
3. A menu will appear on the right, and you can proceed to the next step.

![Placeholder: Screenshot of TAO interface showing the Export button location - TODO: Add image here]

### Step 2: Select export type

1. Verify that the export type is **QTI Exam 2.2**
2. Click **Export**.
3. If the download starts directly, you can proceed to the next step.

![Placeholder: Screenshot of export type selection - TODO: Add image here]

> **If the download does NOT start**, you must wait for the export to be processed. You can check its status in the upper right corner of the TAO interface. Once the task is complete, you can click the save icon.

- The task is not yet complete and is being processed.
- The task is complete and you can click the download icon.

---

## Export

### Step 1: Configuration

1. Go to the following site: **Export-TAO**
2. Click **Browse** and select the zip file from the previous step.
3. The site will automatically generate the questions and display them on the right side of the page.
4. You can then use the various options to configure the export as you wish:

| Option | Description |
|--------|-------------|
| **Answer** | Show/Hide answers |
| **Instruction** | Show/Hide instructions |
| **Letter** | Bullet list / Alphabetical list |
| **Compare** | Visual comparison of two tests |
| **Inzage** | Exam mode - underlined answers |
| **Sort question** | Sort questions by title |
| **Randomize** | Shuffle questions/answers |
| **Zoom** | Change displayed element size |
| **Multiple Files** | Load multiple files |
| **Merge Files** | Merge multiple exams |
| **Audit** | Audit mode to validate matches between Excel and QTI files |
| **Get PDF** | Opens print window |
| **Show/Hide** | Individually hide questions or change their order |

![Placeholder: Screenshot of Export-TAO interface with all options - TODO: Add image here]

### Step 2a: Audit Mode (Optional)

The **Audit Mode** allows you to validate the quality of the match between your Excel file and the QTI file exported from TAO. To use this mode:

1. Click on the **Audit** tab at the top of the form
2. Upload your Excel file containing reference questions
3. The application will:
   - Automatically compare Excel questions with QTI questions
   - Display a match score for each question
   - Identify discrepancies (titles, prompts, answers)
   - Detect potential copy-paste errors
   - Generate a detailed report with critical, major, and minor errors
4. You can export the report in JSON, Markdown, HTML, or CSV format
5. Printing the report is also available with all details (one question per page)

**Types of errors detected:**
- **Critical (Blocking)**: Major data differences
- **Major**: Significant discrepancies
- **Minor**: Small formatting or presentation differences

### Step 2b: Create PDF

Finalize the configuration, then click **Get PDF**. This button will open a print window. From this menu, you will need to choose either to print or export as PDF according to your needs.

---

## Support

The **Export-TAO** site is in no way affiliated with TAO, SPF Stratégie & Appui, or SPF Finances. Please do not contact the technical support of these organizations, but instead contact **Benoit Welsch (MINFIN)** on Teams or use these email addresses:

- benoitwelsch@minfin.fed.be
- main@lv0.eu

---

## Technical Info

| | |
|---|---|
| **Site Link** | https://export.tao.lv0.eu/ |
| **Developer** | Benoit Welsch |
| **Email** | benoitwelsch@minfin.fed.be |
| **Hosting** | Cloudflare |
| **Frontend** | Svelte |
| **Repository** | [SPF-Open/Tao_export](https://github.com/SPF-Open/Tao_export) |

### Privacy

The site does not store any files and does not keep any trace of its use. All data processing is done client-side and no confidential information passes through Cloudflare's servers.

Cloudflare only serves to make HTML, CSS, and JS files public and accessible.

The site is entirely open-source and is available on GitHub.
