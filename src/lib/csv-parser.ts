// CSV Parser for Research Day Scoring System

import Papa from 'papaparse';
import { 
  Presenter, 
  Judge, 
  CSVPresenterRow,
  ResearchStage,
  ResearchType,
  PresentationType,
  SessionTime,
} from './types';
import { normalizeJudgeName, generateId } from './storage';

// =============================================================================
// CSV PARSING
// =============================================================================

/**
 * Parse CSV file and return presenters array
 */
export function parsePresenterCSV(csvText: string): {
  presenters: Presenter[];
  judges: Judge[];
  errors: string[];
} {
  const errors: string[] = [];
  
  const result = Papa.parse<CSVPresenterRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  if (result.errors.length > 0) {
    errors.push(...result.errors.map(e => `Row ${e.row}: ${e.message}`));
  }
  
  const presenters: Presenter[] = [];
  const judgeMap = new Map<string, Judge>();
  
  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2; // Account for header row and 0-indexing
    
    // Validate required fields
    if (!row.presentationID) {
      errors.push(`Row ${rowNum}: Missing presentationID`);
      continue;
    }
    
    // Map research type
    const researchType = mapResearchType(row.researchType);
    if (!researchType) {
      errors.push(`Row ${rowNum}: Invalid researchType "${row.researchType}"`);
      continue;
    }
    
    // Map presentation type
    const presentationType = mapPresentationType(row.presentationType);
    if (!presentationType) {
      errors.push(`Row ${rowNum}: Invalid presentationType "${row.presentationType}"`);
      continue;
    }
    
    // Map research stage
    const researchStage = mapResearchStage(row.researchStage);
    if (!researchStage) {
      errors.push(`Row ${rowNum}: Invalid researchStage "${row.researchStage}"`);
      continue;
    }
    
    // Map session time
    const presentationTime = mapSessionTime(row.presentationTime);
    if (!presentationTime) {
      errors.push(`Row ${rowNum}: Invalid presentationTime "${row.presentationTime}"`);
      continue;
    }
    
    // Create presenter
    const presenter: Presenter = {
      id: row.presentationID.trim(),
      firstName: row.first?.trim() || '',
      lastName: row.last?.trim() || '',
      email: row.email?.trim() || '',
      classification: row.classification?.trim() || '',
      researchStage,
      researchType,
      department: row.department?.trim() || '',
      presentationType,
      presentationTime,
      title: row.presentationTitle?.trim() || '',
      judge1: cleanJudgeName(row.judge1),
      judge2: cleanJudgeName(row.judge2),
      judge3: cleanJudgeName(row.judge3),
    };
    
    presenters.push(presenter);
    
    // Extract judges
    const judgeNames = [presenter.judge1, presenter.judge2, presenter.judge3]
      .filter((name): name is string => name !== null && name.length > 0);
    
    for (const judgeName of judgeNames) {
      const judgeId = normalizeJudgeName(judgeName);
      
      if (!judgeMap.has(judgeId)) {
        judgeMap.set(judgeId, {
          id: judgeId,
          name: judgeName,
          assignedPresenters: [],
        });
      }
      
      judgeMap.get(judgeId)!.assignedPresenters.push(presenter.id);
    }
  }
  
  return {
    presenters,
    judges: Array.from(judgeMap.values()),
    errors,
  };
}

// =============================================================================
// FIELD MAPPING HELPERS
// =============================================================================

function mapResearchType(input: string): ResearchType | null {
  const normalized = input?.toLowerCase().trim() || '';
  
  if (normalized.includes('foundational')) return 'Foundational Research';
  if (normalized.includes('translational')) return 'Translational Research';
  if (normalized.includes('clinical') || normalized.includes('veterinary')) return 'Veterinary Clinical Research';
  if (normalized.includes('pedagogy') || normalized.includes('social')) return 'Social Sciences/Pedagogy Research';
  
  return null;
}

function mapPresentationType(input: string): PresentationType | null {
  const normalized = input?.toLowerCase().trim() || '';
  
  if (normalized === 'oral') return 'Oral';
  if (normalized === 'undergrad poster') return 'Undergrad Poster';
  if (normalized === 'poster') return 'Poster';
  
  return null;
}

function mapResearchStage(input: string): ResearchStage | null {
  const normalized = input?.toLowerCase().trim() || '';
  
  if (normalized === 'early') return 'Early';
  if (normalized === 'advanced') return 'Advanced';
  
  return null;
}

function mapSessionTime(input: string): SessionTime | null {
  const normalized = input?.trim() || '';
  
  if (normalized.includes('10:15')) return '10:15 - 11:15';
  if (normalized.includes('11:30')) return '11:30 - 1:30';
  if (normalized.includes('1:45')) return '1:45 - 3:45';
  
  return null;
}

function cleanJudgeName(name: string | undefined | null): string | null {
  if (!name || name.trim() === '' || name === 'NaN') {
    return null;
  }
  return name.trim();
}

// =============================================================================
// CSV GENERATION FOR EXPORT
// =============================================================================

/**
 * Generate CSV of final results
 */
export function generateResultsCSV(
  results: {
    presenterId: string;
    presenterName: string;
    category: string;
    finalScore: number | null;
    rank: number | null;
  }[]
): string {
  const headers = ['Presenter ID', 'Presenter Name', 'Category', 'Final Score', 'Rank'];
  const rows = results.map(r => [
    r.presenterId,
    r.presenterName,
    r.category,
    r.finalScore?.toFixed(4) || 'Incomplete',
    r.rank?.toString() || 'N/A',
  ]);
  
  return Papa.unparse([headers, ...rows]);
}

/**
 * Generate CSV of all scores for audit
 */
export function generateAuditCSV(
  data: {
    presenterId: string;
    presenterName: string;
    judgeName: string;
    rawScores: number[];
    weightedTotal: number;
    judgeAverage: number;
    normalizedScore: number;
  }[]
): string {
  const headers = [
    'Presenter ID',
    'Presenter Name', 
    'Judge',
    'Content-Why (×4)',
    'Content-What/How (×5)',
    'Content-NextSteps (×2)',
    'Flow (×3)',
    'Preparedness (×2)',
    'Verbal (×2)',
    'Visual (×2)',
    'Weighted Total',
    'Judge Average',
    'Normalized Score',
  ];
  
  const rows = data.map(d => [
    d.presenterId,
    d.presenterName,
    d.judgeName,
    ...d.rawScores.map(s => s.toString()),
    d.weightedTotal.toFixed(2),
    d.judgeAverage.toFixed(2),
    d.normalizedScore.toFixed(4),
  ]);
  
  return Papa.unparse([headers, ...rows]);
}
