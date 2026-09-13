import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { PostExamReport, QuestionReviewItem } from '../types/index.js';
import { SpeedAccuracyMatrix } from '../components/analytics/SpeedAccuracyMatrix.js';
import { FormulaRenderer } from '../components/common/FormulaRenderer.js';
import { AIDoubtSolverModal } from '../components/ai/AIDoubtSolverModal.js';
import {
  Trophy,
  Target,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bookmark,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PostExamAnalysisPageProps {
  sessionId: string;
  onRetake: () => void;
  onGoHome: () => void;
}

export const PostExamAnalysisPage: React.FC<PostExamAnalysisPageProps> = ({
  sessionId,
  onRetake,
  onGoHome,
}) => {
  const [report, setReport] = useState<PostExamReport | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INCORRECT' | 'SKIPPED' | 'SLOW'>('ALL');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [selectedAIDoubtQ, setSelectedAIDoubtQ] = useState<{ id: string; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    ApiClient.getPostExamAnalysis(sessionId)
      .then((data: PostExamReport) => {
        setReport(data);
        // Expand first 2 questions by default
        const initialExpanded: Record<string, boolean> = {};
        data.questions.slice(0, 2).forEach((q) => {
          initialExpanded[q.id] = true;
        });
        setExpandedQuestions(initialExpanded);

        // Trigger victory confetti if score >= 70%
        if (data.session.accuracy >= 70) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching post-exam report:', err);
      })
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBookmark = async (qId: string) => {
    try {
      await ApiClient.createBookmark({ questionId: qId, category: 'IMPORTANT' });
      alert('Question saved to Bookmarks!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogMistake = async (qId: string, type: string) => {
    try {
      await ApiClient.updateMistake(qId, { mistakeType: type });
      alert(`Mistake classified as ${type}!`);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !report) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Synthesizing comprehensive exam performance report...</p>
        </div>
      </div>
    );
  }

  const { session, speedAccuracyQuadrant, topicStats, weakAreas, questions } = report;

  // Filtered questions for review
  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === 'INCORRECT') return q.isCorrect === false;
    if (activeFilter === 'SKIPPED') return q.status === 'NOT_VISITED' || q.status === 'NOT_ANSWERED';
    if (activeFilter === 'SLOW') return q.isTimeDeficient;
    return true;
  });

  const slowQuestionsCount = questions.filter((q) => q.isTimeDeficient).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Scorecard & Key Metrics */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Official Performance Scorecard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {session.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Completed on {new Date(session.endedAt).toLocaleDateString()} at {new Date(session.endedAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRetake}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* 5 Big Score KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Final Score</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              <span className="text-emerald-400">{session.score}</span>
              <span className="text-slate-500 text-sm"> / {session.maxScore}</span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Accuracy</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              {session.accuracy}%
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Est. Percentile</span>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1 font-mono">
              {session.estimatedPercentile}%ile
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Attempt Ratio</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              {session.totalAttempted} <span className="text-slate-500 text-sm">/ {questions.length}</span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Time Efficiency</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
              {session.timeEfficiency}%
            </div>
          </div>
        </div>
      </div>

      {/* Speed vs Accuracy 4-Quadrant Matrix & Topic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Speed vs Accuracy Matrix */}
        <SpeedAccuracyMatrix data={speedAccuracyQuadrant} />

        {/* Right: Topic Performance Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Target className="w-5 h-5 text-indigo-400" />
                <span>Topic Mastery Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400">{topicStats.length} Topics Tested</span>
            </div>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {topicStats.map((topic) => (
                <div key={topic.topicId} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{topic.topicName}</span>
                    <span
                      className={
                        topic.accuracy >= 75
                          ? 'text-emerald-400'
                          : topic.accuracy >= 50
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }
                    >
                      {Math.round(topic.accuracy)}% ({topic.correctCount}/{topic.totalQuestions})
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        topic.accuracy >= 75
                          ? 'bg-emerald-500'
                          : topic.accuracy >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Lost Insight */}
          {slowQuestionsCount > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <strong>Time Lost Insight:</strong> {slowQuestionsCount} questions took &gt; 1.5x expected solving time. Practice faster elimination on these topics.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question-by-Question Deep Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Question-Level Solution Review</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze why choices are correct, common exam traps, formulas, and shortcut tricks.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setActiveFilter('INCORRECT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'INCORRECT'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-red-400 hover:bg-slate-700'
              }`}
            >
              Incorrect ({session.totalIncorrect})
            </button>
            <button
              onClick={() => setActiveFilter('SKIPPED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'SKIPPED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              }`}
            >
              Skipped ({session.totalSkipped})
            </button>
            <button
              onClick={() => setActiveFilter('SLOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'SLOW'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
              }`}
            >
              Speed Issue ({slowQuestionsCount})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isExpanded = Boolean(expandedQuestions[q.id]);
            const isCorrect = q.isCorrect === true;
            const isIncorrect = q.isCorrect === false;

            return (
              <div
                key={q.id}
                className={`border rounded-2xl transition-all overflow-hidden ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-slate-950/40'
                    : isIncorrect
                    ? 'border-red-500/30 bg-slate-950/40'
                    : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                {/* Question Summary Bar */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-white flex items-center justify-center">
                      {q.sequenceOrder}
                    </span>
                    {isCorrect ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (+{q.marksAwarded})</span>
                      </span>
                    ) : isIncorrect ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrect ({q.marksAwarded})</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                        Skipped (0.0)
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium hidden md:inline">
                      {q.subjectName} • {q.topicName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{q.timeTakenSeconds}s</span>
                      <span className="text-slate-600">/ {q.avgExpectedSeconds}s</span>
                    </div>

                    {q.isTimeDeficient && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Speed Issue
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Question Details & Detailed Explanation */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-800/80 space-y-5">
                    {/* Question Text */}
                    <div className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                      <FormulaRenderer content={q.questionText} />
                    </div>

                    {/* Options Comparison */}
                    {q.options.length > 0 && (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isCandidateChoice = Array.isArray(q.candidateAnswer)
                            ? q.candidateAnswer.includes(opt.id)
                            : q.candidateAnswer === opt.id;

                          const isActualCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(opt.id)
                            : q.correctAnswer === opt.id;

                          let badgeColor = 'bg-slate-900 border-slate-800 text-slate-400';
                          if (isActualCorrect) {
                            badgeColor = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold';
                          } else if (isCandidateChoice && !isActualCorrect) {
                            badgeColor = 'bg-red-950/40 border-red-500 text-red-300 line-through';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${badgeColor}`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <span className="font-mono font-bold w-6 text-center">({opt.id})</span>
                                <div><FormulaRenderer content={opt.text} /></div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isCandidateChoice && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300">
                                    Your Choice
                                  </span>
                                )}
                                {isActualCorrect && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Step-by-Step Detailed Explanation */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                        <span>Step-by-Step Explanation & Concept</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                        <FormulaRenderer content={q.explanation} />
                      </div>

                      {q.formulaConcept && (
                        <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-lg text-xs text-indigo-200">
                          <strong className="text-indigo-400 block mb-1">Governing Formula / Concept:</strong>
                          <FormulaRenderer content={q.formulaConcept} />
                        </div>
                      )}

                      {q.shortcutTrick && (
                        <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-200">
                          <strong className="text-amber-400 block mb-1">⚡ Exam Shortcut Trick:</strong>
                          <FormulaRenderer content={q.shortcutTrick} />
                        </div>
                      )}

                      {q.commonMistake && (
                        <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-lg text-xs text-red-200">
                          <strong className="text-red-400 block mb-1">⚠️ Common Trap / Frequent Slip:</strong>
                          <FormulaRenderer content={q.commonMistake} />
                        </div>
                      )}
                    </div>

                    {/* 1-Click Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center space-x-2">
                        {isIncorrect && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-400 mr-1">Log Mistake As:</span>
                            {['CALCULATION', 'CONCEPTUAL', 'SILLY', 'TIME_MANAGEMENT'].map((mType) => (
                              <button
                                key={mType}
                                onClick={() => handleLogMistake(q.id, mType)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 uppercase transition-colors"
                              >
                                {mType.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleBookmark(q.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Bookmark</span>
                        </button>
                        <button
                          onClick={() => setSelectedAIDoubtQ({ id: q.id, text: q.questionText })}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 flex items-center space-x-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Ask AI Doubt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Doubt Modal */}
      {selectedAIDoubtQ && (
        <AIDoubtSolverModal
          questionId={selectedAIDoubtQ.id}
          questionText={selectedAIDoubtQ.text}
          isOpen={Boolean(selectedAIDoubtQ)}
          onClose={() => setSelectedAIDoubtQ(null)}
        />
      )}
    </div>
  );
};
