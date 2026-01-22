// Script to generate static data from CSV
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'judge_assignments.csv');
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'data.ts');

const csvText = fs.readFileSync(csvPath, 'utf-8');
const lines = csvText.split('\n').filter(line => line.trim());

function cleanField(field) {
  if (!field) return '';
  // Remove encoding artifacts (the weird character after "Early")
  return field.trim().replace(/[^\x20-\x7E]/g, '');
}

// Normalize judge names to handle variations (e.g., "J. Lucas" vs "J Lucas")
function normalizeJudgeName(name) {
  if (!name) return null;
  let cleaned = cleanField(name);
  if (!cleaned) return null;

  // Specific corrections for known duplicates
  const corrections = {
    'J. Lucas Argueso': 'J Lucas Argueso',
  };

  return corrections[cleaned] || cleaned;
}

function mapResearchStage(input) {
  const normalized = cleanField(input).toLowerCase();
  if (normalized.startsWith('early')) return 'Early';
  if (normalized.startsWith('advanced')) return 'Advanced';
  return null;
}

function mapResearchType(input) {
  const normalized = cleanField(input).toLowerCase();
  if (normalized.includes('foundational')) return 'Foundational Research';
  if (normalized.includes('translational')) return 'Translational Research';
  if (normalized.includes('clinical') || normalized.includes('veterinary')) return 'Veterinary Clinical Research';
  if (normalized.includes('pedagogy') || normalized.includes('social')) return 'Social Sciences/Pedagogy Research';
  return null;
}

function mapPresentationType(input) {
  const normalized = cleanField(input).toLowerCase();
  if (normalized === 'oral') return 'Oral';
  if (normalized === 'poster') return 'Poster';
  if (normalized.includes('undergrad') || normalized === 'ug poster') return 'Undergrad Poster';
  return null;
}

function mapSessionTime(input) {
  const normalized = cleanField(input);
  if (normalized.includes('10:15')) return '10:15 - 11:15';
  if (normalized.includes('11:30')) return '11:30 - 1:30';
  if (normalized.includes('1:45')) return '1:45 - 3:45';
  return null;
}

// Determine session time for posters based on odd/even ID
// Odd-numbered posters → Session 1 (11:30-1:30)
// Even-numbered posters → Session 2 (1:45-3:45)
function getPosterSessionTime(presenterId) {
  // Extract numeric portion from ID (e.g., "1" from "1", "23" from "23", "100" from "100")
  const numericMatch = presenterId.match(/^(\d+)$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    return num % 2 === 1 ? '11:30 - 1:30' : '1:45 - 3:45';
  }
  // If ID doesn't match simple numeric pattern, return null (use CSV value)
  return null;
}

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

// Parse header separately since it's clean
const headerValues = lines[0].split(',').map(h => h.trim());

const presenters = [];
const judgeMap = new Map();
const errors = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  const row = {};
  headerValues.forEach((h, idx) => {
    row[h] = values[idx] || '';
  });

  const rowNum = i + 1;

  if (!row.presentationID) {
    errors.push(`Row ${rowNum}: Missing presentationID`);
    continue;
  }

  const researchType = mapResearchType(row.researchType);
  if (!researchType) {
    errors.push(`Row ${rowNum}: Invalid researchType "${row.researchType}"`);
    continue;
  }

  const presentationType = mapPresentationType(row.presentationType);
  if (!presentationType) {
    errors.push(`Row ${rowNum}: Invalid presentationType "${row.presentationType}"`);
    continue;
  }

  // For Social Sciences/Pedagogy, stage can be null
  let researchStage = mapResearchStage(row.researchStage);
  if (!researchStage && researchType !== 'Social Sciences/Pedagogy Research') {
    errors.push(`Row ${rowNum}: Invalid researchStage "${row.researchStage}"`);
    continue;
  }
  // Default to Early for pedagogy if missing
  if (!researchStage) researchStage = 'Early';

  let presentationTime = mapSessionTime(row.presentationTime);
  if (!presentationTime) {
    errors.push(`Row ${rowNum}: Invalid presentationTime "${row.presentationTime}"`);
    continue;
  }

  // For regular Posters (not Undergrad Poster, not Oral), assign session based on odd/even ID
  if (presentationType === 'Poster') {
    const posterSession = getPosterSessionTime(cleanField(row.presentationID));
    if (posterSession) {
      presentationTime = posterSession;
    }
  }

  const judge1 = normalizeJudgeName(row.judge1);
  const judge2 = normalizeJudgeName(row.judge2);
  const judge3 = normalizeJudgeName(row.judge3);

  const presenter = {
    id: cleanField(row.presentationID),
    firstName: cleanField(row.first),
    lastName: cleanField(row.last),
    email: cleanField(row.email),
    classification: cleanField(row.classification),
    researchStage,
    researchType,
    department: cleanField(row.department),
    presentationType,
    presentationTime,
    title: cleanField(row.presentationTitle),
    judge1,
    judge2,
    judge3,
  };

  presenters.push(presenter);

  // Build judge map
  [judge1, judge2, judge3].filter(Boolean).forEach(judgeName => {
    const judgeId = judgeName.toLowerCase().trim().replace(/\s+/g, '-');
    if (!judgeMap.has(judgeId)) {
      judgeMap.set(judgeId, { id: judgeId, name: judgeName, assignedPresenters: [] });
    }
    judgeMap.get(judgeId).assignedPresenters.push(presenter.id);
  });
}

console.log(`Parsed ${presenters.length} presenters`);
console.log(`Found ${judgeMap.size} judges`);
console.log(`Errors (${errors.length}):`);
errors.forEach(e => console.log(`  ${e}`));

// Generate TypeScript file
const judges = Array.from(judgeMap.values());

const output = `// Auto-generated from judge_assignments.csv
// Generated: ${new Date().toISOString()}

import { Presenter, Judge } from './types';

export const PRESENTERS: Presenter[] = ${JSON.stringify(presenters, null, 2)};

export const JUDGES: Judge[] = ${JSON.stringify(judges, null, 2)};
`;

fs.writeFileSync(outputPath, output);
console.log(`Written to ${outputPath}`);
