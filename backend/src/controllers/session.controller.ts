import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { ExamEngine } from '../engines/examEngine.js';
import { ScoringEngine } from '../engines/scoringEngine.js';
import { QuestionFiringEngine } from '../engines/questionFiringEngine.js';
import { WeaknessEngine, TopicStat } from '../engines/weaknessEngine.js';

export const startSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      examId,
      mode = 'REAL_EXAM',
      subjectId,
      topicId,
      questionCount,
      timePerQuestionSeconds,
      difficulty,
      year,
      paperTitle,
    } = req.body;

    if (!examId) {
      return res.status(400).json({ error: 'examId is required' });
    }

    const sessionId = await ExamEngine.createSession({
      userId,
      examId,
      mode,
      subjectId,
      topicId,
      questionCount: questionCount ? parseInt(questionCount) : undefined,
      timePerQuestionSeconds: timePerQuestionSeconds ? parseInt(timePerQuestionSeconds) : undefined,
      difficulty,
      year: year ? parseInt(year) : undefined,
      paperTitle,
    });

    return res.status(201).json({ sessionId });
  } catch (error: any) {
    console.error('Start session error:', error);
    return res.status(500).json({ error: error.message || 'Failed to initialize session' });
  }
};

export const getSessionState = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const session = await prisma.testSession.findFirst({
      where: { id, userId },
      include: {
        exam: { select: { id: true, code: true, name: true } },
        sessionQuestions: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            question: {
              include: {
                subject: { select: { name: true } },
                topic: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if time expired
    const elapsed = QuestionFiringEngine.calculateElapsedTime(session.startedAt);
    let remaining = session.totalDurationSeconds - elapsed;
    if (remaining <= 0 && session.status === 'IN_PROGRESS') {
      // Auto-submit expired session
      await finalizeSession(session.id);
      return res.json({ status: 'EXPIRED', message: 'Exam duration has expired' });
    }

    // Build palette status list
    const palette = session.sessionQuestions.map((sq) => ({
      sequenceOrder: sq.sequenceOrder,
      questionId: sq.questionId,
      sectionName: sq.sectionName,
      status: sq.status,
      isAnswered: sq.status === 'ANSWERED' || sq.status === 'ANSWERED_AND_MARKED',
      timeTakenSeconds: sq.timeTakenSeconds,
      candidateAnswer: sq.candidateAnswerJson ? JSON.parse(sq.candidateAnswerJson) : null,
    }));

    // Build safe sanitized questions list (answers scrubbed for active test)
    const questions = session.sessionQuestions.map((sq) => ({
      sequenceOrder: sq.sequenceOrder,
      sectionName: sq.sectionName,
      status: sq.status,
      candidateAnswer: sq.candidateAnswerJson ? JSON.parse(sq.candidateAnswerJson) : null,
      timeTakenSeconds: sq.timeTakenSeconds,
      question: QuestionFiringEngine.sanitizeQuestion(sq.question),
    }));

    const config = JSON.parse(session.configJson || '{}');

    return res.json({
      session: {
        id: session.id,
        exam: session.exam,
        mode: session.mode,
        title: session.title,
        status: session.status,
        totalDurationSeconds: session.totalDurationSeconds,
        timeRemainingSeconds: Math.max(0, remaining),
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.sessionQuestions.length,
        config,
      },
      palette,
      questions,
    });
  } catch (error) {
    console.error('Error fetching session state:', error);
    return res.status(500).json({ error: 'Failed to retrieve session state' });
  }
};

export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { sequenceOrder, candidateAnswer, timeTakenSeconds, markForReview } = req.body;

    const session = await prisma.testSession.findFirst({
      where: { id, userId, status: 'IN_PROGRESS' },
    });
    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const sessionQuestion = await prisma.sessionQuestion.findFirst({
      where: { sessionId: id, sequenceOrder },
      include: { question: true },
    });
    if (!sessionQuestion) {
      return res.status(404).json({ error: 'Question not found in this session' });
    }

    const answerJson = candidateAnswer !== undefined && candidateAnswer !== null ? JSON.stringify(candidateAnswer) : null;

    // Evaluate answer with ScoringEngine
    const evalResult = ScoringEngine.evaluateAnswer({
      questionType: sessionQuestion.question.questionType,
      marks: sessionQuestion.question.marks,
      negativeMarks: sessionQuestion.question.negativeMarks,
      candidateAnswerJson: answerJson,
      correctAnswersJson: sessionQuestion.question.correctAnswersJson,
    });

    let newStatus = 'ANSWERED';
    if (markForReview) {
      newStatus = answerJson ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';
    } else if (!answerJson) {
      newStatus = 'NOT_ANSWERED';
    }

    // Update SessionQuestion
    await prisma.sessionQuestion.update({
      where: { id: sessionQuestion.id },
      data: {
        candidateAnswerJson: answerJson,
        status: newStatus,
        isCorrect: evalResult.isAttempted ? evalResult.isCorrect : null,
        marksAwarded: evalResult.marksAwarded,
        timeTakenSeconds: timeTakenSeconds !== undefined ? timeTakenSeconds : sessionQuestion.timeTakenSeconds,
        answeredAt: new Date(),
      },
    });

    // If candidate made a mistake, automatically log or update in mistake table (never duplicate)
    if (evalResult.isAttempted && !evalResult.isCorrect) {
      await prisma.mistakeEntry.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId: sessionQuestion.questionId,
          },
        },
        update: {
          userChoice: answerJson,
          correctChoice: sessionQuestion.question.correctAnswersJson,
          dateLogged: new Date(),
        },
        create: {
          userId,
          questionId: sessionQuestion.questionId,
          userChoice: answerJson,
          correctChoice: sessionQuestion.question.correctAnswersJson,
          mistakeType: 'CONCEPTUAL',
          dateLogged: new Date(),
        },
      });

      // Add to Spaced Repetition cards if not already present
      const existingCard = await prisma.revisionCard.findFirst({
        where: { userId, questionId: sessionQuestion.questionId },
      });
      if (!existingCard) {
        await prisma.revisionCard.create({
          data: {
            userId,
            questionId: sessionQuestion.questionId,
            intervalDays: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReviewDate: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });
      }
    }

    // Update current index on session
    await prisma.testSession.update({
      where: { id },
      data: {
        currentQuestionIndex: sequenceOrder,
      },
    });

    return res.json({
      success: true,
      sequenceOrder,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({ error: 'Failed to submit answer' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sequenceOrder, action } = req.body; // 'SKIP', 'MARK_REVIEW', 'CLEAR', 'VISIT'

    const sessionQuestion = await prisma.sessionQuestion.findFirst({
      where: { sessionId: id, sequenceOrder },
    });
    if (!sessionQuestion) return res.status(404).json({ error: 'Question not found' });

    let newStatus = sessionQuestion.status;
    let newAnswer = sessionQuestion.candidateAnswerJson;

    if (action === 'CLEAR') {
      newAnswer = null;
      newStatus = 'NOT_ANSWERED';
    } else if (action === 'MARK_REVIEW') {
      newStatus = sessionQuestion.candidateAnswerJson ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';
    } else if (action === 'SKIP') {
      if (!sessionQuestion.candidateAnswerJson) newStatus = 'NOT_ANSWERED';
    } else if (action === 'VISIT' && sessionQuestion.status === 'NOT_VISITED') {
      newStatus = 'NOT_ANSWERED';
    }

    await prisma.sessionQuestion.update({
      where: { id: sessionQuestion.id },
      data: { status: newStatus, candidateAnswerJson: newAnswer },
    });

    return res.json({ success: true, status: newStatus });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
};

export const submitTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await finalizeSession(id, userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error finalizing test:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit test' });
  }
};

export const getPostExamAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const session = await prisma.testSession.findFirst({
      where: { id, userId },
      include: {
        exam: true,
        sessionQuestions: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            question: {
              include: {
                subject: true,
                topic: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    // Build question-level reviews with full solutions & explanations
    const questionReview = session.sessionQuestions.map((sq) => {
      const q = sq.question;
      let options = [];
      let correctAnswer: any = null;
      let candidateAnswer: any = null;

      try {
        options = JSON.parse(q.optionsJson);
      } catch {
        options = [];
      }
      try {
        correctAnswer = JSON.parse(q.correctAnswersJson);
      } catch {
        correctAnswer = q.correctAnswersJson;
      }
      try {
        candidateAnswer = sq.candidateAnswerJson ? JSON.parse(sq.candidateAnswerJson) : null;
      } catch {
        candidateAnswer = sq.candidateAnswerJson;
      }

      return {
        id: q.id,
        sequenceOrder: sq.sequenceOrder,
        sectionName: sq.sectionName,
        status: sq.status,
        questionType: q.questionType,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options,
        candidateAnswer,
        correctAnswer,
        isCorrect: sq.isCorrect,
        marksAwarded: sq.marksAwarded,
        timeTakenSeconds: sq.timeTakenSeconds,
        avgExpectedSeconds: q.avgExpectedSeconds,
        isTimeDeficient: sq.timeTakenSeconds > q.avgExpectedSeconds * 1.5,
        explanation: q.explanation,
        shortcutTrick: q.shortcutTrick,
        formulaConcept: q.formulaConcept,
        commonMistake: q.commonMistake,
        isPYQ: q.isPYQ,
        sourceRef: q.sourceRef,
        subjectName: q.subject.name,
        topicName: q.topic.name,
      };
    });

    // Topic performance aggregation
    const topicMap: Record<string, { name: string; subject: string; total: number; correct: number; incorrect: number; totalTime: number }> = {};

    for (const sq of session.sessionQuestions) {
      const t = sq.question.topic;
      const s = sq.question.subject;
      if (!topicMap[t.id]) {
        topicMap[t.id] = {
          name: t.name,
          subject: s.name,
          total: 0,
          correct: 0,
          incorrect: 0,
          totalTime: 0,
        };
      }
      topicMap[t.id].total += 1;
      topicMap[t.id].totalTime += sq.timeTakenSeconds;
      if (sq.isCorrect === true) {
        topicMap[t.id].correct += 1;
      } else if (sq.isCorrect === false) {
        topicMap[t.id].incorrect += 1;
      }
    }

    const topicStats: TopicStat[] = Object.keys(topicMap).map((tid) => {
      const entry = topicMap[tid];
      const acc = entry.total > 0 ? (entry.correct / entry.total) * 100 : 0;
      const avgT = entry.total > 0 ? entry.totalTime / entry.total : 0;
      return {
        topicId: tid,
        topicName: entry.name,
        subjectName: entry.subject,
        totalQuestions: entry.total,
        correctCount: entry.correct,
        incorrectCount: entry.incorrect,
        avgTimeSeconds: avgT,
        accuracy: acc,
      };
    });

    // Speed vs Accuracy matrix analysis
    const totalTimeAttempted = session.sessionQuestions.reduce((acc, q) => acc + q.timeTakenSeconds, 0);
    const avgResponseTime = session.totalAttempted && session.totalAttempted > 0 ? Math.round(totalTimeAttempted / session.totalAttempted) : 0;
    const speedAccuracyQuadrant = WeaknessEngine.classifySpeedAccuracy(
      session.totalAttempted || 0,
      avgResponseTime,
      session.accuracy || 0
    );

    // Weak areas identification
    const weakAreas = WeaknessEngine.analyzeWeaknesses(topicStats);

    // Time efficiency score
    const expectedTotalTime = session.sessionQuestions.reduce((acc, q) => acc + q.question.avgExpectedSeconds, 0);
    const timeEfficiency = expectedTotalTime > 0 ? Math.min(100, Math.round((expectedTotalTime / Math.max(1, totalTimeAttempted)) * 100)) : 75;

    // Percentile estimation
    const accuracy = session.accuracy || 0;
    const estimatedPercentile = Math.min(99.8, Math.max(30.0, parseFloat((accuracy * 0.95 + 15).toFixed(1))));

    return res.json({
      session: {
        id: session.id,
        exam: session.exam,
        mode: session.mode,
        title: session.title,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        score: session.score,
        maxScore: session.maxScore,
        accuracy: session.accuracy,
        totalAttempted: session.totalAttempted,
        totalCorrect: session.totalCorrect,
        totalIncorrect: session.totalIncorrect,
        totalSkipped: session.totalSkipped,
        totalDurationSeconds: session.totalDurationSeconds,
        timeTakenSeconds: totalTimeAttempted,
        avgResponseTimeSeconds: avgResponseTime,
        timeEfficiency,
        estimatedPercentile,
      },
      speedAccuracyQuadrant,
      topicStats,
      weakAreas,
      questions: questionReview,
    });
  } catch (error) {
    console.error('Error generating post-exam analysis:', error);
    return res.status(500).json({ error: 'Failed to retrieve test analysis' });
  }
};

/**
 * Finalizes session: tallies score, marks, accuracy, counts.
 */
async function finalizeSession(sessionId: string, userId?: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      sessionQuestions: {
        include: { question: true },
      },
    },
  });

  if (!session) throw new Error('Session not found');

  let totalScore = 0;
  let maxScore = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;

  for (const sq of session.sessionQuestions) {
    maxScore += sq.question.marks;
    if (sq.status === 'ANSWERED' || sq.status === 'ANSWERED_AND_MARKED') {
      totalAttempted += 1;
      totalScore += sq.marksAwarded;
      if (sq.isCorrect === true) {
        totalCorrect += 1;
      } else {
        totalIncorrect += 1;
      }
    } else {
      totalSkipped += 1;
    }
  }

  const accuracy = totalAttempted > 0 ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;
  const roundedScore = parseFloat(totalScore.toFixed(2));

  const updated = await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status: 'SUBMITTED',
      score: roundedScore,
      maxScore,
      accuracy,
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      endedAt: new Date(),
    },
  });

  return updated;
}
