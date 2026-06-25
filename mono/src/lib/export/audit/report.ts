import type { AuditReport, AuditResult } from './types';

/**
 * Build Markdown report from audit results
 */
export function buildMarkdown(report: AuditReport): string {
  const sections: string[] = [];

  // Header
  sections.push('# Audit TAO - Detailed Report');
  sections.push('');

  // Timestamp
  sections.push(`**Generated**: ${new Date(report.timestamp).toLocaleString()}`);
  sections.push('');

  // Summary section
  sections.push('## 📊 Summary');
  sections.push('');
  sections.push('| Metric | Value |');
  sections.push('|--------|-------|');
  sections.push(`| Total Questions Audited | ${report.summary.total} |`);
  sections.push(`| Matched Pairs | ${report.summary.matched} |`);
  sections.push(`| Match Rate | ${((report.summary.matched / report.summary.total) * 100).toFixed(1)}% |`);
  sections.push(`| Unmatched (Excel) | ${report.unmatched.excel.length} |`);
  sections.push(`| Unmatched (QTI) | ${report.unmatched.qti.length} |`);
  sections.push(`| Duplicate Titles Found | ${report.summary.duplicateTitles} |`);
  sections.push(`| Potential Copy-Paste Errors | ${report.summary.potentialCopyPasteErrors} |`);
  sections.push('');

  // Issues section
  sections.push('## ⚠️ Issues Found');
  sections.push('');
  sections.push('| Severity | Count | Status |');
  sections.push('|----------|-------|--------|');
  sections.push(`| 🔴 Bloquant (Critical) | **${report.summary.bloquants}** | ${report.summary.bloquants > 0 ? '❌ FAIL' : '✅ PASS'} |`);
  sections.push(`| 🟡 Majeur (Major) | **${report.summary.majeurs}** | ${report.summary.majeurs > 0 ? '⚠️ WARNING' : '✅ PASS'} |`);
  sections.push(`| 🔵 Mineur (Minor) | **${report.summary.mineurs}** | ℹ️ Info |`);
  sections.push('');

  // Critical Issues Detail
  const criticalResults = report.results.filter((r) => r.hasCriticalErrors);
  if (criticalResults.length > 0) {
    sections.push('## 🔴 Critical Issues (Must Fix)');
    sections.push('');
    criticalResults.forEach((result, idx) => {
      const qTitle = result.pair.qti.title || result.pair.qti.prompt.substring(0, 50);
      sections.push(`### Issue ${idx + 1}: ${qTitle}`);

      const bloquants = result.errors.filter((e) => e.severity === 'BLOQUANT');
      bloquants.forEach((error) => {
        sections.push(`- **${error.type}**: ${formatErrorDetail(error)}`);
      });
      sections.push('');
    });
  }

  // Major Issues Detail
  const majorResults = report.results.filter((r) => r.errors.some((e) => e.severity === 'MAJEUR'));
  if (majorResults.length > 0) {
    sections.push('## 🟡 Major Issues');
    sections.push('');
    majorResults.slice(0, 10).forEach((result, idx) => {
      const qTitle = result.pair.qti.title || result.pair.qti.prompt.substring(0, 50);
      sections.push(`### Q${idx + 1}: ${qTitle}`);
      sections.push(`- **Match Score**: ${(result.pair.score * 100).toFixed(1)}%`);
      sections.push(`- **Excel Row**: ${result.pair.excel.metadata.excelRow}`);

      const majeurs = result.errors.filter((e) => e.severity === 'MAJEUR');
      majeurs.forEach((error) => {
        sections.push(`- **${error.type}**: ${formatErrorDetail(error)}`);
      });
      sections.push('');
    });
    if (majorResults.length > 10) {
      sections.push(`**... and ${majorResults.length - 10} more major issues**`);
    }
    sections.push('');
  }

  // Minor Issues Detail
  const minorResults = report.results.filter((r) => r.errors.some((e) => e.severity === 'MINEUR'));
  if (minorResults.length > 0) {
    sections.push('## 🔵 Minor Issues');
    sections.push('');
    minorResults.slice(0, 15).forEach((result, idx) => {
      const qTitle = result.pair.qti.title || result.pair.qti.prompt.substring(0, 50);
      sections.push(`- **Q${idx + 1}**: ${qTitle} (${(result.pair.score * 100).toFixed(1)}%)`);

      const mineurs = result.errors.filter((e) => e.severity === 'MINEUR');
      mineurs.forEach((error) => {
        sections.push(`  - ${error.type}: ${formatErrorDetail(error)}`);
      });
    });
    if (minorResults.length > 15) {
      sections.push(`\n*... and ${minorResults.length - 15} more minor issues*`);
    }
    sections.push('');
  }

  // Unmatched Questions
  if (report.unmatched.excel.length > 0 || report.unmatched.qti.length > 0) {
    sections.push('## 📭 Unmatched Items');
    sections.push('');

    if (report.unmatched.excel.length > 0) {
      sections.push(`### Excel Questions Not Matched (${report.unmatched.excel.length})`);
      sections.push('');
      report.unmatched.excel.slice(0, 5).forEach((q, idx) => {
        const qObj = q as any;
        const question = qObj.question || q;
        sections.push(`#### ${idx + 1}. Row ${question.metadata?.excelRow || 'N/A'}`);
        sections.push(`\`\`\`\n${question.prompt.substring(0, 100)}...\n\`\`\``);
        
        if ((qObj.closeMatches?.length || 0) > 0) {
          sections.push(`**Close Matches**: ${qObj.closeMatches.slice(0, 2).map((m: any) => `${(m.score * 100).toFixed(0)}%`).join(', ')}`);
        }
        sections.push('');
      });
      if (report.unmatched.excel.length > 5) {
        sections.push(`**... and ${report.unmatched.excel.length - 5} more unmatched Excel questions**`);
      }
      sections.push('');
    }

    if (report.unmatched.qti.length > 0) {
      sections.push(`### QTI Questions Not Matched (${report.unmatched.qti.length})`);
      sections.push('');
      report.unmatched.qti.slice(0, 5).forEach((q, idx) => {
        const qObj = q as any;
        const question = qObj.question || q;
        sections.push(`#### ${idx + 1}. ${question.title || question.prompt.substring(0, 50)}`);
        sections.push(`\`\`\`\n${question.prompt.substring(0, 100)}...\n\`\`\``);
        
        if ((qObj.closeMatches?.length || 0) > 0) {
          sections.push(`**Close Matches**: ${qObj.closeMatches.slice(0, 2).map((m: any) => `${(m.score * 100).toFixed(0)}%`).join(', ')}`);
        }
        sections.push('');
      });
      if (report.unmatched.qti.length > 5) {
        sections.push(`**... and ${report.unmatched.qti.length - 5} more unmatched QTI questions**`);
      }
      sections.push('');
    }
  }

  // Recommendations
  sections.push('## 💡 Recommendations');
  sections.push('');
  if (report.summary.bloquants > 0) {
    sections.push('**ACTION REQUIRED**: Resolve all critical (Bloquant) issues before deployment.');
  } else if (report.summary.majeurs > 0) {
    sections.push('**RECOMMENDED**: Address major (Majeur) issues to ensure data quality.');
  } else {
    sections.push('✅ **All checks passed!** No critical issues detected.');
  }
  sections.push('');

  // Footer
  sections.push('---');
  sections.push('*This report was automatically generated by TAO Audit.*');

  return sections.join('\n');
}

/**
 * Format error detail for display
 */
function formatErrorDetail(error: any): string {
  if (!error.detail) {
    return error.type;
  }

  const { detail } = error;

  if (detail.field === 'answer_count') {
    return `Expected ${detail.excel} answers, found ${detail.qti}`;
  }

  if (detail.field === 'correct_answers') {
    return `Found ${detail.qti} correct answer(s), expected 1`;
  }

  if (detail.field === 'correct_position') {
    return `Correct answer at position ${detail.qti}, expected position 0 (first)`;
  }

  if (detail.field === 'type') {
    return `Type mismatch: Excel="${detail.excel}", QTI="${detail.qti}"`;
  }

  if (detail.excel !== undefined && detail.qti !== undefined) {
    if (typeof detail.excel === 'string' && typeof detail.qti === 'string') {
      if (detail.excel.length < 60 && detail.qti.length < 60) {
        return `"${detail.excel}" ≠ "${detail.qti}"`;
      }
    }
    return `Excel: ${String(detail.excel).substring(0, 40)}... vs QTI: ${String(detail.qti).substring(0, 40)}...`;
  }

  return error.type;
}

/**
 * Build HTML report (for printing/viewing in browser)
 */
export function buildHTML(report: AuditReport): string {
  const markdown = buildMarkdown(report);
  const lines = markdown.split('\n');
  let htmlContent = '';
  let inList = false;
  let inTable = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        htmlContent += '</pre>';
        inCodeBlock = false;
      } else {
        htmlContent += '<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;"><code>';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      htmlContent += line + '\n';
      continue;
    }

    // Close list if we encounter non-list content
    if (inList && !trimmed.startsWith('-') && trimmed !== '') {
      htmlContent += '</ul>';
      inList = false;
    }

    // Handle headers
    if (line.startsWith('###### ')) {
      htmlContent += `<h6>${line.substring(7)}</h6>`;
    } else if (line.startsWith('##### ')) {
      htmlContent += `<h5>${line.substring(6)}</h5>`;
    } else if (line.startsWith('#### ')) {
      htmlContent += `<h4>${line.substring(5)}</h4>`;
    } else if (line.startsWith('### ')) {
      htmlContent += `<h3>${line.substring(4)}</h3>`;
    } else if (line.startsWith('## ')) {
      htmlContent += `<h2>${line.substring(3)}</h2>`;
    } else if (line.startsWith('# ')) {
      htmlContent += `<h1>${line.substring(2)}</h1>`;
    }
    // Handle tables
    else if (trimmed.startsWith('|')) {
      if (!inTable) {
        htmlContent += '<table style="width:100%;border-collapse:collapse;margin:1em 0;">';
        inTable = true;
      }

      const cells = trimmed.split('|').filter((c) => c.trim());
      const isHeaderSeparator = cells.every((c) => c.trim().match(/^-+$/));

      if (!isHeaderSeparator) {
        const isHeader = i === 1 || (i > 0 && lines[i - 1].trim().startsWith('|') && lines[i + 1].trim().startsWith('|') && lines[i + 1].split('|').every((c) => c.trim().match(/^-+$/) || c.trim() === ''));
        const tag = isHeader ? 'th' : 'td';
        htmlContent += '<tr>';
        cells.forEach((cell) => {
          htmlContent += `<${tag} style="padding:10px;border-bottom:1px solid #ddd;">${cell.trim()}</${tag}>`;
        });
        htmlContent += '</tr>';
      }
    } else if (inTable && trimmed === '') {
      htmlContent += '</table>';
      inTable = false;
    }
    // Handle lists
    else if (trimmed.startsWith('- ')) {
      if (!inList) {
        htmlContent += '<ul style="margin:0.5em 0;padding-left:2em;">';
        inList = true;
      }
      const listContent = trimmed.substring(2);
      htmlContent += `<li>${listContent}</li>`;
    }
    // Handle horizontal rules
    else if (trimmed === '---') {
      htmlContent += '<hr style="margin:2em 0;border:none;border-top:2px solid #ecf0f1;">';
    }
    // Handle empty lines
    else if (trimmed === '') {
      if (!inTable && !inList) {
        htmlContent += '';
      }
    }
    // Handle regular paragraphs
    else {
      htmlContent += `<p>${trimmed}</p>`;
    }
  }

  // Close any open tags
  if (inList) htmlContent += '</ul>';
  if (inTable) htmlContent += '</table>';
  if (inCodeBlock) htmlContent += '</code></pre>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TAO Audit Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      background: white;
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    h1 {
      font-size: 2.2em;
      margin: 0.5em 0 0.3em;
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 0.3em;
    }
    
    h2 {
      font-size: 1.7em;
      margin: 1.5em 0 0.5em;
      color: #34495e;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 0.2em;
    }
    
    h3 {
      font-size: 1.3em;
      margin: 1.2em 0 0.4em;
      color: #34495e;
    }
    
    h4 {
      font-size: 1.1em;
      margin: 0.8em 0 0.3em;
      color: #7f8c8d;
    }
    
    p {
      margin: 0.8em 0;
      color: #555;
    }
    
    strong {
      color: #2c3e50;
      font-weight: 600;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      background: #fafbfc;
      border: 1px solid #e1e8ed;
      border-radius: 6px;
      overflow: hidden;
    }
    
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #667eea;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e1e8ed;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr:hover {
      background: #f0f3f7;
    }
    
    ul {
      margin: 1em 0;
      padding-left: 2.5em;
    }
    
    li {
      margin: 0.5em 0;
      color: #555;
    }
    
    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1em 0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.5;
    }
    
    code {
      background: #f5f5f5;
      color: #e74c3c;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.95em;
    }
    
    pre code {
      background: none;
      color: #ecf0f1;
      padding: 0;
    }
    
    hr {
      margin: 2.5em 0;
      border: none;
      border-top: 2px dashed #ecf0f1;
    }
    
    .critical {
      color: #e74c3c;
      font-weight: bold;
    }
    
    .warning {
      color: #f39c12;
      font-weight: bold;
    }
    
    .success {
      color: #27ae60;
      font-weight: bold;
    }
    
    .info {
      color: #3498db;
      font-weight: bold;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
      table {
        page-break-inside: avoid;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${htmlContent}
  </div>
</body>
</html>`;

  return html;
}

/**
 * Export report as CSV (for spreadsheet analysis)
 */
export function buildCSV(report: AuditReport): string {
  const rows: string[] = [];

  // Header
  rows.push(
    'Type,Severity,Question Title,Question ID,Error Type,Detail,Excel Value,QTI Value'
  );

  // Results
  for (const result of report.results) {
    const title = result.pair.qti.title || result.pair.qti.prompt.substring(0, 50);
    const id = result.pair.qti.id || '';

    if (result.errors.length === 0) {
      rows.push(`Matched,OK,"${title}","${id}","No errors","","",`);
    } else {
      for (const error of result.errors) {
        const excelVal = error.detail?.excel ? String(error.detail.excel).substring(0, 50) : '';
        const qtiVal = error.detail?.qti ? String(error.detail.qti).substring(0, 50) : '';

        rows.push(
          `Comparison,${error.severity},"${title}","${id}","${error.type}","${error.detail?.field || ''}","${excelVal}","${qtiVal}"`
        );
      }
    }
  }

  // Unmatched
  for (const q of report.unmatched.excel) {
    const title = 'title' in q.question && q.question.title ? q.question.title : q.question.prompt;
    rows.push(`Unmatched,BLOQUANT,"${title.substring(0, 50)}","","No match found in QTI","","",`);
  }

  for (const q of report.unmatched.qti) {
    const title = 'title' in q.question && q.question.title ? q.question.title : q.question.prompt;
    const id = 'id' in q.question ? q.question.id || '' : '';
    rows.push(`Unmatched,INFO,"${title.substring(0, 50)}","${id}","No match found in Excel","","",`);
  }

  return rows.join('\n');
}

/**
 * Download report as file
 */
export function downloadReport(
  report: AuditReport,
  format: 'json' | 'markdown' | 'html' | 'csv' = 'json'
): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'markdown':
      content = buildMarkdown(report);
      filename = `audit-report-${Date.now()}.md`;
      mimeType = 'text/markdown';
      break;
    case 'html':
      content = buildHTML(report);
      filename = `audit-report-${Date.now()}.html`;
      mimeType = 'text/html';
      break;
    case 'csv':
      content = buildCSV(report);
      filename = `audit-report-${Date.now()}.csv`;
      mimeType = 'text/csv';
      break;
    case 'json':
    default:
      content = JSON.stringify(report, null, 2);
      filename = `audit-report-${Date.now()}.json`;
      mimeType = 'application/json';
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
