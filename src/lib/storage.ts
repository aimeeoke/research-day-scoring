// localStorage persistence layer for Research Day Scoring System

import { ScoringState, Presenter, Judge, Score, Feedback } from './types';
import { PRESENTERS, JUDGES } from './data';

const STORAGE_KEY = 'research-day-scoring-2026';

// =============================================================================
// DEFAULT STATE (pre-populated from static data file)
// =============================================================================

const defaultState: ScoringState = {
  presenters: PRESENTERS,
  judges: JUDGES,
  scores: [],
  feedback: [],
  dataLoaded: true,
  lastUpdated: null,
};

// =============================================================================
// CORE STORAGE FUNCTIONS
// =============================================================================

export function loadState(): ScoringState {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }
    const parsed = JSON.parse(stored) as Partial<ScoringState>;
    // Always use static presenter/judge data, but preserve scores and feedback from localStorage
    return {
      ...defaultState,
      scores: parsed.scores || [],
      feedback: parsed.feedback || [],
      lastUpdated: parsed.lastUpdated || null,
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return defaultState;
  }
}

export function saveState(state: ScoringState): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const toSave: ScoringState = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function clearScores(): void {
  const state = loadState();
  state.scores = [];
  state.feedback = [];
  saveState(state);
}

// =============================================================================
// PRESENTER FUNCTIONS
// =============================================================================

export function savePresenters(presenters: Presenter[]): void {
  const state = loadState();
  state.presenters = presenters;
  state.dataLoaded = true;
  saveState(state);
}

export function getPresenters(): Presenter[] {
  return loadState().presenters;
}

export function getPresenterById(id: string): Presenter | undefined {
  return loadState().presenters.find(p => p.id === id);
}

// =============================================================================
// JUDGE FUNCTIONS
// =============================================================================

export function saveJudges(judges: Judge[]): void {
  const state = loadState();
  state.judges = judges;
  saveState(state);
}

export function getJudges(): Judge[] {
  return loadState().judges;
}

export function getJudgeByName(name: string): Judge | undefined {
  const normalizedName = name.toLowerCase().trim();
  return loadState().judges.find(
    j => j.name.toLowerCase().trim() === normalizedName
  );
}

// =============================================================================
// SCORE FUNCTIONS
// =============================================================================

export function saveScore(score: Score): void {
  const state = loadState();
  // Replace existing score if same presenter-judge combo exists
  const existingIndex = state.scores.findIndex(
    s => s.presenterId === score.presenterId && s.judgeId === score.judgeId
  );
  
  if (existingIndex >= 0) {
    state.scores[existingIndex] = score;
  } else {
    state.scores.push(score);
  }
  
  saveState(state);
}

export function getScores(): Score[] {
  return loadState().scores;
}

export function getScoresForPresenter(presenterId: string): Score[] {
  return loadState().scores.filter(s => s.presenterId === presenterId);
}

export function getScoresByJudge(judgeId: string): Score[] {
  return loadState().scores.filter(s => s.judgeId === judgeId);
}

export function deleteScore(scoreId: string): void {
  const state = loadState();
  state.scores = state.scores.filter(s => s.id !== scoreId);
  saveState(state);
}

// =============================================================================
// FEEDBACK FUNCTIONS
// =============================================================================

export function saveFeedback(feedback: Feedback): void {
  const state = loadState();
  state.feedback.push(feedback);
  saveState(state);
}

export function getFeedback(): Feedback[] {
  return loadState().feedback;
}

export function getFeedbackForPresenter(presenterId: string): Feedback[] {
  return loadState().feedback.filter(f => f.presenterId === presenterId);
}

export function deleteFeedback(feedbackId: string): void {
  const state = loadState();
  state.feedback = state.feedback.filter(f => f.id !== feedbackId);
  saveState(state);
}

// =============================================================================
// EXPORT / IMPORT FUNCTIONS
// =============================================================================

export function exportToJSON(): string {
  const state = loadState();
  return JSON.stringify(state, null, 2);
}

export function importFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as ScoringState;
    // Validate structure
    if (!parsed.presenters || !Array.isArray(parsed.presenters)) {
      throw new Error('Invalid data structure: missing presenters array');
    }
    saveState(parsed);
    return true;
  } catch (error) {
    console.error('Error importing JSON:', error);
    return false;
  }
}

export function downloadBackup(): void {
  const data = exportToJSON();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-day-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function normalizeJudgeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}
