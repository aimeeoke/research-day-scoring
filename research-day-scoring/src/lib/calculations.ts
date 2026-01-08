// Scoring Calculations Engine for Research Day Scoring System

import {
  Score,
  ScoreCriteria,
  NormalizedScore,
  FinalScore,
  Presenter,
  CategoryWinner,
  DepartmentScore,
  CRITERIA_WEIGHTS,
  AWARD_CATEGORIES,
  AwardCategory,
} from './types';

// =============================================================================
// STEP 1: WEIGHTED SCORE CALCULATION
// =============================================================================

/**
 * Calculate weighted total from raw criteria scores
 * Formula: Sum of (each criterion score × its weight)
 * Maximum possible: 100 (if all criteria scored 5)
 */
export function calculateWeightedTotal(criteria: ScoreCriteria): number {
  return (
    criteria.contentWhy * CRITERIA_WEIGHTS.contentWhy +
    criteria.contentWhatHow * CRITERIA_WEIGHTS.contentWhatHow +
    criteria.contentNextSteps * CRITERIA_WEIGHTS.contentNextSteps +
    criteria.presentationFlow * CRITERIA_WEIGHTS.presentationFlow +
    criteria.preparedness * CRITERIA_WEIGHTS.preparedness +
    criteria.verbalComm * CRITERIA_WEIGHTS.verbalComm +
    criteria.visualAids * CRITERIA_WEIGHTS.visualAids
  );
}

/**
 * Get breakdown of weighted score for audit view
 */
export function getWeightedBreakdown(criteria: ScoreCriteria): {
  criterion: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
}[] {
  return [
    {
      criterion: 'Content - WHY (hypothesis/problem)',
      rawScore: criteria.contentWhy,
      weight: CRITERIA_WEIGHTS.contentWhy,
      weightedScore: criteria.contentWhy * CRITERIA_WEIGHTS.contentWhy,
    },
    {
      criterion: 'Content - WHAT/HOW (methods/results)',
      rawScore: criteria.contentWhatHow,
      weight: CRITERIA_WEIGHTS.contentWhatHow,
      weightedScore: criteria.contentWhatHow * CRITERIA_WEIGHTS.contentWhatHow,
    },
    {
      criterion: 'Content - Next Steps',
      rawScore: criteria.contentNextSteps,
      weight: CRITERIA_WEIGHTS.contentNextSteps,
      weightedScore: criteria.contentNextSteps * CRITERIA_WEIGHTS.contentNextSteps,
    },
    {
      criterion: 'Presentation - Logical Flow',
      rawScore: criteria.presentationFlow,
      weight: CRITERIA_WEIGHTS.presentationFlow,
      weightedScore: criteria.presentationFlow * CRITERIA_WEIGHTS.presentationFlow,
    },
    {
      criterion: 'Presentation - Preparedness',
      rawScore: criteria.preparedness,
      weight: CRITERIA_WEIGHTS.preparedness,
      weightedScore: criteria.preparedness * CRITERIA_WEIGHTS.preparedness,
    },
    {
      criterion: 'Presentation - Verbal Communication',
      rawScore: criteria.verbalComm,
      weight: CRITERIA_WEIGHTS.verbalComm,
      weightedScore: criteria.verbalComm * CRITERIA_WEIGHTS.verbalComm,
    },
    {
      criterion: 'Presentation - Visual Aids',
      rawScore: criteria.visualAids,
      weight: CRITERIA_WEIGHTS.visualAids,
      weightedScore: criteria.visualAids * CRITERIA_WEIGHTS.visualAids,
    },
  ];
}

// =============================================================================
// STEP 2: JUDGE NORMALIZATION
// =============================================================================

/**
 * Calculate the average weighted score for a judge across all their scores
 * This is used to normalize for judge leniency/strictness
 */
export function calculateJudgeAverage(scores: Score[], judgeId: string): number {
  const judgeScores = scores.filter(
    s => s.judgeId === judgeId && !s.isNoShow
  );
  
  if (judgeScores.length === 0) {
    return 0;
  }
  
  const sum = judgeScores.reduce((acc, s) => acc + s.weightedTotal, 0);
  return sum / judgeScores.length;
}

/**
 * Calculate normalized score for a single score entry
 * Normalized = weightedTotal / judgeAverage
 * A score of 1.0 means exactly average for that judge
 */
export function normalizeScore(
  score: Score,
  judgeAverage: number
): NormalizedScore {
  const normalizedScore = judgeAverage > 0 
    ? score.weightedTotal / judgeAverage 
    : 0;
  
  return {
    scoreId: score.id,
    presenterId: score.presenterId,
    judgeId: score.judgeId,
    judgeName: score.judgeName,
    weightedTotal: score.weightedTotal,
    judgeAverage: judgeAverage,
    normalizedScore: normalizedScore,
  };
}

/**
 * Generate all normalized scores given all raw scores
 */
export function generateAllNormalizedScores(scores: Score[]): NormalizedScore[] {
  // First, calculate averages for all judges
  const judgeIds = [...new Set(scores.map(s => s.judgeId))];
  const judgeAverages: Record<string, number> = {};
  
  for (const judgeId of judgeIds) {
    judgeAverages[judgeId] = calculateJudgeAverage(scores, judgeId);
  }
  
  // Then normalize each score
  return scores
    .filter(s => !s.isNoShow)
    .map(score => normalizeScore(score, judgeAverages[score.judgeId]));
}

// =============================================================================
// STEP 3: FINAL SCORE CALCULATION
// =============================================================================

/**
 * Calculate final score for a presenter
 * For 2 judges: (Judge1_normalized × 50) + (Judge2_normalized × 50)
 * For 3 judges: (Judge1_normalized × 33.33) + (Judge2_normalized × 33.33) + (Judge3_normalized × 33.33)
 */
export function calculateFinalScore(
  presenter: Presenter,
  normalizedScores: NormalizedScore[]
): FinalScore {
  const presenterScores = normalizedScores.filter(
    ns => ns.presenterId === presenter.id
  );
  
  // Get scores for each assigned judge
  const judge1Score = presenter.judge1 
    ? presenterScores.find(ns => ns.judgeName.toLowerCase() === presenter.judge1?.toLowerCase()) || null
    : null;
    
  const judge2Score = presenter.judge2
    ? presenterScores.find(ns => ns.judgeName.toLowerCase() === presenter.judge2?.toLowerCase()) || null
    : null;
    
  const judge3Score = presenter.judge3
    ? presenterScores.find(ns => ns.judgeName.toLowerCase() === presenter.judge3?.toLowerCase()) || null
    : null;

  // Calculate final score based on number of judges
  let finalScore: number | null = null;
  
  if (presenter.presentationType === 'Undergrad Poster') {
    // 3 judges for undergrad posters
    if (judge1Score && judge2Score && judge3Score) {
      finalScore = (
        judge1Score.normalizedScore * 33.33 +
        judge2Score.normalizedScore * 33.33 +
        judge3Score.normalizedScore * 33.33
      );
    }
  } else {
    // 2 judges for oral and regular posters
    if (judge1Score && judge2Score) {
      finalScore = (
        judge1Score.normalizedScore * 50 +
        judge2Score.normalizedScore * 50
      );
    }
  }
  
  return {
    presenterId: presenter.id,
    presenter,
    judge1Score,
    judge2Score,
    judge3Score,
    finalScore,
  };
}

/**
 * Generate final scores for all presenters
 */
export function generateAllFinalScores(
  presenters: Presenter[],
  scores: Score[]
): FinalScore[] {
  const normalizedScores = generateAllNormalizedScores(scores);
  return presenters.map(p => calculateFinalScore(p, normalizedScores));
}

// =============================================================================
// STEP 4: CATEGORY WINNERS
// =============================================================================

/**
 * Get presenters matching a category
 */
export function getPresentersByCategory(
  presenters: Presenter[],
  category: AwardCategory
): Presenter[] {
  return presenters.filter(p => {
    // Match presentation type
    if (p.presentationType !== category.presentationType) {
      return false;
    }
    
    // Match research type if specified
    if (category.researchType && p.researchType !== category.researchType) {
      return false;
    }
    
    // Match research stage if specified
    if (category.researchStage && p.researchStage !== category.researchStage) {
      return false;
    }
    
    return true;
  });
}

/**
 * Determine winners for a single category
 */
export function getCategoryWinners(
  category: AwardCategory,
  finalScores: FinalScore[]
): CategoryWinner[] {
  // Filter to presenters in this category with complete scores
  const categoryScores = finalScores.filter(fs => {
    if (fs.finalScore === null) return false;
    
    const p = fs.presenter;
    
    // Match presentation type
    if (p.presentationType !== category.presentationType) return false;
    
    // Match research type if specified
    if (category.researchType && p.researchType !== category.researchType) return false;
    
    // Match research stage if specified  
    if (category.researchStage && p.researchStage !== category.researchStage) return false;
    
    return true;
  });
  
  // Sort by final score descending
  categoryScores.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  
  // Return top N winners
  const winners: CategoryWinner[] = [];
  for (let i = 0; i < Math.min(category.places, categoryScores.length); i++) {
    const fs = categoryScores[i];
    if (fs.finalScore !== null) {
      winners.push({
        category: category.name,
        place: (i + 1) as 1 | 2 | 3,
        presenter: fs.presenter,
        finalScore: fs.finalScore,
      });
    }
  }
  
  return winners;
}

/**
 * Determine all category winners
 */
export function getAllCategoryWinners(
  presenters: Presenter[],
  scores: Score[]
): Map<string, CategoryWinner[]> {
  const finalScores = generateAllFinalScores(presenters, scores);
  const winners = new Map<string, CategoryWinner[]>();
  
  for (const category of AWARD_CATEGORIES) {
    winners.set(category.id, getCategoryWinners(category, finalScores));
  }
  
  return winners;
}

// =============================================================================
// STEP 5: GOLDEN PIPETTE (DEPARTMENT AWARD)
// =============================================================================

/**
 * Calculate average score by department
 * Excludes "Other" department
 */
export function calculateDepartmentScores(
  finalScores: FinalScore[]
): DepartmentScore[] {
  const departmentTotals: Record<string, { sum: number; count: number }> = {};
  
  for (const fs of finalScores) {
    if (fs.finalScore === null) continue;
    
    const dept = fs.presenter.department;
    if (dept === 'Other') continue;
    
    if (!departmentTotals[dept]) {
      departmentTotals[dept] = { sum: 0, count: 0 };
    }
    
    departmentTotals[dept].sum += fs.finalScore;
    departmentTotals[dept].count += 1;
  }
  
  return Object.entries(departmentTotals)
    .map(([department, data]) => ({
      department,
      averageScore: data.count > 0 ? data.sum / data.count : 0,
      presenterCount: data.count,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
}

/**
 * Get Golden Pipette winner
 */
export function getGoldenPipetteWinner(
  presenters: Presenter[],
  scores: Score[]
): DepartmentScore | null {
  const finalScores = generateAllFinalScores(presenters, scores);
  const deptScores = calculateDepartmentScores(finalScores);
  
  return deptScores.length > 0 ? deptScores[0] : null;
}

// =============================================================================
// PROGRESS TRACKING
// =============================================================================

/**
 * Check if a category has all required scores
 */
export function isCategoryComplete(
  category: AwardCategory,
  presenters: Presenter[],
  scores: Score[]
): boolean {
  const categoryPresenters = getPresentersByCategory(presenters, category);
  
  for (const presenter of categoryPresenters) {
    const presenterScores = scores.filter(s => s.presenterId === presenter.id);
    const requiredJudges = presenter.presentationType === 'Undergrad Poster' ? 3 : 2;
    
    if (presenterScores.filter(s => !s.isNoShow).length < requiredJudges) {
      return false;
    }
  }
  
  return categoryPresenters.length > 0;
}

/**
 * Get completion percentage for a category
 */
export function getCategoryCompletionPercent(
  category: AwardCategory,
  presenters: Presenter[],
  scores: Score[]
): number {
  const categoryPresenters = getPresentersByCategory(presenters, category);
  if (categoryPresenters.length === 0) return 0;
  
  let totalRequired = 0;
  let totalReceived = 0;
  
  for (const presenter of categoryPresenters) {
    const requiredJudges = presenter.presentationType === 'Undergrad Poster' ? 3 : 2;
    totalRequired += requiredJudges;
    
    const presenterScores = scores.filter(
      s => s.presenterId === presenter.id && !s.isNoShow
    );
    totalReceived += Math.min(presenterScores.length, requiredJudges);
  }
  
  return totalRequired > 0 ? (totalReceived / totalRequired) * 100 : 0;
}

// =============================================================================
// VALIDATION & ANOMALY DETECTION
// =============================================================================

/**
 * Detect potential scoring anomalies for audit review
 */
export function detectAnomalies(scores: Score[]): {
  type: string;
  description: string;
  scoreId: string;
  severity: 'low' | 'medium' | 'high';
}[] {
  const anomalies: {
    type: string;
    description: string;
    scoreId: string;
    severity: 'low' | 'medium' | 'high';
  }[] = [];
  
  for (const score of scores) {
    if (score.isNoShow) continue;
    
    const criteria = score.criteria;
    const allScores = [
      criteria.contentWhy,
      criteria.contentWhatHow,
      criteria.contentNextSteps,
      criteria.presentationFlow,
      criteria.preparedness,
      criteria.verbalComm,
      criteria.visualAids,
    ];
    
    // All 5s - potential rubber stamping
    if (allScores.every(s => s === 5)) {
      anomalies.push({
        type: 'all-fives',
        description: `Judge ${score.judgeName} gave all 5s to presenter ${score.presenterId}`,
        scoreId: score.id,
        severity: 'medium',
      });
    }
    
    // All 1s - potential error or problem
    if (allScores.every(s => s === 1)) {
      anomalies.push({
        type: 'all-ones',
        description: `Judge ${score.judgeName} gave all 1s to presenter ${score.presenterId}`,
        scoreId: score.id,
        severity: 'high',
      });
    }
    
    // Very low variance in scores
    const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / allScores.length;
    if (variance < 0.1 && allScores[0] !== 3) {
      anomalies.push({
        type: 'low-variance',
        description: `Judge ${score.judgeName} gave nearly identical scores across all criteria`,
        scoreId: score.id,
        severity: 'low',
      });
    }
  }
  
  return anomalies;
}
