import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { WeaknessEngine, TopicStat } from '../engines/weaknessEngine.js';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        targetExam: true,
        targetScore: true,
        dailyStudyGoalMinutes: true,
        streakCount: true,
        lastActiveDate: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Aggregations across completed sessions
    const completedSessions = await prisma.testSession.findMany({
      where: { userId, status: 'SUBMITTED' },
      orderBy: { endedAt: 'desc' },
      include: { exam: true },
    });

    const totalQuestionsAttempted = completedSessions.reduce((sum, s) => sum + (s.totalAttempted || 0), 0);
    const totalCorrect = completedSessions.reduce((sum, s) => sum + (s.totalCorrect || 0), 0);
    const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : 0;
    const totalStudyTimeSeconds = completedSessions.reduce((sum, s) => sum + (s.totalDurationSeconds - s.timeRemainingSeconds), 0);
    const totalStudyHours = (totalStudyTimeSeconds / 3600).toFixed(1);

    // Topic performance aggregation across all answered questions
    const answeredQuestions = await prisma.sessionQuestion.findMany({
      where: {
        session: { userId, status: 'SUBMITTED' },
        status: { in: ['ANSWERED', 'ANSWERED_AND_MARKED'] },
      },
      include: {
        question: {
          include: {
            topic: true,
            subject: true,
          },
        },
      },
    });

    const topicMap: Record<string, { name: string; subject: string; total: number; correct: number; incorrect: number; time: number }> = {};
    for (const aq of answeredQuestions) {
      const t = aq.question.topic;
      const s = aq.question.subject;
      if (!topicMap[t.id]) {
        topicMap[t.id] = { name: t.name, subject: s.name, total: 0, correct: 0, incorrect: 0, time: 0 };
      }
      topicMap[t.id].total += 1;
      topicMap[t.id].time += aq.timeTakenSeconds;
      if (aq.isCorrect) topicMap[t.id].correct += 1;
      else topicMap[t.id].incorrect += 1;
    }

    const topicStats: TopicStat[] = Object.keys(topicMap).map((tid) => {
      const e = topicMap[tid];
      return {
        topicId: tid,
        topicName: e.name,
        subjectName: e.subject,
        totalQuestions: e.total,
        correctCount: e.correct,
        incorrectCount: e.incorrect,
        avgTimeSeconds: e.total > 0 ? e.time / e.total : 0,
        accuracy: e.total > 0 ? (e.correct / e.total) * 100 : 0,
      };
    });

    const weakAreas = WeaknessEngine.analyzeWeaknesses(topicStats);

    // Speed vs Accuracy matrix
    const avgResponseTime = totalQuestionsAttempted > 0 ? Math.round(answeredQuestions.reduce((s, q) => s + q.timeTakenSeconds, 0) / totalQuestionsAttempted) : 45;
    const speedAccuracy = WeaknessEngine.classifySpeedAccuracy(totalQuestionsAttempted, avgResponseTime, overallAccuracy);

    // Today's revision count
    const dueRevisionsCount = await prisma.revisionCard.count({
      where: {
        userId,
        nextReviewDate: { lte: new Date() },
      },
    });

    // Today's solved count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAnsweredCount = await prisma.sessionQuestion.count({
      where: {
        session: { userId, status: 'SUBMITTED' },
        status: { in: ['ANSWERED', 'ANSWERED_AND_MARKED'] },
        OR: [
          { answeredAt: { gte: startOfToday } },
          { session: { endedAt: { gte: startOfToday } } },
        ],
      },
    });

    // Mistake count
    const totalMistakesCount = await prisma.mistakeEntry.count({
      where: { userId },
    });

    // Recent test sessions
    const recentTests = completedSessions.slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      examName: s.exam.name,
      mode: s.mode,
      score: s.score,
      maxScore: s.maxScore,
      accuracy: s.accuracy,
      totalAttempted: s.totalAttempted,
      endedAt: s.endedAt,
    }));

    return res.json({
      user,
      stats: {
        totalQuestionsSolved: totalQuestionsAttempted,
        todayQuestionsSolved: todayAnsweredCount,
        dailyTargetQuestions: 30,
        totalCorrect,
        overallAccuracy,
        totalStudyHours,
        testsCompleted: completedSessions.length,
        dueRevisionsCount,
        totalMistakesCount,
        streakCount: user.streakCount,
      },
      speedAccuracy,
      weakAreas: weakAreas.slice(0, 3), // Top 3 weak areas
      allTopicStats: topicStats,
      recentTests,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard analytics' });
  }
};
