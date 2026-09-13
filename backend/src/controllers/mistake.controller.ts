import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getMistakes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type, examId } = req.query;

    const where: any = { userId };
    if (type) where.mistakeType = String(type);
    if (examId) where.question = { examId: String(examId) };

    const mistakes = await prisma.mistakeEntry.findMany({
      where,
      orderBy: { dateLogged: 'desc' },
      include: {
        question: {
          include: {
            subject: { select: { name: true } },
            topic: { select: { name: true } },
            exam: { select: { name: true, code: true } },
          },
        },
      },
    });

    const seenQuestions = new Set<string>();
    const uniqueMistakes = mistakes.filter((m) => {
      if (seenQuestions.has(m.questionId)) return false;
      seenQuestions.add(m.questionId);
      return true;
    });

    const formatted = uniqueMistakes.map((m) => {
      let options = [];
      let correctAnswer = null;
      let userChoice = null;
      try { options = JSON.parse(m.question.optionsJson); } catch {}
      try { correctAnswer = JSON.parse(m.question.correctAnswersJson); } catch { correctAnswer = m.question.correctAnswersJson; }
      try { userChoice = m.userChoice ? JSON.parse(m.userChoice) : null; } catch { userChoice = m.userChoice; }

      return {
        id: m.id,
        questionId: m.questionId,
        mistakeType: m.mistakeType,
        userNotes: m.userNotes,
        dateLogged: m.dateLogged,
        userChoice,
        correctAnswer,
        questionText: m.question.questionText,
        options,
        explanation: m.question.explanation,
        formulaConcept: m.question.formulaConcept,
        shortcutTrick: m.question.shortcutTrick,
        commonMistake: m.question.commonMistake,
        subjectName: m.question.subject.name,
        topicName: m.question.topic.name,
        examName: m.question.exam.name,
        year: m.question.year,
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve mistake book' });
  }
};

export const updateMistake = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { mistakeType, userNotes } = req.body;

    const updated = await prisma.mistakeEntry.updateMany({
      where: {
        userId,
        OR: [{ id }, { questionId: id }],
      },
      data: {
        mistakeType: mistakeType || undefined,
        userNotes: userNotes !== undefined ? userNotes : undefined,
      },
    });

    return res.json({ success: true, updatedCount: updated.count });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update mistake log' });
  }
};

export const deleteMistake = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.mistakeEntry.deleteMany({
      where: {
        userId,
        OR: [{ id }, { questionId: id }],
      },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove mistake entry' });
  }
};
