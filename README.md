# PrepWizard — Production Competitive Engineering Exam Platform

> **"Practice exactly like the real exam, analyze every mistake, and continuously improve."**

PrepWizard is a full-stack, production-grade CBT examination simulation and real-time question firing application engineered specifically for competitive engineering exams in India:
1. **GATE Computer Science & Engineering (GATE CS)**
2. **RRB JE Electrical (CBT-2)**
3. **SSC JE Electrical (Paper 1 & 2)**
4. **RRB ALP Electrical (Trade Test Part B)**

---

## Core Innovations & Architecture

```
Frontend (React + Vite + Tailwind + KaTeX)
   ↓  [Authoritative REST & Offline Queue Sync]
API Gateway (Express + TypeScript + JWT Auth)
   ↓
┌────────────────────────────────────────────────────────┐
│  Engines & Services                                    │
│  ├── QuestionFiringEngine (Per-Q Countdown & Pacing)   │
│  ├── ExamEngine (CBT Rules, Sections, Dynamic Patterns)│
│  ├── ScoringEngine (MCQ, MSQ, NAT, Negative Markings)  │
│  ├── WeaknessEngine (Speed-Accuracy 4-Quadrant Matrix) │
│  ├── SpacedRepetitionEngine (SuperMemo SM-2 Interval)  │
│  └── AIService (Explainer, Doubt Solver, Study Planner)│
└────────────────────────────────────────────────────────┘
   ↓
Prisma ORM (SQLite / PostgreSQL)
```

### 1. Real-Time Question Firing Engine
- Per-question live countdown timer with color transitions (Indigo -> Amber -> Pulsing Red).
- Instant automatic next question firing when time expires (`TIME UP! Moving to next question...`).
- Millisecond-precision response time tracking.
- Keyboard shortcuts:
  - `1` / `A` → Option A
  - `2` / `B` → Option B
  - `3` / `C` → Option C
  - `4` / `D` → Option D
  - `Enter` → Save & Next
  - `N` → Next Question
  - `P` → Previous Question
  - `R` → Mark for Review & Next
  - `S` → Skip
  - `C` → Clear Response
- Strict anti-cheat: Zero answers or solutions exposed to the client before submission.

### 2. Dedicated CBT Exam Simulation (TCS iON Pattern)
- Official exam duration and question distribution.
- Section switching & Question Paper overview modal.
- 5-color official CBT Question Palette:
  - ⬜ Not Visited
  - 🟧 Not Answered
  - 🟩 Answered
  - 🟪 Marked for Review
  - 🟪🟢 Answered & Marked for Review (Evaluated)
- Offline & Network Failure Recovery: Session progress & timer state are saved locally; queued answers automatically reconcile when online.

### 3. Practice Modes
- **Real Exam Mode**: Full official pattern simulation.
- **Rapid Fire Mode**: 20–30 seconds per question auto-firing.
- **Topic Practice**: Filter by subject (e.g. Electrical Machines, Operating Systems) and topic.
- **Weak Area Mode**: Algorithmic question generation from topics where accuracy < 60%.
- **PYQ Marathon**: Continuous verified previous-year question sets.
- **Mistake Practice**: Targeted re-attempt of questions previously answered incorrectly.
- **Speed Practice**: Prioritizes rapid formula recall and shortcut application.
- **Custom Test**: User-configured question count, difficulty, and timing.

### 4. Post-Exam Intelligence & Deep Analytics
- Official Scorecard with accuracy %, time efficiency %, and percentile estimation.
- **Speed vs Accuracy 4-Quadrant Matrix**:
  - Quadrant 1: Fast & Accurate (Elite / Exam-Ready)
  - Quadrant 2: Slow & Accurate (Thorough but Time-Vulnerable)
  - Quadrant 3: Fast & Inaccurate (Impulsive / Prone to Traps)
  - Quadrant 4: Slow & Inaccurate (Needs Conceptual & Speed Foundation)
- Question-level review with step-by-step KaTeX solutions, governing formulas, shortcuts, and common mistakes.
- Automated Digital Mistake Book and SuperMemo SM-2 Spaced Repetition cards (1, 3, 7, 14, 30 days).

---

## Quick Start & Local Running

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```
Backend API will start on: `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web interface will be available at: `http://localhost:5173`

---

## Demo Credentials

| Role | Email | Password | Access / Functionality |
|---|---|---|---|
| **Candidate** | *(Your registered email)* | *(Your password)* | Personal CBT practice, speed vs accuracy analysis, SM-2 revisions, mistake book |
| **System Admin** | `admin@prepwizard.com` | `PrepWizard@2026` | Full Question Bank CRUD, Bulk CSV Import, Pattern editor |

---

## Running Unit Tests

```bash
cd backend
npm test
```
Validates official exam scoring rules, negative marking calculations, NAT numerical tolerances, MSQ evaluation, SM-2 progression, and speed-accuracy quadrant classification.
