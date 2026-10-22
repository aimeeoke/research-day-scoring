// Check for judges with mixed session assignments (odd vs even IDs)
const fs = require('fs');
const dataContent = fs.readFileSync('./src/lib/data.ts', 'utf-8');
const presMatch = dataContent.match(/export const PRESENTERS[^=]*= (\[[\s\S]*?\]);/);
const presenters = JSON.parse(presMatch[1]);

// Filter to regular posters only (not Oral, not Undergrad Poster)
const posters = presenters.filter(p => p.presentationType === 'Poster');

console.log(`Total regular posters: ${posters.length}`);
console.log(`11:30 session posters: ${posters.filter(p => p.presentationTime.includes('11:30')).length}`);
console.log(`1:45 session posters: ${posters.filter(p => p.presentationTime.includes('1:45')).length}`);
console.log('');

// Build map of judge -> assigned poster IDs
const judgeAssignments = new Map();

for (const poster of posters) {
  const judges = [poster.judge1, poster.judge2, poster.judge3].filter(Boolean);
  const id = poster.id;

  // Determine if ID is numeric and odd/even
  const numericId = parseInt(id, 10);
  const isNumeric = !isNaN(numericId) && id === String(numericId);

  for (const judge of judges) {
    if (!judgeAssignments.has(judge)) {
      judgeAssignments.set(judge, { odd: [], even: [], nonNumeric: [] });
    }
    const assignments = judgeAssignments.get(judge);

    if (isNumeric) {
      if (numericId % 2 === 1) {
        assignments.odd.push(id);
      } else {
        assignments.even.push(id);
      }
    } else {
      assignments.nonNumeric.push(id);
    }
  }
}

// Analyze each judge
const mixedJudges = [];
const oddOnlyJudges = [];
const evenOnlyJudges = [];
const nonNumericOnlyJudges = [];

for (const [judge, assignments] of judgeAssignments) {
  const hasOdd = assignments.odd.length > 0;
  const hasEven = assignments.even.length > 0;
  const hasNonNumeric = assignments.nonNumeric.length > 0;

  if (hasOdd && hasEven) {
    mixedJudges.push({ judge, ...assignments });
  } else if (hasOdd && !hasEven) {
    oddOnlyJudges.push({ judge, ...assignments });
  } else if (hasEven && !hasOdd) {
    evenOnlyJudges.push({ judge, ...assignments });
  } else if (hasNonNumeric && !hasOdd && !hasEven) {
    nonNumericOnlyJudges.push({ judge, ...assignments });
  }
}

console.log('=== JUDGES WITH MIXED ODD/EVEN ASSIGNMENTS (PROBLEM) ===');
console.log(`Count: ${mixedJudges.length}`);
console.log('');
mixedJudges.sort((a, b) => a.judge.localeCompare(b.judge));
for (const j of mixedJudges) {
  console.log(`${j.judge}`);
  console.log(`  Odd (11:30):  ${j.odd.join(', ')}`);
  console.log(`  Even (1:45):  ${j.even.join(', ')}`);
  if (j.nonNumeric.length) console.log(`  Non-numeric:  ${j.nonNumeric.join(', ')}`);
}

console.log('');
console.log('=== JUDGES WITH ONLY ODD IDs (11:30 session - OK) ===');
console.log(`Count: ${oddOnlyJudges.length}`);
oddOnlyJudges.sort((a, b) => a.judge.localeCompare(b.judge));
for (const j of oddOnlyJudges) {
  console.log(`  ${j.judge}: ${j.odd.join(', ')}${j.nonNumeric.length ? ' + ' + j.nonNumeric.join(', ') : ''}`);
}

console.log('');
console.log('=== JUDGES WITH ONLY EVEN IDs (1:45 session - OK) ===');
console.log(`Count: ${evenOnlyJudges.length}`);
evenOnlyJudges.sort((a, b) => a.judge.localeCompare(b.judge));
for (const j of evenOnlyJudges) {
  console.log(`  ${j.judge}: ${j.even.join(', ')}${j.nonNumeric.length ? ' + ' + j.nonNumeric.join(', ') : ''}`);
}

if (nonNumericOnlyJudges.length > 0) {
  console.log('');
  console.log('=== JUDGES WITH ONLY NON-NUMERIC IDs ===');
  console.log(`Count: ${nonNumericOnlyJudges.length}`);
  for (const j of nonNumericOnlyJudges) {
    console.log(`  ${j.judge}: ${j.nonNumeric.join(', ')}`);
  }
}

console.log('');
console.log('=== SUMMARY ===');
console.log(`Total poster judges: ${judgeAssignments.size}`);
console.log(`Judges OK (odd only): ${oddOnlyJudges.length}`);
console.log(`Judges OK (even only): ${evenOnlyJudges.length}`);
console.log(`Judges with MIXED assignments: ${mixedJudges.length}`);
