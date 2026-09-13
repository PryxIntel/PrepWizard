export type ExamCode = 'GATE_CS' | 'RRB_JE_EE' | 'SSC_JE_EE' | 'RRB_ALP_EE';

export interface User {
  id: string;
  email: string;
  name: string;
  targetExam: string;
  targetScore: number;
  dailyStudyGoalMinutes: number;
  role: 'USER' | 'ADMIN';
  streakCount: number;
  lastActiveDate?: string;
}

export interface ExamPattern {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  negativeMarking: number;
  sections: { name: string; questions: number; marks?: number }[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  topics: { id: string; name: string }[];
}

export interface PYQYearStat {
  year: number;
  questionCount: number;
}

export interface PYQInfo {
  totalCount: number;
  minYear: number | null;
  maxYear: number | null;
  yearRange: string;
  years: PYQYearStat[];
}

export interface Exam {
  id: string;
  code: ExamCode;
  name: string;
  category: string;
  description: string;
  patterns: ExamPattern[];
  subjects: Subject[];
  totalQuestionsAvailable: number;
  pyqInfo?: PYQInfo;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface SafeQuestion {
  id: string;
  examId: string;
  subjectName: string;
  topicName: string;
  year: number;
  shift: string | null;
  questionType: 'MCQ' | 'MSQ' | 'NAT' | 'ASSERTION_REASON';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  options: QuestionOption[];
  marks: number;
  negativeMarks: number;
  avgExpectedSeconds: number;
  isPYQ: boolean;
  isAIGenerated: boolean;
  sourceRef: string | null;
}

export type QuestionStatus =
  | 'NOT_VISITED'
  | 'NOT_ANSWERED'
  | 'ANSWERED'
  | 'MARKED_FOR_REVIEW'
  | 'ANSWERED_AND_MARKED';

export interface PaletteItem {
  sequenceOrder: number;
  questionId: string;
  sectionName: string;
  status: QuestionStatus;
  isAnswered: boolean;
  timeTakenSeconds: number;
  candidateAnswer: any;
}

export interface ActiveSessionData {
  session: {
    id: string;
    exam: { id: string; code: string; name: string };
    mode: string;
    title: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    totalDurationSeconds: number;
    timeRemainingSeconds: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    config: {
      perQuestionTime?: number;
      autoAdvanceOnTimeUp?: boolean;
      negativeMarking?: number;
    };
  };
  palette: PaletteItem[];
  questions: {
    sequenceOrder: number;
    sectionName: string;
    status: QuestionStatus;
    candidateAnswer: any;
    timeTakenSeconds: number;
    question: SafeQuestion;
  }[];
}

export interface SpeedAccuracyQuadrant {
  quadrant: 'FAST_AND_ACCURATE' | 'SLOW_AND_ACCURATE' | 'FAST_AND_INACCURATE' | 'SLOW_AND_INACCURATE';
  description: string;
  recommendation: string;
  avgTimeSec: number;
  accuracyPercent: number;
  totalQuestions: number;
}

export interface WeakAreaReport {
  topicId: string;
  topicName: string;
  subjectName: string;
  accuracy: number;
  avgTimeSeconds: number;
  incorrectCount: number;
  totalQuestions: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedActions: string[];
}

export interface QuestionReviewItem {
  id: string;
  sequenceOrder: number;
  sectionName: string;
  status: QuestionStatus;
  questionType: string;
  difficulty: string;
  questionText: string;
  options: QuestionOption[];
  candidateAnswer: any;
  correctAnswer: any;
  isCorrect: boolean | null;
  marksAwarded: number;
  timeTakenSeconds: number;
  avgExpectedSeconds: number;
  isTimeDeficient: boolean;
  explanation: string;
  shortcutTrick?: string;
  formulaConcept?: string;
  commonMistake?: string;
  isPYQ: boolean;
  sourceRef?: string;
  subjectName: string;
  topicName: string;
}

export interface PostExamReport {
  session: {
    id: string;
    exam: Exam;
    mode: string;
    title: string;
    startedAt: string;
    endedAt: string;
    score: number;
    maxScore: number;
    accuracy: number;
    totalAttempted: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalSkipped: number;
    totalDurationSeconds: number;
    timeTakenSeconds: number;
    avgResponseTimeSeconds: number;
    timeEfficiency: number;
    estimatedPercentile: number;
  };
  speedAccuracyQuadrant: SpeedAccuracyQuadrant;
  topicStats: {
    topicId: string;
    topicName: string;
    subjectName: string;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    avgTimeSeconds: number;
    accuracy: number;
  }[];
  weakAreas: WeakAreaReport[];
  questions: QuestionReviewItem[];
}

export interface MistakeEntry {
  id: string;
  questionId: string;
  mistakeType: 'CONCEPTUAL' | 'CALCULATION' | 'SILLY' | 'TIME_MANAGEMENT' | 'MISREAD' | 'GUESSING';
  userNotes?: string;
  dateLogged: string;
  userChoice: any;
  correctAnswer: any;
  questionText: string;
  options: QuestionOption[];
  explanation: string;
  formulaConcept?: string;
  shortcutTrick?: string;
  commonMistake?: string;
  subjectName: string;
  topicName: string;
  examName: string;
  year: number;
}

export interface Bookmark {
  id: string;
  category: 'IMPORTANT' | 'REVISE_LATER' | 'DIFFICULT' | 'FORMULA' | 'TRICKY';
  note?: string;
  createdAt: string;
  question: {
    id: string;
    questionText: string;
    options: QuestionOption[];
    correctAnswer: any;
    explanation: string;
    formulaConcept?: string;
    shortcutTrick?: string;
    subjectName: string;
    topicName: string;
    examName: string;
    year: number;
    difficulty: string;
    isPYQ: boolean;
  };
}

export interface RevisionCard {
  id: string;
  questionId: string;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  question: {
    id: string;
    questionText: string;
    options: QuestionOption[];
    correctAnswer: any;
    explanation: string;
    formulaConcept?: string;
    shortcutTrick?: string;
    subjectName: string;
    topicName: string;
    examName: string;
    difficulty: string;
    isPYQ: boolean;
  };
}
