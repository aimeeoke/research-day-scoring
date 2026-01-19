const json = require('../judgeassignments.json');
const fs = require('fs');
const dataContent = fs.readFileSync('./src/lib/data.ts', 'utf-8');
const presMatch = dataContent.match(/export const PRESENTERS[^=]*= (\[[\s\S]*?\]);/);
const presenters = JSON.parse(presMatch[1]);

// Normalize function
const norm = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/^j\.\s+/, 'j ');

// Build map from JSON - handle duplicates by using last entry
const jsonMap = {};
json.slice(1).forEach(r => {
  const id = r.A ? r.A.trim() : null;
  if (!id) return;
  jsonMap[id] = {
    j1: norm(r.D),
    j2: norm(r.E),
    j3: norm(r.F)
  };
});

// Compare
let mismatches = [];
presenters.forEach(p => {
  const expected = jsonMap[p.id];
  if (!expected) {
    console.log('No JSON entry for:', p.id, p.firstName, p.lastName);
    return;
  }

  const actual = {
    j1: norm(p.judge1),
    j2: norm(p.judge2),
    j3: norm(p.judge3)
  };

  if (expected.j1 !== actual.j1 || expected.j2 !== actual.j2 || expected.j3 !== actual.j3) {
    mismatches.push({
      id: p.id,
      name: p.firstName + ' ' + p.lastName,
      expected,
      actual
    });
  }
});

console.log('Total mismatches found:', mismatches.length);
if (mismatches.length > 0) {
  console.log('\nFirst 20 mismatches:');
  mismatches.slice(0, 20).forEach(m => {
    console.log(m.id, '-', m.name);
    console.log('  Expected:', m.expected.j1, '|', m.expected.j2, '|', m.expected.j3);
    console.log('  Actual:  ', m.actual.j1, '|', m.actual.j2, '|', m.actual.j3);
  });
}
