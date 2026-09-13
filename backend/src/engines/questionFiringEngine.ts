export interface SafeQuestionView {
  id: string;
  examId: string;
  subjectName: string;
  topicName: string;
  year: number;
  shift: string | null;
  questionType: string;
  difficulty: string;
  questionText: string;
  options: { id: string; text: string }[];
  marks: number;
  negativeMarks: number;
  avgExpectedSeconds: number;
  isPYQ: boolean;
  isAIGenerated: boolean;
  sourceRef: string | null;
  // Note: Correct answers and explanations are EXCLUDED for active exam security
}

export class QuestionFiringEngine {
  /**
   * Sanitizes a question for delivery to active test taker.
   * Strips correct answers, explanations, shortcuts, formulas.
   */
  public static sanitizeQuestion(q: any): SafeQuestionView {
    let options: { id: string; text: string }[] = [];
    try {
      options = typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : (q.optionsJson || []);
    } catch {
      options = [];
    }

    return {
      id: q.id,
      examId: q.examId,
      subjectName: q.subject ? q.subject.name : '',
      topicName: q.topic ? q.topic.name : '',
      year: q.year,
      shift: q.shift,
      questionType: q.questionType,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      avgExpectedSeconds: q.avgExpectedSeconds,
      isPYQ: q.isPYQ,
      isAIGenerated: q.isAIGenerated,
      sourceRef: q.sourceRef,
    };
  }

  /**
   * Computes elapsed time safely preventing client clock manipulation
   */
  public static calculateElapsedTime(startTime: Date, serverNow: Date = new Date()): number {
    const elapsedMs = serverNow.getTime() - new Date(startTime).getTime();
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }
}
