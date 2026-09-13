import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { SpacedRepetitionEngine } from '../engines/spacedRepetitionEngine.js';

export const getDueRevisions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const dueCards = await prisma.revisionCard.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      include: {
        question: {
          include: {
            subject: { select: { name: true } },
            topic: { select: { name: true } },
            exam: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { nextReviewDate: 'asc' },
    });

    const formatted = dueCards.map((card) => {
      let options = [];
      let correctAnswer = null;
      try { options = JSON.parse(card.question.optionsJson); } catch {}
      try { correctAnswer = JSON.parse(card.question.correctAnswersJson); } catch { correctAnswer = card.question.correctAnswersJson; }

      return {
        id: card.id,
        questionId: card.questionId,
        intervalDays: card.intervalDays,
        repetitions: card.repetitions,
        easeFactor: card.easeFactor,
        nextReviewDate: card.nextReviewDate,
        question: {
          id: card.question.id,
          questionText: card.question.questionText,
          options,
          correctAnswer,
          explanation: card.question.explanation,
          formulaConcept: card.question.formulaConcept,
          shortcutTrick: card.question.shortcutTrick,
          subjectName: card.question.subject.name,
          topicName: card.question.topic.name,
          examName: card.question.exam.name,
          difficulty: card.question.difficulty,
          isPYQ: card.question.isPYQ,
        },
      };
    });

    return res.json({
      totalDue: formatted.length,
      cards: formatted,
    });
  } catch (error) {
    console.error('Error fetching due revisions:', error);
    return res.status(500).json({ error: 'Failed to retrieve due revision cards' });
  }
};

export const submitReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { cardId, quality } = req.body; // quality: 0 (blackout/fail) to 5 (perfect/easy)

    if (!cardId || quality === undefined) {
      return res.status(400).json({ error: 'cardId and quality score (0-5) are required' });
    }

    const card = await prisma.revisionCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) return res.status(404).json({ error: 'Revision card not found' });

    const sm2Result = SpacedRepetitionEngine.calculateNextReview({
      repetitions: card.repetitions,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      quality: parseInt(quality),
    });

    const updated = await prisma.revisionCard.update({
      where: { id: card.id },
      data: {
        repetitions: sm2Result.repetitions,
        intervalDays: sm2Result.intervalDays,
        easeFactor: sm2Result.easeFactor,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      card: updated,
      nextReviewInDays: sm2Result.intervalDays,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record review submission' });
  }
};
