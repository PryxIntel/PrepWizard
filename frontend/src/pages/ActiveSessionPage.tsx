import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../api/client.js';
import { ActiveSessionData, QuestionStatus } from '../types/index.js';
import { QuestionFiringEngine } from '../components/exam/QuestionFiringEngine.js';
import { QuestionPalette } from '../components/exam/QuestionPalette.js';
import { AIDoubtSolverModal } from '../components/ai/AIDoubtSolverModal.js';
import {
  Clock,
  Maximize,
  Minimize,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  WifiOff,
  FileText,
  X,
} from 'lucide-react';
import { FormulaRenderer } from '../components/common/FormulaRenderer.js';

interface ActiveSessionPageProps {
  sessionId: string;
  onFinishTest: (sessionId: string) => void;
  onExit: () => void;
}

export const ActiveSessionPage: React.FC<ActiveSessionPageProps> = ({
  sessionId,
  onFinishTest,
  onExit,
}) => {
  const [data, setData] = useState<ActiveSessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(1800);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState<boolean>(false);
  const [aiDoubtOpen, setAIDoubtOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSession();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sessionId]);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const res: ActiveSessionData = await ApiClient.getSessionState(sessionId);
      const initialIdx = res.session.currentQuestionIndex || 0;
      
      // Auto-mark first visited question as NOT_ANSWERED if NOT_VISITED
      if (res.questions.length > 0 && res.questions[initialIdx].status === 'NOT_VISITED') {
        res.questions[initialIdx].status = 'NOT_ANSWERED';
        if (res.palette[initialIdx]) res.palette[initialIdx].status = 'NOT_ANSWERED';
      }

      setData(res);
      setCurrentIndex(initialIdx);
      setExamTimeRemaining(res.session.timeRemainingSeconds);

      // Start authoritative exam countdown
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinalSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to load test session');
      onExit();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuestion = (newIndex: number) => {
    if (!data || newIndex < 0 || newIndex >= data.questions.length) return;
    const targetQ = data.questions[newIndex];
    if (targetQ.status === 'NOT_VISITED') {
      const updatedQuestions = [...data.questions];
      updatedQuestions[newIndex] = { ...targetQ, status: 'NOT_ANSWERED' };
      const updatedPalette = [...data.palette];
      updatedPalette[newIndex] = { ...updatedPalette[newIndex], status: 'NOT_ANSWERED' };
      setData({ ...data, questions: updatedQuestions, palette: updatedPalette });
    }
    setCurrentIndex(newIndex);
  };

  const handleAnswerSubmit = async (
    candidateAnswer: any,
    timeTakenSeconds: number,
    markForReview: boolean
  ) => {
    if (!data) return;
    const currentQ = data.questions[currentIndex];

    // Optimistically update local palette and status
    const newStatus: QuestionStatus = markForReview
      ? candidateAnswer ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW'
      : candidateAnswer ? 'ANSWERED' : 'NOT_ANSWERED';

    const updatedPalette = [...data.palette];
    updatedPalette[currentIndex] = {
      ...updatedPalette[currentIndex],
      status: newStatus,
      isAnswered: Boolean(candidateAnswer),
      candidateAnswer,
      timeTakenSeconds,
    };

    const updatedQuestions = [...data.questions];
    updatedQuestions[currentIndex] = {
      ...updatedQuestions[currentIndex],
      status: newStatus,
      candidateAnswer,
      timeTakenSeconds,
    };

    setData({
      ...data,
      palette: updatedPalette,
      questions: updatedQuestions,
    });

    try {
      await ApiClient.submitAnswer(sessionId, {
        sequenceOrder: currentQ.sequenceOrder,
        candidateAnswer,
        timeTakenSeconds,
        markForReview,
      });
    } catch (err) {
      console.warn('Answer queued offline');
    }
  };

  const handleNext = () => {
    if (!data) return;
    if (currentIndex < data.questions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!data) return;
    if (currentIndex > 0) {
      handleSelectQuestion(currentIndex - 1);
    }
  };

  const handleSkip = async () => {
    if (!data) return;
    const currentQ = data.questions[currentIndex];
    const newStatus: QuestionStatus = currentQ.candidateAnswer ? 'ANSWERED' : 'NOT_ANSWERED';

    const updatedQuestions = [...data.questions];
    updatedQuestions[currentIndex].status = newStatus;
    const updatedPalette = [...data.palette];
    updatedPalette[currentIndex].status = newStatus;
    setData({ ...data, questions: updatedQuestions, palette: updatedPalette });

    try {
      await ApiClient.updateStatus(sessionId, {
        sequenceOrder: currentQ.sequenceOrder,
        action: 'SKIP',
      });
    } catch (e) {}
  };

  const handleMarkReview = async () => {
    if (!data) return;
    const currentQ = data.questions[currentIndex];
    const newStatus: QuestionStatus = currentQ.candidateAnswer ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';

    const updatedQuestions = [...data.questions];
    updatedQuestions[currentIndex].status = newStatus;
    const updatedPalette = [...data.palette];
    updatedPalette[currentIndex].status = newStatus;
    setData({ ...data, questions: updatedQuestions, palette: updatedPalette });

    try {
      await ApiClient.updateStatus(sessionId, {
        sequenceOrder: currentQ.sequenceOrder,
        action: 'MARK_REVIEW',
      });
    } catch (e) {}
  };

  const handleClear = async () => {
    if (!data) return;
    const currentQ = data.questions[currentIndex];
    const updatedQuestions = [...data.questions];
    updatedQuestions[currentIndex].candidateAnswer = null;
    updatedQuestions[currentIndex].status = 'NOT_ANSWERED';

    const updatedPalette = [...data.palette];
    updatedPalette[currentIndex] = {
      ...updatedPalette[currentIndex],
      candidateAnswer: null,
      status: 'NOT_ANSWERED',
      isAnswered: false,
    };

    setData({ ...data, questions: updatedQuestions, palette: updatedPalette });

    try {
      await ApiClient.updateStatus(sessionId, {
        sequenceOrder: currentQ.sequenceOrder,
        action: 'CLEAR',
      });
    } catch (e) {}
  };

  const handleBookmark = async () => {
    if (!data) return;
    const currentQ = data.questions[currentIndex];
    try {
      await ApiClient.createBookmark({
        questionId: currentQ.question.id,
        category: 'IMPORTANT',
      });
      alert('Question bookmarked in your digital library!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinalSubmit = async (autoExpire = false) => {
    setIsSubmitting(true);
    try {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      await ApiClient.submitTest(sessionId);
      onFinishTest(sessionId);
    } catch (err: any) {
      alert(err.message || 'Error submitting test');
      setIsSubmitting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatExamTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? `${h < 10 ? '0' : ''}${h}:` : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Entering secure examination environment...</p>
        </div>
      </div>
    );
  }

  const currentQ = data.questions[currentIndex];
  const sections = Array.from(new Set(data.questions.map((q) => q.sectionName)));
  const isRapidFire = data.session.mode === 'RAPID_FIRE';
  const perQuestionTime = data.session.config.perQuestionTime || 30;

  // Counts for confirmation modal
  const answeredCount = data.palette.filter((p) => p.status === 'ANSWERED' || p.status === 'ANSWERED_AND_MARKED').length;
  const markedCount = data.palette.filter((p) => p.status === 'MARKED_FOR_REVIEW' || p.status === 'ANSWERED_AND_MARKED').length;
  const notAnsweredCount = data.palette.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none">
      {/* Network Offline Warning Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline mode active: Your timer and answers are saved locally and will auto-sync.</span>
        </div>
      )}

      {/* CBT Exam Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-extrabold text-white tracking-tight">
            Prep<span className="text-indigo-400">Wizard</span> CBT
          </span>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">|</span>
          <span className="text-xs font-bold text-slate-300 hidden md:inline">
            {data.session.title}
          </span>
        </div>

        {/* Center: Overall Authoritative Exam Timer */}
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-700 shadow-inner font-mono">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400 font-semibold">TIME LEFT:</span>
          <span
            className={`text-sm font-bold ${
              examTimeRemaining <= 300 ? 'text-red-400 timer-critical' : 'text-white'
            }`}
          >
            {formatExamTimer(examTimeRemaining)}
          </span>
        </div>

        {/* Right Controls: Question Paper, AI Doubt, Fullscreen, Submit Test */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowQuestionPaperModal(true)}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Question Paper</span>
          </button>

          <button
            onClick={() => setAIDoubtOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition-colors"
            title="Ask AI Doubt Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Doubt</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-850 text-slate-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Main Examination Workspace: Split Screen */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Left 3 Columns: Active Question Firing Engine */}
        <div className="lg:col-span-3 h-[calc(100vh-5rem)]">
          <QuestionFiringEngine
            question={currentQ.question}
            sequenceOrder={currentQ.sequenceOrder}
            totalQuestions={data.questions.length}
            initialAnswer={currentQ.candidateAnswer}
            status={currentQ.status}
            perQuestionTimeSeconds={perQuestionTime}
            isRapidFire={isRapidFire}
            onAnswerSubmit={handleAnswerSubmit}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onMarkReview={handleMarkReview}
            onClear={handleClear}
            onOpenAIDoubt={() => setAIDoubtOpen(true)}
            onBookmark={handleBookmark}
            onSubmitPrompt={() => setShowSubmitModal(true)}
          />
        </div>

        {/* Right 1 Column: TCS iON Question Palette & Section Navigation */}
        <div className="hidden lg:block lg:col-span-1 h-[calc(100vh-5rem)]">
          <QuestionPalette
            palette={data.palette}
            currentIndex={currentIndex}
            onSelectQuestion={(idx) => handleSelectQuestion(idx)}
            sections={sections}
            activeSection={activeSection}
            onSelectSection={(sec) => setActiveSection(sec)}
          />
        </div>
      </main>

      {/* Submit Test Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {currentIndex === data.questions.length - 1
                    ? 'Final Question Reached — Ready to Submit?'
                    : 'Submit Examination Session'}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentIndex === data.questions.length - 1
                    ? 'You have completed the question paper. Review your summary below.'
                    : 'Review your attempt status before final submission.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Total Questions:</span>
                <span className="text-white font-mono font-bold">{data.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400 font-semibold">Answered:</span>
                <span className="text-emerald-400 font-mono font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-400 font-semibold">Not Answered:</span>
                <span className="text-orange-400 font-mono font-bold">{notAnsweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400 font-semibold">Marked for Review:</span>
                <span className="text-purple-400 font-mono font-bold">{markedCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Once submitted, your responses will be scored immediately under official exam marking rules, and full step-by-step solutions, formulas, and 4-quadrant speed diagnostics will be generated.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Review Responses
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Scoring & Analyzing...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Overview Modal */}
      {showQuestionPaperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Full Question Paper Overview</h3>
              </div>
              <button
                onClick={() => setShowQuestionPaperModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {data.questions.map((q, idx) => (
                <div
                  key={q.sequenceOrder}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span>Question {q.sequenceOrder} ({q.question.marks} Mark)</span>
                    <span className="text-slate-400">{q.sectionName}</span>
                  </div>
                  <div className="text-sm text-slate-200">
                    <FormulaRenderer content={q.question.questionText} />
                  </div>
                  {q.question.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-400">
                      {q.question.options.map((opt) => (
                        <div key={opt.id} className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-500">({opt.id})</span>
                          <span><FormulaRenderer content={opt.text} /></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Doubt Modal */}
      <AIDoubtSolverModal
        questionId={currentQ.question.id}
        questionText={currentQ.question.questionText}
        isOpen={aiDoubtOpen}
        onClose={() => setAIDoubtOpen(false)}
      />
    </div>
  );
};
