import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { AIService } from '../engines/aiService.js';

export const explainQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId } = req.params;
    const { tone = 'simple' } = req.query;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        exam: true,
        subject: true,
        topic: true,
      },
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });

    let options = [];
    let correctAnswer: any = null;
    try { options = JSON.parse(question.optionsJson); } catch {}
    try { correctAnswer = JSON.parse(question.correctAnswersJson); } catch { correctAnswer = question.correctAnswersJson; }

    const explanation = AIService.explainQuestion(
      {
        id: question.id,
        exam: question.exam.name,
        subject: question.subject.name,
        topic: question.topic.name,
        questionText: question.questionText,
        options,
        correctAnswer,
        explanation: question.explanation,
        formula: question.formulaConcept || undefined,
      },
      tone as any
    );

    return res.json(explanation);
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    return res.status(500).json({ error: 'Failed to generate AI explanation' });
  }
};

export const answerDoubt = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, userQuery } = req.body;

    if (!questionId || !userQuery) {
      return res.status(400).json({ error: 'questionId and userQuery are required' });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        exam: true,
        subject: true,
        topic: true,
      },
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });

    let options = [];
    let correctAnswer: any = null;
    try { options = JSON.parse(question.optionsJson); } catch {}
    try { correctAnswer = JSON.parse(question.correctAnswersJson); } catch { correctAnswer = question.correctAnswersJson; }

    const response = AIService.answerDoubt(
      {
        id: question.id,
        exam: question.exam.name,
        subject: question.subject.name,
        topic: question.topic.name,
        questionText: question.questionText,
        options,
        correctAnswer,
        explanation: question.explanation,
        formula: question.formulaConcept || undefined,
      },
      userQuery
    );

    return res.json(response);
  } catch (error) {
    console.error('Error resolving doubt:', error);
    return res.status(500).json({ error: 'Failed to resolve doubt' });
  }
};

export const analyzeMistakes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const mistakes = await prisma.mistakeEntry.findMany({
      where: { userId },
      include: { question: { include: { topic: true } } },
    });

    if (mistakes.length === 0) {
      return res.json({
        isAIGenerated: true,
        tag: 'AI GENERATED MISTAKE DIAGNOSTIC',
        totalMistakesAnalyzed: 0,
        diagnosticRecommendation: 'No mistakes logged yet! Complete more tests or practice sessions to generate targeted diagnostics.',
      });
    }

    const aggregated: Record<string, { mistakeType: string; topicName: string; count: number }> = {};
    for (const m of mistakes) {
      const key = `${m.mistakeType}_${m.question.topic.name}`;
      if (!aggregated[key]) {
        aggregated[key] = { mistakeType: m.mistakeType, topicName: m.question.topic.name, count: 0 };
      }
      aggregated[key].count += 1;
    }

    const analysis = AIService.analyzeMistakes(Object.values(aggregated));
    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate mistake diagnostic' });
  }
};

export const generateStudyPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch user's weak topics
    const answered = await prisma.sessionQuestion.findMany({
      where: { session: { userId }, status: { in: ['ANSWERED', 'ANSWERED_AND_MARKED'] } },
      include: { question: { include: { topic: true } } },
    });

    const topicAccuracy: Record<string, { total: number; correct: number }> = {};
    for (const a of answered) {
      const name = a.question.topic.name;
      if (!topicAccuracy[name]) topicAccuracy[name] = { total: 0, correct: 0 };
      topicAccuracy[name].total += 1;
      if (a.isCorrect) topicAccuracy[name].correct += 1;
    }

    const weakTopics = Object.keys(topicAccuracy)
      .filter((t) => topicAccuracy[t].total >= 2 && topicAccuracy[t].correct / topicAccuracy[t].total < 0.6)
      .slice(0, 3);

    const plan = AIService.generateStudyPlan(
      user.targetExam,
      user.targetScore,
      Math.round(user.dailyStudyGoalMinutes / 60) || 2,
      weakTopics
    );

    return res.json(plan);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate study plan' });
  }
};
