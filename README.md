# Research Day Scoring System

A real-time scoring application for CVMBS Research Day 2026, replacing the traditional spreadsheet-based workflow.

## Features

- **Real-time scoring**: Judges enter scores on mobile devices, calculations happen instantly
- **Automatic winner determination**: Winners are calculated as soon as all scores for a category are complete
- **Transparent audit view**: Committee members can see every calculation step
- **Multiple judge support**: Handles 2 judges (oral/poster) or 3 judges (undergrad poster)
- **Score normalization**: Adjusts for judge leniency/strictness
- **Golden Pipette calculation**: Department rankings by average score
- **Feedback collection**: Integrated system for presenter feedback

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data**: Browser localStorage (no backend required)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/research-day-scoring.git

# Navigate to project directory
cd research-day-scoring

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### 1. Upload Presenter Data

Upload a CSV file with the following columns:
- `first`, `last`, `email` - Presenter information
- `classification` - PhD Student, Undergrad, etc.
- `researchStage` - Early or Advanced
- `researchType` - Foundational, Translational, Clinical, or Pedagogy
- `department` - Department name
- `presentationType` - Oral, Poster, or Undergrad Poster
- `presentationID` - Unique ID (e.g., "1B-3")
- `presentationTime` - Session time
- `presentationTitle` - Title of presentation
- `judge1`, `judge2`, `judge3` - Assigned judges

### 2. Judge Score Entry

Judges navigate to `/judge`, select their name, and enter scores for assigned presenters.

### 3. Monitor Progress

The dashboard shows real-time progress by session and category.

### 4. View Winners

Once a category is complete, winners are automatically displayed on the Winners page.

### 5. Export Results

Download complete results as JSON backup or CSV for records.

## Scoring Logic

### Criteria & Weights

| Criterion | Weight |
|-----------|--------|
| Content - WHY (hypothesis/problem) | 4 |
| Content - WHAT/HOW (methods/results) | 5 |
| Content - Next Steps | 2 |
| Presentation - Logical Flow | 3 |
| Presentation - Preparedness | 2 |
| Presentation - Verbal Communication | 2 |
| Presentation - Visual Aids | 2 |

### Calculation Steps

1. **Weighted Total**: Sum of (criterion score × weight)
2. **Judge Normalization**: Weighted Total ÷ Judge's Average
3. **Final Score**: Average of normalized scores × 100

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Dashboard
│   ├── judge/             # Judge entry portal
│   ├── audit/             # Transparency view
│   ├── winners/           # Live winners
│   └── feedback/          # Feedback system
├── components/            # React components
├── lib/                   # Core logic
│   ├── types.ts          # TypeScript definitions
│   ├── storage.ts        # localStorage layer
│   ├── calculations.ts   # Scoring engine
│   ├── csv-parser.ts     # CSV import/export
│   └── utils.ts          # Utilities
└── context/              # React Context
```

## Development Workflow

This project is designed for incremental development with Claude Code:

1. Each page/feature can be developed independently
2. Core logic is in `/lib` and tested separately
3. Components are modular and reusable

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

### Other Platforms

Build the project and deploy the `.next` folder to any Node.js hosting platform.

## License

Private - Colorado State University CVMBS
