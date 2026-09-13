import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { examId, subjectId, topicId, difficulty, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (examId) where.examId = String(examId);
    if (subjectId) where.subjectId = String(subjectId);
    if (topicId) where.topicId = String(topicId);
    if (difficulty) where.difficulty = String(difficulty);

    const take = parseInt(String(limit));
    const skip = (parseInt(String(page)) - 1) * take;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          exam: { select: { code: true, name: true } },
          subject: { select: { name: true } },
          topic: { select: { name: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    const formatted = questions.map((q) => {
      let options = [];
      let correctAnswer = null;
      try { options = JSON.parse(q.optionsJson); } catch {}
      try { correctAnswer = JSON.parse(q.correctAnswersJson); } catch { correctAnswer = q.correctAnswersJson; }

      return {
        id: q.id,
        examId: q.examId,
        examName: q.exam.name,
        subjectName: q.subject.name,
        topicName: q.topic.name,
        year: q.year,
        shift: q.shift,
        questionType: q.questionType,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options,
        correctAnswer,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        avgExpectedSeconds: q.avgExpectedSeconds,
        explanation: q.explanation,
        formulaConcept: q.formulaConcept,
        shortcutTrick: q.shortcutTrick,
        isPYQ: q.isPYQ,
        isAIGenerated: q.isAIGenerated,
        sourceRef: q.sourceRef,
      };
    });

    return res.json({
      total,
      page: parseInt(String(page)),
      totalPages: Math.ceil(total / take),
      questions: formatted,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve questions' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const {
      examId,
      subjectId,
      topicId,
      year = 2024,
      shift = 'Shift 1',
      questionType = 'MCQ',
      difficulty = 'MEDIUM',
      questionText,
      options,
      correctAnswer,
      marks = 1.0,
      negativeMarks = 0.33,
      avgExpectedSeconds = 60,
      explanation,
      formulaConcept,
      shortcutTrick,
      commonMistake,
      isPYQ = true,
      isAIGenerated = false,
      sourceRef,
    } = req.body;

    if (!examId || !subjectId || !topicId || !questionText || !explanation) {
      return res.status(400).json({ error: 'examId, subjectId, topicId, questionText, and explanation are required' });
    }

    const question = await prisma.question.create({
      data: {
        examId,
        subjectId,
        topicId,
        year: parseInt(String(year)),
        shift,
        questionType,
        difficulty,
        questionText,
        optionsJson: typeof options === 'string' ? options : JSON.stringify(options || []),
        correctAnswersJson: typeof correctAnswer === 'string' ? correctAnswer : JSON.stringify(correctAnswer),
        marks: parseFloat(String(marks)),
        negativeMarks: parseFloat(String(negativeMarks)),
        avgExpectedSeconds: parseInt(String(avgExpectedSeconds)),
        explanation,
        formulaConcept,
        shortcutTrick,
        commonMistake,
        isPYQ: Boolean(isPYQ),
        isAIGenerated: Boolean(isAIGenerated),
        sourceRef,
      },
    });

    return res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    return res.status(500).json({ error: 'Failed to create question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete question' });
  }
};

export const bulkImportQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { questions } = req.body; // Array of question objects

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Array of questions required in request body' });
    }

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        await prisma.question.create({
          data: {
            examId: q.examId,
            subjectId: q.subjectId,
            topicId: q.topicId,
            year: q.year ? parseInt(q.year) : 2024,
            shift: q.shift || 'Shift 1',
            questionType: q.questionType || 'MCQ',
            difficulty: q.difficulty || 'MEDIUM',
            questionText: q.questionText || q.question,
            optionsJson: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
            correctAnswersJson: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer || ['A']),
            marks: q.marks ? parseFloat(q.marks) : 1.0,
            negativeMarks: q.negativeMarks ? parseFloat(q.negativeMarks) : 0.33,
            avgExpectedSeconds: q.avgExpectedSeconds ? parseInt(q.avgExpectedSeconds) : 60,
            explanation: q.explanation || 'Solution',
            formulaConcept: q.formulaConcept || null,
            shortcutTrick: q.shortcutTrick || null,
            isPYQ: q.isPYQ !== undefined ? Boolean(q.isPYQ) : true,
            isAIGenerated: Boolean(q.isAIGenerated),
            sourceRef: q.sourceRef || 'Bulk Import',
          },
        });
        createdCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return res.json({
      success: true,
      imported: createdCount,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error('Error during bulk import:', error);
    return res.status(500).json({ error: 'Failed to process bulk import' });
  }
};

export const updateExamPattern = async (req: AuthRequest, res: Response) => {
  try {
    const { patternId } = req.params;
    const { durationMinutes, totalQuestions, defaultNegativeMarking, sections } = req.body;

    const updated = await prisma.examPattern.update({
      where: { id: patternId },
      data: {
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        totalQuestions: totalQuestions ? parseInt(totalQuestions) : undefined,
        defaultNegativeMarking: defaultNegativeMarking !== undefined ? parseFloat(defaultNegativeMarking) : undefined,
        sectionsJson: sections ? JSON.stringify(sections) : undefined,
      },
    });

    return res.json({ success: true, pattern: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update exam pattern' });
  }
};

export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalQuestions, totalSessions, totalExams] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.testSession.count(),
      prisma.exam.count(),
    ]);

    const examBreakdown = await prisma.exam.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        _count: { select: { questions: true, sessions: true } },
      },
    });

    return res.json({
      totalUsers,
      totalQuestions,
      totalSessions,
      totalExams,
      examBreakdown,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load system stats' });
  }
};
