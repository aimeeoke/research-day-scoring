# Research Day Scoring System - Project Plan

## Overview

A modern web application to replace the spreadsheet-based scoring system for CVMBS Research Day. The system provides real-time score entry, automatic calculations, transparent audit views, and integrated feedback collection.

**Goals:**
- Eliminate manual data entry errors and frantic last-minute calculations
- Provide real-time winner determination as sessions complete
- Give committee members full transparency into scoring calculations
- Streamline presenter feedback collection and distribution

---

## Data Model

### Presenters (from CSV upload)
```typescript
interface Presenter {
  id: string;                    // presentationID (e.g., "1B-3")
  firstName: string;
  lastName: string;
  email: string;
  classification: string;        // "PhD Student", "Undergrad", etc.
  researchStage: "Early" | "Advanced";
  researchType: "Foundational Research" | "Translational Research" | 
                "Veterinary Clinical Research" | "Social Sciences/Pedagogy Research";
  department: string;
  presentationType: "Oral" | "Poster" | "Undergrad Poster";
  presentationTime: string;      // "10:15 - 11:15", "11:30 - 1:30", "1:45 - 3:45"
  title: string;
  judge1?: string;
  judge2?: string;
  judge3?: string;               // Only for Undergrad Posters
}
```

### Judges
```typescript
interface Judge {
  id: string;                    // Generated unique ID
  name: string;                  // Full name as entered
  assignedPresenters: string[];  // Array of presenter IDs
  session?: string;              // For oral presentations
}
```

### Scores
```typescript
interface Score {
  id: string;
  presenterId: string;
  judgeName: string;
  timestamp: Date;
  
  // Raw scores (1-5 scale)
  criteria: {
    contentWhy: number;          // Weight: 4
    contentWhatHow: number;      // Weight: 5
    contentNextSteps: number;    // Weight: 2
    presentationFlow: number;    // Weight: 3
    preparedness: number;        // Weight: 2
    verbalComm: number;          // Weight: 2
    visualAids: number;          // Weight: 2
  };
  
  // Calculated fields
  weightedTotal: number;         // Sum of (score * weight)
  normalizedScore?: number;      // After all judge's scores are in
}
```

### Feedback
```typescript
interface Feedback {
  id: string;
  presenterId: string;
  submitterType: "judge" | "attendee";
  submitterName?: string;
  strengths: string;
  areasForImprovement: string;
  timestamp: Date;
}
```

---

## Scoring Calculation Logic

### Step 1: Weighted Score
Each judge's raw scores are weighted:
```
Weighted Total = (contentWhy × 4) + (contentWhatHow × 5) + (contentNextSteps × 2) 
               + (presentationFlow × 3) + (preparedness × 2) + (verbalComm × 2) 
               + (visualAids × 2)

Maximum possible: (5×4) + (5×5) + (5×2) + (5×3) + (5×2) + (5×2) + (5×2) = 100
```

### Step 2: Judge Normalization
To account for judge leniency/strictness:
```
Judge's Average = AVG(all weighted totals for this judge)
Normalized Score = Weighted Total / Judge's Average
```
A normalized score of 1.0 means exactly average for that judge. >1.0 means above average.

### Step 3: Final Score
For 2-judge presentations (Oral, Regular Poster):
```
Final Score = (Judge1_Normalized × 50) + (Judge2_Normalized × 50)
```

For 3-judge presentations (Undergrad Poster):
```
Final Score = (Judge1_Normalized × 33.33) + (Judge2_Normalized × 33.33) + (Judge3_Normalized × 33.33)
```

### Step 4: Category Winners
Rankings are determined within each category:
- Research Type (Foundational, Translational, Clinical, Pedagogy)
- Research Stage (Early, Advanced)
- Presentation Type (Oral, Poster, Undergrad Poster)

### Step 5: Golden Pipette
```
Department Average = AVG(all final scores for presenters in department)
Winner = Department with highest average
```
Departments: Clinical Sciences, MIP, ERHS, BMS (exclude "Other")

---

## Award Categories (from your specifications)

### Oral Presentations (1st & 2nd place each)
- Foundational Research, Advanced Stage
- Foundational Research, Early Stage
- Translational Research, Advanced Stage
- Translational Research, Early Stage
- Clinical Research, Advanced Stage
- Clinical Research, Early Stage

### Poster Presentations (1st & 2nd place each)
- Foundational Research, Advanced Stage
- Foundational Research, Early Stage
- Translational Research, Advanced Stage
- Translational Research, Early Stage
- Clinical Research, Advanced Stage
- Clinical Research, Early Stage
- Pedagogy Research (no stage distinction)

### Undergraduate Posters
- 1st, 2nd, and 3rd place overall (no category breakdown)

### Golden Pipette Award
- Department with highest average final score

---

## Application Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** React + Tailwind CSS + shadcn/ui
- **State Management:** React Context + localStorage (no backend database)
- **Data Persistence:** Browser localStorage + JSON export/import
- **Deployment:** Vercel

### Why No Backend Database?
- Single-day event with one score master
- Data can be exported as JSON backup
- Simpler deployment and no server costs
- localStorage provides persistence during the event
- JSON export allows committee to verify data

---

## Access Control System

The application uses a simple code-based access control system suitable for a single-day event.

### Access Levels

| Role | Can Access | Protected By |
|------|-----------|--------------|
| **Public** | `/feedback` only | Nothing - open to all |
| **Judges** | `/judge` + `/feedback` | Event code: `CVMBS2026` |
| **Committee** | Everything | PIN: `2026` |

### How It Works

1. **No backend authentication** - Codes are verified client-side and access is stored in localStorage
2. **Codes persist** - Once entered, users don't need to re-enter until they clear browser data
3. **Role-based navigation** - Menu items appear/hide based on access level

### Changing Codes

Edit `src/lib/auth.ts` before the event:

```typescript
export const ACCESS_CODES = {
  judge: 'CVMBS2026',    // Share at judge orientation
  admin: '2026',          // Committee only
} as const;
```

### Key Security Notes

- This is "security through obscurity" - appropriate for low-stakes event management
- Admin PIN protects winner visibility until announcement
- Judge code prevents accidental public access to scoring
- No sensitive PII is exposed; presenter info is already public at the event

---

## Application Pages

### 1. `/` - Home/Dashboard (Admin View)
- Upload presenter CSV
- View scoring progress by session
- Real-time winner boards by category
- Quick links to all other pages
- Export all data as JSON

### 2. `/judge` - Judge Score Entry Portal
- Mobile-optimized interface
- Requires judge event code to access
- Judge selects their name from dropdown
- **KEY FEATURE**: Shows ONLY their assigned presenters (prevents scoring wrong person!)
- Large presenter ID badges make identification easy
- Score entry form with all 7 criteria (5-point scale buttons)
- "No-show" toggle for absent presenters
- Progress bar shows how many they've completed
- Auto-advances to next unscored presenter after submission
- Can update previously submitted scores

### 3. `/monitor` - Pending Score Tracker ⭐ NEW
- Real-time view of all pending judge/presenter combinations
- Auto-refreshes every 10 seconds (configurable)
- Filter by session time
- Groups pending scores by judge name
- Shows completion percentage with visual progress
- Entries disappear as scores are submitted
- Perfect for keeping on a second screen during the event
- Helps identify judges who are falling behind

### 4. `/audit` - Transparency/Audit View
- Full breakdown of all calculations
- Filter by presenter, judge, or category
- Shows: raw scores → weighted → normalized → final
- Highlights any anomalies (missing scores, outliers)
- Committee can verify any calculation

### 5. `/winners` - Live Winner Board
- Auto-updates as scores come in
- Organized by category
- Shows "Pending" until all scores for category are complete
- Printable format for MC
- Golden Pipette standings

### 6. `/feedback` - Feedback Collection
- Public form for judges and attendees
- Select presenter from list
- Text fields for strengths and areas for improvement
- Anonymous option for attendees

### 7. `/feedback/export` - Feedback Export
- View all feedback grouped by presenter
- Generate draft emails for each presenter
- Bulk download as Word docs or text files

---

## Development Phases

### Phase 1: Foundation (Start Here)
1. Project setup (Next.js, Tailwind, shadcn/ui)
2. Data models and types
3. CSV import functionality
4. localStorage persistence layer
5. Basic presenter list view

### Phase 2: Judge Portal
1. Judge selection interface
2. Score entry form
3. Form validation
4. Score submission and storage
5. Progress tracking

### Phase 3: Calculations Engine
1. Weighted score calculation
2. Judge normalization
3. Final score computation
4. Category ranking logic
5. Golden Pipette calculation

### Phase 4: Admin Dashboard
1. Session progress overview
2. Real-time score monitoring
3. Winner determination display
4. Data export functionality

### Phase 5: Audit View
1. Detailed calculation breakdown
2. Filter and search capabilities
3. Anomaly detection
4. Print-friendly format

### Phase 6: Feedback System
1. Feedback entry form
2. Feedback storage
3. Export and email generation
4. Mail merge preparation

### Phase 7: Polish & Deploy
1. Mobile responsiveness
2. Error handling
3. Loading states
4. Vercel deployment
5. Documentation

---

## File Structure

```
research-day-scoring/
├── docs/
│   └── PROJECT_PLAN.md
├── public/
│   └── (static assets)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard (Admin)
│   │   ├── judge/
│   │   │   └── page.tsx          # Judge entry portal
│   │   ├── monitor/
│   │   │   └── page.tsx          # Pending score tracker (Admin)
│   │   ├── audit/
│   │   │   └── page.tsx          # Transparency view (Admin)
│   │   ├── winners/
│   │   │   └── page.tsx          # Live winner board (Admin)
│   │   └── feedback/
│   │       ├── page.tsx          # Feedback entry (Public)
│   │       └── export/
│   │           └── page.tsx      # Feedback export (Admin)
│   ├── components/
│   │   ├── auth-gate.tsx         # Access control wrappers
│   │   ├── navigation.tsx        # Role-based nav menu
│   │   ├── csv-upload.tsx
│   │   ├── score-form.tsx
│   │   ├── presenter-card.tsx
│   │   ├── category-winners.tsx
│   │   ├── audit-table.tsx
│   │   └── feedback-form.tsx
│   ├── lib/
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── storage.ts            # localStorage helpers
│   │   ├── calculations.ts       # Scoring logic
│   │   ├── csv-parser.ts         # CSV import
│   │   ├── auth.ts               # Access control
│   │   └── utils.ts              # Utility functions
│   └── context/
│       └── scoring-context.tsx   # Global state
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Key Features for Committee Transparency

1. **Calculation Audit Trail**
   - Every calculation step visible
   - Click any final score to see full breakdown
   - Compare raw vs normalized to spot judge bias

2. **Real-time Status Dashboard**
   - Green/yellow/red indicators for each session
   - "X of Y scores received" for each category
   - Timestamp of last score entry

3. **Data Validation**
   - Flag missing scores
   - Highlight scores outside normal range (1s or 5s on everything)
   - Show when normalization can't be calculated (judge has only one score)

4. **Export Options**
   - Full JSON backup at any time
   - CSV export of final results
   - Printable winner sheets
   - Audit log of all entries

---

## Session Timeline Support

Based on your schedule:
- **10:15 - 11:15**: Undergrad Poster Session (46 presenters, 3 judges each)
- **11:30 - 1:30**: First session (89 presenters - mix of oral and poster)
- **1:45 - 3:45**: Second session (87 presenters - mix of oral and poster)

The system will:
- Show session-specific progress
- Enable "lock" on sessions when complete
- Calculate and display winners as soon as a category is complete

---

## Next Steps

Ready to begin? The recommended order:

1. **Initialize Next.js project** with TypeScript and Tailwind
2. **Set up shadcn/ui** components
3. **Create type definitions** from this plan
4. **Build CSV import** functionality
5. **Create localStorage persistence** layer

Then we can iterate through each feature with Claude Code!
