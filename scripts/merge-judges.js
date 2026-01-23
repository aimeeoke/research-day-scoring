// Script to merge judge reassignments into main CSV
const fs = require('fs');
const path = require('path');

const mainCsvPath = path.join(__dirname, '..', 'judge_assignments.csv');
const reassignCsvPath = path.join(__dirname, '..', 'judge-reassignments.csv');

// Parse CSV line handling quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Read reassignments
const reassignText = fs.readFileSync(reassignCsvPath, 'utf-8').replace(/^\uFEFF/, ''); // Remove BOM
const reassignLines = reassignText.split('\n').filter(l => l.trim());
const reassignHeader = reassignLines[0].split(',').map(h => h.trim());

const reassignMap = new Map();
for (let i = 1; i < reassignLines.length; i++) {
  const values = parseCSVLine(reassignLines[i]);
  const id = values[0]?.trim();
  if (id) {
    reassignMap.set(id, {
      firstName: values[1]?.trim() || '',
      lastName: values[2]?.trim() || '',
      judge1: values[3]?.trim() || '',
      judge2: values[4]?.trim() || '',
      judge3: values[5]?.trim() || ''
    });
  }
}

console.log(`Loaded ${reassignMap.size} reassignments`);

// Read main CSV
const mainText = fs.readFileSync(mainCsvPath, 'utf-8');
const mainLines = mainText.split('\n').filter(l => l.trim());
const mainHeader = mainLines[0];

// Process main CSV
const updatedLines = [mainHeader];
const foundIds = new Set();
let updated = 0;
let removed = 0;

for (let i = 1; i < mainLines.length; i++) {
  const values = parseCSVLine(mainLines[i]);
  const id = values[0]?.trim();

  if (!id) continue;

  if (reassignMap.has(id)) {
    foundIds.add(id);
    const reassign = reassignMap.get(id);

    // Update judge columns (indices 11, 12, 13 in the main CSV)
    values[11] = reassign.judge1;
    values[12] = reassign.judge2;
    values[13] = reassign.judge3;

    // Handle U24 special case - update name format
    if (id === 'U24') {
      values[1] = 'Victoria Aragon and Emma';
      values[2] = 'Hinchliffe';
    }

    updatedLines.push(values.join(','));
    updated++;
  } else {
    console.log(`Removing presenter: ${id} - ${values[1]} ${values[2]}`);
    removed++;
  }
}

// Check for new presenters
const newPresenters = [];
for (const [id, data] of reassignMap) {
  if (!foundIds.has(id)) {
    console.log(`New presenter: ${id} - ${data.firstName} ${data.lastName}`);
    newPresenters.push({ id, ...data });
  }
}

// Write updated CSV
fs.writeFileSync(mainCsvPath, updatedLines.join('\n') + '\n');

console.log(`\nSummary:`);
console.log(`  Updated: ${updated} presenters`);
console.log(`  Removed: ${removed} presenters`);
console.log(`  New presenters to add manually: ${newPresenters.length}`);
newPresenters.forEach(p => console.log(`    - ${p.id}: ${p.firstName} ${p.lastName}`));
