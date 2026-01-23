// Script to merge department data into main CSV
const fs = require('fs');
const path = require('path');

const mainCsvPath = path.join(__dirname, '..', 'judge_assignments.csv');
const deptCsvPath = path.join(__dirname, '..', 'departments.csv');

// Read department data
const deptText = fs.readFileSync(deptCsvPath, 'utf-8').replace(/^\uFEFF/, '');
const deptLines = deptText.split('\n').filter(l => l.trim());

const deptMap = new Map();
for (let i = 1; i < deptLines.length; i++) {
  const line = deptLines[i].trim();
  if (!line) continue;

  // Parse handling quoted departments
  let id, dept;
  if (line.includes('"')) {
    const match = line.match(/^([^,]+),(.+)$/);
    if (match) {
      id = match[1].trim();
      dept = match[2].replace(/^"|"$/g, '').trim();
    }
  } else {
    const parts = line.split(',');
    id = parts[0]?.trim();
    dept = parts[1]?.trim();
  }

  if (id && dept) {
    deptMap.set(id, dept);
  }
}

console.log(`Loaded ${deptMap.size} department assignments`);

// Read main CSV
const mainText = fs.readFileSync(mainCsvPath, 'utf-8');
const mainLines = mainText.split('\n');

// Process - department is column 7 (index 7)
const updatedLines = [mainLines[0]]; // Keep header

let updated = 0;
let notFound = 0;

for (let i = 1; i < mainLines.length; i++) {
  const line = mainLines[i].trim();
  if (!line) continue;

  // Parse respecting quotes
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  const id = fields[0]?.trim();
  const dept = deptMap.get(id);

  if (dept) {
    // Quote department if it contains commas
    fields[7] = dept.includes(',') ? `"${dept}"` : dept;
    updated++;
  } else {
    notFound++;
    console.log(`No department for: ${id}`);
  }

  updatedLines.push(fields.join(','));
}

fs.writeFileSync(mainCsvPath, updatedLines.join('\n') + '\n');

console.log(`\nDone!`);
console.log(`  Updated: ${updated} presenters`);
console.log(`  Not found: ${notFound} presenters`);
