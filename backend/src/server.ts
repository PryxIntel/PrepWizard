import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import examRoutes from './routes/exam.routes.js';
import sessionRoutes from './routes/session.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import mistakeRoutes from './routes/mistake.routes.js';
import bookmarkRoutes from './routes/bookmark.routes.js';
import revisionRoutes from './routes/revision.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'PrepWizard Backend & Exam Engine',
    timestamp: new Date().toISOString(),
    supportedExams: ['GATE_CS', 'RRB_JE_EE', 'SSC_JE_EE', 'RRB_ALP_EE'],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 PrepWizard Engine running at http://localhost:${PORT}`);
  console.log(`⚡ API Health check: http://localhost:${PORT}/api/health`);
});
