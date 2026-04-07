import { generateDiff } from './src/lib/audit/normalize';

// Test with user's example
const excel = "Quel est l'objectif principal de la méthode des 5S dans un environnement de bureau comme le SPF Finances .";
const qti = "Quel est l'objectif principal de la méthode des 5S dans un environnement de bureau comme le SPF Finances ?";

console.log("Excel:", excel);
console.log("QTI:", qti);
console.log("\n=== Diff from Excel perspective (what's changed from Excel to QTI) ===");
const diffExcel = generateDiff(excel, qti);
console.log("Diffs (Excel -> QTI):", JSON.stringify(diffExcel, null, 2));

console.log("\n=== Diff from QTI perspective (what's changed from QTI to Excel) ===");
const diffQTI = generateDiff(qti, excel);
console.log("Diffs (QTI -> Excel):", JSON.stringify(diffQTI, null, 2));

// Test with simpler example
console.log("\n\n=== Simple test: 'Hello' vs 'Help' ===");
const simple1 = "Hello";
const simple2 = "Help";
console.log("String 1:", simple1);
console.log("String 2:", simple2);
console.log("Diffs:", JSON.stringify(generateDiff(simple1, simple2), null, 2));
