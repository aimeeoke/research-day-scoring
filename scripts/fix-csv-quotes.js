// Script to properly quote CSV fields containing commas
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'judge_assignments.csv');
const csvText = fs.readFileSync(csvPath, 'utf-8');
const lines = csvText.split('\n');

// CSV structure (14 fields):
// 0:presentationID, 1:first, 2:last, 3:email, 4:classification,
// 5:researchStage, 6:researchType, 7:department, 8:presentationType,
// 9:presentationTime, 10:presentationTitle, 11:judge1, 12:judge2, 13:judge3

// Header stays as-is
const fixedLines = [lines[0]];

// Load judge reassignments for accurate judge data
const reassignPath = path.join(__dirname, '..', 'judge-reassignments.csv');
const reassignText = fs.readFileSync(reassignPath, 'utf-8').replace(/^\uFEFF/, '');
const reassignLines = reassignText.split('\n').filter(l => l.trim());

const judgeMap = new Map();
for (let i = 1; i < reassignLines.length; i++) {
  const parts = reassignLines[i].split(',');
  const id = parts[0]?.trim();
  if (id) {
    judgeMap.set(id, {
      judge1: parts[3]?.trim() || '',
      judge2: parts[4]?.trim() || '',
      judge3: parts[5]?.trim() || ''
    });
  }
}

console.log(`Loaded ${judgeMap.size} judge assignments`);

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Parse the line respecting existing quotes
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

  // Get the presenter ID
  const id = fields[0]?.trim();

  if (!id) {
    fixedLines.push(line);
    continue;
  }

  // If we have exactly 14 fields and judges from reassignment match, line is fine
  const judges = judgeMap.get(id);

  if (fields.length === 14 && judges) {
    // Replace judge fields with correct ones from reassignments
    fields[11] = judges.judge1;
    fields[12] = judges.judge2;
    fields[13] = judges.judge3;
    fixedLines.push(fields.join(','));
  } else if (fields.length > 14 && judges) {
    // Title has commas - need to fix
    // Fields 0-9 are fixed, field 10+ until we hit judges is title
    const beforeTitle = fields.slice(0, 10);

    // Calculate how many extra fields we have
    const extraFields = fields.length - 14;

    // Title spans from field 10 to field 10 + extraFields (inclusive)
    const titleParts = fields.slice(10, 10 + extraFields + 1);
    const title = titleParts.join(',');

    // Quote the title if it contains commas
    const quotedTitle = `"${title.replace(/"/g, '""')}"`;

    // Reconstruct with correct judges
    const newLine = [...beforeTitle, quotedTitle, judges.judge1, judges.judge2, judges.judge3].join(',');
    fixedLines.push(newLine);

    console.log(`Fixed ${id}: title had ${extraFields + 1} parts`);
  } else if (judges) {
    // Wrong number of fields but we have judges - try to fix
    // Replace last 3 fields with judges
    if (fields.length >= 11) {
      const beforeJudges = fields.slice(0, fields.length - 3);
      const newLine = [...beforeJudges, judges.judge1, judges.judge2, judges.judge3].join(',');
      fixedLines.push(newLine);
      console.log(`Fixed ${id}: adjusted judge positions`);
    } else {
      fixedLines.push(line);
      console.log(`Warning: ${id} has only ${fields.length} fields`);
    }
  } else {
    // No judge data for this presenter (shouldn't happen)
    fixedLines.push(line);
    console.log(`Warning: No judge data for ${id}`);
  }
}

fs.writeFileSync(csvPath, fixedLines.join('\n') + '\n');
console.log(`\nProcessed ${fixedLines.length} lines`);
