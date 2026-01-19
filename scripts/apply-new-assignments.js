// Apply new judge assignments from CSV
const fs = require('fs');

// Read the new assignments CSV
const csvContent = fs.readFileSync('./newAssignments.csv', 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim());

// Parse CSV (skip header)
const newAssignments = new Map();
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  const id = parts[0].trim();
  const judge1 = parts[1] ? parts[1].trim() : null;
  const judge2 = parts[2] ? parts[2].trim() : null;
  if (id) {
    newAssignments.set(id, { judge1, judge2 });
  }
}
console.log(`Loaded ${newAssignments.size} new assignments from CSV`);

// Read data.ts
const dataContent = fs.readFileSync('./src/lib/data.ts', 'utf-8');
const presMatch = dataContent.match(/export const PRESENTERS[^=]*= (\[[\s\S]*?\]);/);
const presenters = JSON.parse(presMatch[1]);

// Apply updates
let updated = 0;
for (const presenter of presenters) {
  const assignment = newAssignments.get(presenter.id);
  if (assignment) {
    const changed = presenter.judge1 !== assignment.judge1 || presenter.judge2 !== assignment.judge2;
    if (changed) {
      console.log(`${presenter.id}: ${presenter.firstName} ${presenter.lastName}`);
      console.log(`  Old: ${presenter.judge1} | ${presenter.judge2}`);
      console.log(`  New: ${assignment.judge1} | ${assignment.judge2}`);
      presenter.judge1 = assignment.judge1;
      presenter.judge2 = assignment.judge2;
      updated++;
    }
  }
}

console.log(`\nUpdated ${updated} presenters`);

// Rebuild judges list
const judgeMap = new Map();
for (const presenter of presenters) {
  [presenter.judge1, presenter.judge2, presenter.judge3].filter(Boolean).forEach(judgeName => {
    const judgeId = judgeName.toLowerCase().trim().replace(/\s+/g, '-');
    if (!judgeMap.has(judgeId)) {
      judgeMap.set(judgeId, { id: judgeId, name: judgeName, assignedPresenters: [] });
    }
    judgeMap.get(judgeId).assignedPresenters.push(presenter.id);
  });
}

const judges = Array.from(judgeMap.values());
console.log(`Rebuilt judge list: ${judges.length} judges`);

// Write updated data.ts
const output = `// Auto-generated from judge_assignments.csv
// Updated: ${new Date().toISOString()}

import { Presenter, Judge } from './types';

export const PRESENTERS: Presenter[] = ${JSON.stringify(presenters, null, 2)};

export const JUDGES: Judge[] = ${JSON.stringify(judges, null, 2)};
`;

fs.writeFileSync('./src/lib/data.ts', output);
console.log('Written updated data.ts');
