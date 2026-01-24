// localStorage + Cloud persistence layer for Research Day Scoring System

import { ScoringState, Presenter, Judge, Score, Feedback } from './types';
import { PRESENTERS, JUDGES } from './data';

const STORAGE_KEY = 'research-day-scoring-2026';

// =============================================================================
// CLOUD API FUNCTIONS (Supabase)
// =============================================================================

// Save score to cloud database
export async function saveScoreToCloud(score: Score): Promise<boolean> {
  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Cloud save error:', error);
      return false;
    }

    console.log('Score saved to cloud successfully');
    return true;
  } catch (error) {
    console.error('Failed to save score to cloud:', error);
    return false;
  }
}

// Load all scores from cloud database
export async function loadScoresFromCloud(): Promise<Score[]> {
  try {
    const response = await fetch('/api/scores');

    if (!response.ok) {
      console.error('Cloud load error:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.scores || [];
  } catch (error) {
    console.error('Failed to load scores from cloud:', error);
    return [];
  }
}

// Load state with scores from cloud (for admin pages)
export async function loadStateFromCloud(): Promise<ScoringState> {
  const cloudScores = await loadScoresFromCloud();

  return {
    ...defaultState,
    scores: cloudScores,
    feedback: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Save feedback to cloud database
export async function saveFeedbackToCloud(feedback: Feedback): Promise<boolean> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Cloud feedback save error:', error);
      return false;
    }

    console.log('Feedback saved to cloud successfully');
    return true;
  } catch (error) {
    console.error('Failed to save feedback to cloud:', error);
    return false;
  }
}

// Load all feedback from cloud database
export async function loadFeedbackFromCloud(): Promise<Feedback[]> {
  try {
    const response = await fetch('/api/feedback');

    if (!response.ok) {
      console.error('Cloud feedback load error:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.feedback || [];
  } catch (error) {
    console.error('Failed to load feedback from cloud:', error);
    return [];
  }
}

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
    // Always use static presenter data from data.ts as single source of truth
    // Only scores and feedback are preserved from localStorage
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

export function updatePresenter(updatedPresenter: Presenter): void {
  const state = loadState();
  const index = state.presenters.findIndex(p => p.id === updatedPresenter.id);
  if (index >= 0) {
    state.presenters[index] = updatedPresenter;
    saveState(state);
  }
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

  // Save to localStorage (for immediate UI feedback)
  saveState(state);

  // Also save to cloud database (fire and forget - don't block UI)
  saveScoreToCloud(score).then(success => {
    if (!success) {
      console.warn('Score saved locally but cloud sync failed. Will retry on next action.');
    }
  });
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

  // Also save to cloud database (fire and forget - don't block UI)
  saveFeedbackToCloud(feedback).then(success => {
    if (!success) {
      console.warn('Feedback saved locally but cloud sync failed.');
    }
  });
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
