import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, targetExam, targetScore, dailyStudyGoalMinutes } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        targetExam: targetExam || 'GATE_CS',
        targetScore: targetScore || 80,
        dailyStudyGoalMinutes: dailyStudyGoalMinutes || 60,
      },
    });

    const secret = process.env.JWT_SECRET || 'prepwizard_super_secret_jwt_key_2026_exam_platform';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        targetExam: user.targetExam,
        targetScore: user.targetScore,
        dailyStudyGoalMinutes: user.dailyStudyGoalMinutes,
        role: user.role,
        streakCount: user.streakCount,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update streak if active today
    const now = new Date();
    const lastActive = new Date(user.lastActiveDate);
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
    let newStreak = user.streakCount;
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveDate: now, streakCount: newStreak },
    });

    const secret = process.env.JWT_SECRET || 'prepwizard_super_secret_jwt_key_2026_exam_platform';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        targetExam: user.targetExam,
        targetScore: user.targetScore,
        dailyStudyGoalMinutes: user.dailyStudyGoalMinutes,
        role: user.role,
        streakCount: newStreak,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        targetExam: true,
        targetScore: true,
        dailyStudyGoalMinutes: true,
        role: true,
        streakCount: true,
        lastActiveDate: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, targetExam, targetScore, dailyStudyGoalMinutes } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name,
        targetExam,
        targetScore: targetScore ? parseInt(targetScore) : undefined,
        dailyStudyGoalMinutes: dailyStudyGoalMinutes ? parseInt(dailyStudyGoalMinutes) : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        targetExam: true,
        targetScore: true,
        dailyStudyGoalMinutes: true,
        role: true,
        streakCount: true,
      },
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};
