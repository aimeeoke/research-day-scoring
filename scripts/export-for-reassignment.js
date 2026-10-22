// Export poster assignments to CSV for manual reassignment
const fs = require('fs');
const dataContent = fs.readFileSync('./src/lib/data.ts', 'utf-8');
const presMatch = dataContent.match(/export const PRESENTERS[^=]*= (\[[\s\S]*?\]);/);
const presenters = JSON.parse(presMatch[1]);

// Filter to regular posters only
const posters = presenters.filter(p => p.presentationType === 'Poster');

// Sort by ID (numeric first, then alpha)
posters.sort((a, b) => {
  const aNum = parseInt(a.id, 10);
  const bNum = parseInt(b.id, 10);
  const aIsNum = !isNaN(aNum) && a.id === String(aNum);
  const bIsNum = !isNaN(bNum) && b.id === String(bNum);

  if (aIsNum && bIsNum) return aNum - bNum;
  if (aIsNum) return -1;
  if (bIsNum) return 1;
  return a.id.localeCompare(b.id);
});

// Create CSV
const rows = [
  ['ID', 'Session', 'Odd/Even', 'First Name', 'Last Name', 'Title', 'Research Type', 'Research Stage', 'Department', 'Judge 1', 'Judge 2', 'Judge 3']
];

for (const p of posters) {
  const numId = parseInt(p.id, 10);
  const isNumeric = !isNaN(numId) && p.id === String(numId);
  const oddEven = isNumeric ? (numId % 2 === 1 ? 'ODD' : 'EVEN') : 'N/A';
  const session = p.presentationTime.includes('11:30') ? '11:30' : (p.presentationTime.includes('1:45') ? '1:45' : p.presentationTime);

  rows.push([
    p.id,
    session,
    oddEven,
    p.firstName,
    p.lastName,
    p.title.replace(/"/g, '""'), // Escape quotes
    p.researchType,
    p.researchStage,
    p.department || '',
    p.judge1 || '',
    p.judge2 || '',
    p.judge3 || ''
  ]);
}

// Write presenter CSV
const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
fs.writeFileSync('./poster-assignments.csv', csvContent);
console.log(`Exported ${posters.length} posters to poster-assignments.csv`);

// Also create a judge summary CSV
const judgeMap = new Map();
for (const p of posters) {
  const numId = parseInt(p.id, 10);
  const isNumeric = !isNaN(numId) && p.id === String(numId);
  const oddEven = isNumeric ? (numId % 2 === 1 ? 'ODD' : 'EVEN') : 'N/A';

  for (const judge of [p.judge1, p.judge2, p.judge3].filter(Boolean)) {
    if (!judgeMap.has(judge)) {
      judgeMap.set(judge, { odd: [], even: [], other: [] });
    }
    const j = judgeMap.get(judge);
    if (oddEven === 'ODD') j.odd.push(p.id);
    else if (oddEven === 'EVEN') j.even.push(p.id);
    else j.other.push(p.id);
  }
}

const judgeRows = [
  ['Judge Name', 'Status', 'Odd IDs (11:30)', 'Odd Count', 'Even IDs (1:45)', 'Even Count', 'Total Assignments']
];

const judges = Array.from(judgeMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, assignments] of judges) {
  const hasOdd = assignments.odd.length > 0;
  const hasEven = assignments.even.length > 0;
  let status = 'OK';
  if (hasOdd && hasEven) status = 'MIXED - NEEDS FIX';
  else if (hasOdd) status = 'OK - 11:30 only';
  else if (hasEven) status = 'OK - 1:45 only';

  judgeRows.push([
    name,
    status,
    assignments.odd.join('; '),
    assignments.odd.length,
    assignments.even.join('; '),
    assignments.even.length,
    assignments.odd.length + assignments.even.length + assignments.other.length
  ]);
}

const judgeCsv = judgeRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
fs.writeFileSync('./judge-summary.csv', judgeCsv);
console.log(`Exported ${judges.length} judges to judge-summary.csv`);

console.log('\nFiles created:');
console.log('  poster-assignments.csv - All poster presenters with their current judge assignments');
console.log('  judge-summary.csv - Summary of each judge\'s assignments with status');
