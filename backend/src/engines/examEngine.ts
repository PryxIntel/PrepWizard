import prisma from '../config/prisma.js';

export interface StartSessionOptions {
  userId: string;
  examId: string;
  mode: string;
  subjectId?: string;
  topicId?: string;
  questionCount?: number;
  timePerQuestionSeconds?: number;
  difficulty?: string;
  year?: number;
  paperTitle?: string;
}

export class ExamEngine {
  /**
   * Initializes a new test session tailored to the requested mode
   */
  public static async createSession(options: StartSessionOptions) {
    const {
      userId,
      examId,
      mode,
      subjectId,
      topicId,
      questionCount = 20,
      timePerQuestionSeconds,
      difficulty,
      year,
      paperTitle,
    } = options;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { patterns: true },
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    const defaultPattern = exam.patterns.find((p) => p.isDefault) || exam.patterns[0];

    // Filter questions based on mode
    let candidateQuestionIds: string[] = [];

    if (mode === 'MISTAKE_PRACTICE') {
      const mistakes = await prisma.mistakeEntry.findMany({
        where: { userId, question: { examId } },
        select: { questionId: true },
        distinct: ['questionId'],
      });
      candidateQuestionIds = mistakes.map((m) => m.questionId);
    } else if (mode === 'WEAK_AREA') {
      // Find topics where user accuracy < 60%
      const pastAttempts = await prisma.sessionQuestion.findMany({
        where: {
          session: { userId, examId },
          status: 'ANSWERED',
        },
        include: { question: true },
      });

      const topicCounts: Record<string, { total: number; correct: number }> = {};
      for (const att of pastAttempts) {
        const tid = att.question.topicId;
        if (!topicCounts[tid]) topicCounts[tid] = { total: 0, correct: 0 };
        topicCounts[tid].total += 1;
        if (att.isCorrect) topicCounts[tid].correct += 1;
      }

      const weakTopicIds = Object.keys(topicCounts).filter((tid) => {
        const entry = topicCounts[tid];
        return entry.total >= 2 && entry.correct / entry.total < 0.6;
      });

      if (weakTopicIds.length > 0) {
        const weakQuestions = await prisma.question.findMany({
          where: { topicId: { in: weakTopicIds }, examId },
          select: { id: true },
        });
        candidateQuestionIds = weakQuestions.map((q) => q.id);
      }
    }

    // Build Prisma where query
    const where: any = { examId };
    if (candidateQuestionIds.length > 0) {
      where.id = { in: candidateQuestionIds };
    }
    if (subjectId) where.subjectId = subjectId;
    if (topicId) where.topicId = topicId;
    if (difficulty) where.difficulty = difficulty;
    if (year) where.year = year;
    if (mode === 'PYQ_MARATHON') where.isPYQ = true;

    // Fetch candidate questions
    let questions = await prisma.question.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        topic: { select: { name: true } },
      },
    });

    if (questions.length === 0) {
      // Fallback to all questions for this exam
      questions = await prisma.question.findMany({
        where: { examId },
        include: {
          subject: { select: { name: true } },
          topic: { select: { name: true } },
        },
      });
    }

    // Shuffle questions for non-mock modes or randomize
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const limit = Math.min(shuffled.length, questionCount || 25);
    const selectedQuestions = shuffled.slice(0, limit);

    // Determine session duration and config
    let durationSeconds = 1800; // default 30 mins
    let perQuestionTime = timePerQuestionSeconds || 0;

    if (mode === 'RAPID_FIRE') {
      perQuestionTime = timePerQuestionSeconds || 30; // 30 seconds per question
      durationSeconds = selectedQuestions.length * perQuestionTime;
    } else if (mode === 'REAL_EXAM' && defaultPattern) {
      durationSeconds = defaultPattern.durationMinutes * 60;
    } else {
      durationSeconds = Math.max(600, selectedQuestions.length * 90);
    }

    const title =
      paperTitle ||
      `${exam.name} - ${mode.replace(/_/g, ' ')} (${selectedQuestions.length} Questions)`;

    // Create session in DB
    const session = await prisma.testSession.create({
      data: {
        userId,
        examId,
        mode,
        title,
        status: 'IN_PROGRESS',
        totalDurationSeconds: durationSeconds,
        timeRemainingSeconds: durationSeconds,
        currentQuestionIndex: 0,
        configJson: JSON.stringify({
          perQuestionTime,
          autoAdvanceOnTimeUp: mode === 'RAPID_FIRE',
          negativeMarking: defaultPattern ? defaultPattern.defaultNegativeMarking : 0.33,
        }),
      },
    });

    // Create SessionQuestion items
    const sessionQuestionsData = selectedQuestions.map((q, index) => ({
      sessionId: session.id,
      questionId: q.id,
      sequenceOrder: index + 1,
      sectionName: q.subject?.name || 'General',
      status: index === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED',
    }));

    await prisma.sessionQuestion.createMany({
      data: sessionQuestionsData,
    });

    return session.id;
  }
}
