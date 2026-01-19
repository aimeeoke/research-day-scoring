// Script to update judge assignments from JSON file
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'judgeassignments.json');
const dataPath = path.join(__dirname, '..', 'src', 'lib', 'data.ts');

// Read the JSON file
const assignments = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Skip the header row
const dataRows = assignments.slice(1);

// Create a map from presentationID to judge assignments
const judgeMap = new Map();
for (const row of dataRows) {
  const id = row.A?.trim();
  if (!id) continue;

  judgeMap.set(id, {
    judge1: row.D?.trim() || null,
    judge2: row.E?.trim() || null,
    judge3: row.F?.trim() || null,
  });
}

console.log(`Loaded ${judgeMap.size} judge assignments from JSON`);

// Read the data.ts file
let dataContent = fs.readFileSync(dataPath, 'utf-8');

// Parse the PRESENTERS array
const presentersMatch = dataContent.match(/export const PRESENTERS: Presenter\[\] = (\[[\s\S]*?\]);/);
if (!presentersMatch) {
  console.error('Could not find PRESENTERS array in data.ts');
  process.exit(1);
}

const presenters = JSON.parse(presentersMatch[1]);
console.log(`Found ${presenters.length} presenters in data.ts`);

// Update judge assignments
let updated = 0;
let notFound = [];

for (const presenter of presenters) {
  const assignment = judgeMap.get(presenter.id);
  if (assignment) {
    const oldJudges = { judge1: presenter.judge1, judge2: presenter.judge2, judge3: presenter.judge3 };

    // Normalize judge names (handle "J. Lucas" vs "J Lucas")
    const normalizeJudge = (name) => {
      if (!name || name === '') return null;
      // Normalize "J. Lucas Argueso" to "J Lucas Argueso"
      return name.replace(/^J\.\s+/, 'J ').trim() || null;
    };

    presenter.judge1 = normalizeJudge(assignment.judge1);
    presenter.judge2 = normalizeJudge(assignment.judge2);
    presenter.judge3 = normalizeJudge(assignment.judge3);

    // Check if anything changed
    if (oldJudges.judge1 !== presenter.judge1 ||
        oldJudges.judge2 !== presenter.judge2 ||
        oldJudges.judge3 !== presenter.judge3) {
      updated++;
      console.log(`Updated ${presenter.id}: ${presenter.firstName} ${presenter.lastName}`);
      console.log(`  Old: ${oldJudges.judge1 || '(none)'}, ${oldJudges.judge2 || '(none)'}, ${oldJudges.judge3 || '(none)'}`);
      console.log(`  New: ${presenter.judge1 || '(none)'}, ${presenter.judge2 || '(none)'}, ${presenter.judge3 || '(none)'}`);
    }
  } else {
    notFound.push(presenter.id);
  }
}

console.log(`\nUpdated ${updated} presenters`);
if (notFound.length > 0) {
  console.log(`Not found in JSON (${notFound.length}): ${notFound.join(', ')}`);
}

// Rebuild the judges list from updated presenters
const judgeMapNew = new Map();
for (const presenter of presenters) {
  [presenter.judge1, presenter.judge2, presenter.judge3].filter(Boolean).forEach(judgeName => {
    const judgeId = judgeName.toLowerCase().trim().replace(/\s+/g, '-');
    if (!judgeMapNew.has(judgeId)) {
      judgeMapNew.set(judgeId, { id: judgeId, name: judgeName, assignedPresenters: [] });
    }
    judgeMapNew.get(judgeId).assignedPresenters.push(presenter.id);
  });
}

const judges = Array.from(judgeMapNew.values());
console.log(`\nRebuilt judge list: ${judges.length} judges`);

// Generate new data.ts content
const output = `// Auto-generated from judge_assignments.csv
// Updated: ${new Date().toISOString()}

import { Presenter, Judge } from './types';

export const PRESENTERS: Presenter[] = ${JSON.stringify(presenters, null, 2)};

export const JUDGES: Judge[] = ${JSON.stringify(judges, null, 2)};
`;

fs.writeFileSync(dataPath, output);
console.log(`\nWritten updated data to ${dataPath}`);
