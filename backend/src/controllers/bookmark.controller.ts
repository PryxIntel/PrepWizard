import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getBookmarks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category } = req.query;

    const where: any = { userId };
    if (category) where.category = String(category);

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        question: {
          include: {
            subject: true,
            topic: true,
            exam: true,
          },
        },
      },
    });

    const formatted = bookmarks.map((b) => {
      let options = [];
      let correctAnswer = null;
      try { options = JSON.parse(b.question.optionsJson); } catch {}
      try { correctAnswer = JSON.parse(b.question.correctAnswersJson); } catch { correctAnswer = b.question.correctAnswersJson; }

      return {
        id: b.id,
        category: b.category,
        note: b.note,
        createdAt: b.createdAt,
        question: {
          id: b.question.id,
          questionText: b.question.questionText,
          options,
          correctAnswer,
          explanation: b.question.explanation,
          formulaConcept: b.question.formulaConcept,
          shortcutTrick: b.question.shortcutTrick,
          subjectName: b.question.subject.name,
          topicName: b.question.topic.name,
          examName: b.question.exam.name,
          year: b.question.year,
          difficulty: b.question.difficulty,
          isPYQ: b.question.isPYQ,
        },
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve bookmarks' });
  }
};

export const createBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { questionId, category = 'IMPORTANT', note } = req.body;

    if (!questionId) return res.status(400).json({ error: 'questionId is required' });

    // Upsert bookmark
    const existing = await prisma.bookmark.findFirst({
      where: { userId, questionId },
    });

    if (existing) {
      const updated = await prisma.bookmark.update({
        where: { id: existing.id },
        data: { category, note },
      });
      return res.json(updated);
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        questionId,
        category,
        note,
      },
    });

    return res.status(201).json(bookmark);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create bookmark' });
  }
};

export const deleteBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.bookmark.deleteMany({
      where: { OR: [{ id }, { questionId: id }], userId },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove bookmark' });
  }
};
