import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getExams = async (_req: Request, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { isActive: true },
      include: {
        patterns: true,
        subjects: {
          include: {
            topics: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    // Group PYQs by exam and year to provide authentic year coverage & question counts
    const pyqGroup = await prisma.question.groupBy({
      by: ['examId', 'year'],
      where: { isPYQ: true },
      _count: { id: true },
      orderBy: { year: 'desc' },
    });

    const pyqMap: Record<string, { year: number; questionCount: number }[]> = {};
    for (const item of pyqGroup) {
      if (!pyqMap[item.examId]) {
        pyqMap[item.examId] = [];
      }
      pyqMap[item.examId].push({
        year: item.year,
        questionCount: item._count.id,
      });
    }

    const formatted = exams.map((exam) => {
      const yearStats = pyqMap[exam.id] || [];
      const totalPyqs = yearStats.reduce((sum, y) => sum + y.questionCount, 0);
      const sortedYears = yearStats.map((y) => y.year).sort((a, b) => a - b);
      const minYear = sortedYears.length > 0 ? sortedYears[0] : null;
      const maxYear = sortedYears.length > 0 ? sortedYears[sortedYears.length - 1] : null;
      const yearRange = minYear && maxYear ? (minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`) : 'N/A';

      return {
        id: exam.id,
        code: exam.code,
        name: exam.name,
        category: exam.category,
        description: exam.description,
        patterns: exam.patterns.map((p) => ({
          id: p.id,
          title: p.title,
          durationMinutes: p.durationMinutes,
          totalQuestions: p.totalQuestions,
          negativeMarking: p.defaultNegativeMarking,
          sections: JSON.parse(p.sectionsJson || '[]'),
        })),
        subjects: exam.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
        })),
        totalQuestionsAvailable: exam._count.questions,
        pyqInfo: {
          totalCount: totalPyqs,
          minYear,
          maxYear,
          yearRange,
          years: yearStats, // ordered desc by year
        },
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return res.status(500).json({ error: 'Failed to retrieve exams' });
  }
};

export const getExamDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        patterns: true,
        subjects: {
          include: { topics: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { questions: true } },
      },
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const pyqGroup = await prisma.question.groupBy({
      by: ['year'],
      where: { examId: exam.id, isPYQ: true },
      _count: { id: true },
      orderBy: { year: 'desc' },
    });

    const yearStats = pyqGroup.map((item) => ({
      year: item.year,
      questionCount: item._count.id,
    }));
    const totalPyqs = yearStats.reduce((sum, y) => sum + y.questionCount, 0);
    const sortedYears = yearStats.map((y) => y.year).sort((a, b) => a - b);
    const minYear = sortedYears.length > 0 ? sortedYears[0] : null;
    const maxYear = sortedYears.length > 0 ? sortedYears[sortedYears.length - 1] : null;
    const yearRange = minYear && maxYear ? (minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`) : 'N/A';

    return res.json({
      ...exam,
      patterns: exam.patterns.map((p) => ({
        ...p,
        sections: JSON.parse(p.sectionsJson || '[]'),
      })),
      totalQuestions: exam._count.questions,
      pyqInfo: {
        totalCount: totalPyqs,
        minYear,
        maxYear,
        yearRange,
        years: yearStats,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve exam details' });
  }
};
