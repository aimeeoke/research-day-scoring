// Research Day Scoring System - Type Definitions

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export const RESEARCH_TYPES = [
  "Foundational Research",
  "Translational Research", 
  "Veterinary Clinical Research",
  "Social Sciences/Pedagogy Research"
] as const;

export const RESEARCH_STAGES = ["Early", "Advanced"] as const;

export const PRESENTATION_TYPES = ["Oral", "Poster", "Undergrad Poster"] as const;

export const DEPARTMENTS = [
  "Clinical Sciences",
  "Microbiology, Immunology, and Pathology",
  "Environmental & Radiological Health Sciences", 
  "Biomedical Sciences",
  "Other"
] as const;

export const SESSION_TIMES = [
  "10:15 - 11:15",  // Undergrad posters
  "11:30 - 1:30",   // Session 1
  "1:45 - 3:45"     // Session 2
] as const;

// Scoring criteria weights
export const CRITERIA_WEIGHTS = {
  contentWhy: 4,
  contentWhatHow: 5,
  contentNextSteps: 2,
  presentationFlow: 3,
  preparedness: 2,
  verbalComm: 2,
  visualAids: 2
} as const;

export const MAX_WEIGHTED_SCORE = 100; // Sum of all weights × 5

// =============================================================================
// TYPES
// =============================================================================

export type ResearchType = typeof RESEARCH_TYPES[number];
export type ResearchStage = typeof RESEARCH_STAGES[number];
export type PresentationType = typeof PRESENTATION_TYPES[number];
export type Department = typeof DEPARTMENTS[number];
export type SessionTime = typeof SESSION_TIMES[number];

// =============================================================================
// INTERFACES
// =============================================================================

export interface Presenter {
  id: string;                      // presentationID (e.g., "1B-3")
  firstName: string;
  lastName: string;
  email: string;
  classification: string;          // "PhD Student", "Undergrad", etc.
  researchStage: ResearchStage;
  researchType: ResearchType;
  department: string;
  presentationType: PresentationType;
  presentationTime: SessionTime;
  title: string;
  judge1: string | null;
  judge2: string | null;
  judge3: string | null;           // Only for Undergrad Posters
}

export interface Judge {
  id: string;                      // Generated from name normalization
  name: string;                    // Full name as entered
  assignedPresenters: string[];    // Array of presenter IDs
}

export interface ScoreCriteria {
  contentWhy: number;              // 1-5, Weight: 4
  contentWhatHow: number;          // 1-5, Weight: 5
  contentNextSteps: number;        // 1-5, Weight: 2
  presentationFlow: number;        // 1-5, Weight: 3
  preparedness: number;            // 1-5, Weight: 2
  verbalComm: number;              // 1-5, Weight: 2
  visualAids: number;              // 1-5, Weight: 2
}

export interface Score {
  id: string;                      // `${presenterId}-${judgeId}`
  presenterId: string;
  judgeName: string;
  judgeId: string;
  timestamp: string;               // ISO date string
  criteria: ScoreCriteria;
  weightedTotal: number;           // Calculated: sum of (score × weight)
  isNoShow: boolean;               // Track if presenter was a no-show
}

export interface NormalizedScore {
  scoreId: string;
  presenterId: string;
  judgeId: string;
  judgeName: string;
  weightedTotal: number;
  judgeAverage: number;            // Average of all scores by this judge
  normalizedScore: number;         // weightedTotal / judgeAverage
}

export interface FinalScore {
  presenterId: string;
  presenter: Presenter;
  judge1Score: NormalizedScore | null;
  judge2Score: NormalizedScore | null;
  judge3Score: NormalizedScore | null;  // Only for undergrad posters
  finalScore: number | null;       // Weighted average of normalized scores
  rank?: number;                   // Within category
}

export interface CategoryWinner {
  category: string;                // e.g., "Foundational Research, Early Stage, Oral"
  place: 1 | 2 | 3;
  presenter: Presenter;
  finalScore: number;
}

export interface DepartmentScore {
  department: string;
  averageScore: number;
  presenterCount: number;
}

export interface Feedback {
  id: string;
  presenterId: string;
  presenterName: string;           // For display
  submitterType: "judge" | "attendee";
  submitterName: string;
  strengths: string;
  areasForImprovement: string;
  timestamp: string;               // ISO date string
}

// =============================================================================
// APPLICATION STATE
// =============================================================================

export interface ScoringState {
  presenters: Presenter[];
  judges: Judge[];
  scores: Score[];
  feedback: Feedback[];
  dataLoaded: boolean;
  lastUpdated: string | null;
}

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

export interface AwardCategory {
  id: string;
  name: string;
  researchType: ResearchType | null;
  researchStage: ResearchStage | null;
  presentationType: PresentationType;
  places: number;                  // Number of places awarded (1st, 2nd, 3rd)
}

export const AWARD_CATEGORIES: AwardCategory[] = [
  // Oral Presentations
  { id: "oral-found-adv", name: "Foundational Research, Advanced Stage, Oral", researchType: "Foundational Research", researchStage: "Advanced", presentationType: "Oral", places: 3 },
  { id: "oral-found-early", name: "Foundational Research, Early Stage, Oral", researchType: "Foundational Research", researchStage: "Early", presentationType: "Oral", places: 3 },
  { id: "oral-trans-adv", name: "Translational Research, Advanced Stage, Oral", researchType: "Translational Research", researchStage: "Advanced", presentationType: "Oral", places: 3 },
  { id: "oral-trans-early", name: "Translational Research, Early Stage, Oral", researchType: "Translational Research", researchStage: "Early", presentationType: "Oral", places: 3 },
  { id: "oral-clin-adv", name: "Veterinary Clinical Research, Advanced Stage, Oral", researchType: "Veterinary Clinical Research", researchStage: "Advanced", presentationType: "Oral", places: 3 },
  { id: "oral-clin-early", name: "Veterinary Clinical Research, Early Stage, Oral", researchType: "Veterinary Clinical Research", researchStage: "Early", presentationType: "Oral", places: 3 },

  // Poster Presentations
  { id: "poster-found-adv", name: "Foundational Research, Advanced Stage, Poster", researchType: "Foundational Research", researchStage: "Advanced", presentationType: "Poster", places: 3 },
  { id: "poster-found-early", name: "Foundational Research, Early Stage, Poster", researchType: "Foundational Research", researchStage: "Early", presentationType: "Poster", places: 3 },
  { id: "poster-trans-adv", name: "Translational Research, Advanced Stage, Poster", researchType: "Translational Research", researchStage: "Advanced", presentationType: "Poster", places: 3 },
  { id: "poster-trans-early", name: "Translational Research, Early Stage, Poster", researchType: "Translational Research", researchStage: "Early", presentationType: "Poster", places: 3 },
  { id: "poster-clin-adv", name: "Veterinary Clinical Research, Advanced Stage, Poster", researchType: "Veterinary Clinical Research", researchStage: "Advanced", presentationType: "Poster", places: 3 },
  { id: "poster-clin-early", name: "Veterinary Clinical Research, Early Stage, Poster", researchType: "Veterinary Clinical Research", researchStage: "Early", presentationType: "Poster", places: 3 },
  { id: "poster-ped", name: "Pedagogy Research, Poster", researchType: "Social Sciences/Pedagogy Research", researchStage: null, presentationType: "Poster", places: 3 },

  // Undergraduate Posters (by research category)
  { id: "undergrad-found", name: "Foundational Research, Undergrad Poster", researchType: "Foundational Research", researchStage: null, presentationType: "Undergrad Poster", places: 3 },
  { id: "undergrad-trans", name: "Translational Research, Undergrad Poster", researchType: "Translational Research", researchStage: null, presentationType: "Undergrad Poster", places: 3 },
  { id: "undergrad-clin", name: "Veterinary Clinical Research, Undergrad Poster", researchType: "Veterinary Clinical Research", researchStage: null, presentationType: "Undergrad Poster", places: 3 },
  { id: "undergrad-ped", name: "Pedagogy Research, Undergrad Poster", researchType: "Social Sciences/Pedagogy Research", researchStage: null, presentationType: "Undergrad Poster", places: 3 },
];

// =============================================================================
// CSV IMPORT TYPES
// =============================================================================

export interface CSVPresenterRow {
  first: string;
  last: string;
  email: string;
  classification: string;
  researchStage: string;
  researchType: string;
  department: string;
  presentationType: string;
  presentationID: string;
  presentationTime: string;
  presentationTitle: string;
  judge1: string;
  judge2: string;
  judge3: string;
}

// =============================================================================
// UI HELPER TYPES
// =============================================================================

export interface SessionProgress {
  sessionTime: SessionTime;
  totalPresenters: number;
  scoresReceived: number;
  percentComplete: number;
  isComplete: boolean;
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  totalPresenters: number;
  presentersScored: number;
  percentComplete: number;
  isComplete: boolean;
  winners: CategoryWinner[];
}

export type ScoreStatus = "pending" | "partial" | "complete" | "no-show";

export interface PresenterScoreStatus {
  presenterId: string;
  status: ScoreStatus;
  judgesScored: string[];
  judgesMissing: string[];
}
