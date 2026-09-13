import React, { useState, useEffect, useRef } from 'react';
import { SafeQuestion, QuestionStatus } from '../../types/index.js';
import { FormulaRenderer } from '../common/FormulaRenderer.js';
import { Clock, AlertCircle, Bookmark as BookmarkIcon, CheckCircle2, ChevronRight, ChevronLeft, Flag } from 'lucide-react';

interface QuestionFiringEngineProps {
  question: SafeQuestion;
  sequenceOrder: number;
  totalQuestions: number;
  initialAnswer: any;
  status: QuestionStatus;
  perQuestionTimeSeconds?: number;
  isRapidFire?: boolean;
  onAnswerSubmit: (answer: any, timeTakenSeconds: number, markForReview: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onMarkReview: () => void;
  onClear: () => void;
  onOpenAIDoubt: () => void;
  onBookmark: () => void;
  onSubmitPrompt: () => void;
  isBookmarked?: boolean;
}

const normalizeMCQSelection = (ans: any): string | null => {
  if (ans === null || ans === undefined || ans === '') return null;
  if (Array.isArray(ans)) return ans.length > 0 && ans[0] !== null && ans[0] !== undefined ? String(ans[0]).trim() : null;
  return String(ans).trim();
};

const normalizeMSQSelection = (ans: any): string[] => {
  if (ans === null || ans === undefined) return [];
  if (Array.isArray(ans)) return ans.map((item) => String(item).trim()).filter(Boolean);
  const s = String(ans).trim();
  return s ? [s] : [];
};

const normalizeNATSelection = (ans: any): string => {
  if (ans === null || ans === undefined) return '';
  if (Array.isArray(ans)) return ans.length > 0 ? String(ans[0]) : '';
  return String(ans);
};

export const QuestionFiringEngine: React.FC<QuestionFiringEngineProps> = ({
  question,
  sequenceOrder,
  totalQuestions,
  initialAnswer,
  status,
  perQuestionTimeSeconds = 30,
  isRapidFire = false,
  onAnswerSubmit,
  onNext,
  onPrevious,
  onSkip,
  onMarkReview,
  onClear,
  onOpenAIDoubt,
  onBookmark,
  onSubmitPrompt,
  isBookmarked = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(() => normalizeMCQSelection(initialAnswer));
  const [msqSelections, setMsqSelections] = useState<string[]>(() => normalizeMSQSelection(initialAnswer));
  const [natAnswer, setNatAnswer] = useState<string>(() => normalizeNATSelection(initialAnswer));
  
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState<number>(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(perQuestionTimeSeconds);
  const [showTimeUpNotice, setShowTimeUpNotice] = useState<boolean>(false);

  const prevQuestionIdRef = useRef<string>(question.id);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLastQuestion = sequenceOrder === totalQuestions;

  // Sync state on question change or external answer reset
  useEffect(() => {
    const isDifferentQuestion = prevQuestionIdRef.current !== question.id;
    prevQuestionIdRef.current = question.id;

    setSelectedOption(normalizeMCQSelection(initialAnswer));
    setMsqSelections(normalizeMSQSelection(initialAnswer));
    setNatAnswer(normalizeNATSelection(initialAnswer));

    if (isDifferentQuestion) {
      setQuestionTimeElapsed(0);
      setQuestionTimeLeft(perQuestionTimeSeconds);
      setShowTimeUpNotice(false);
    }
  }, [question.id, initialAnswer, perQuestionTimeSeconds]);

  // Per-question countdown and elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setQuestionTimeElapsed((prev) => prev + 1);

      if (isRapidFire && perQuestionTimeSeconds > 0) {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUpAutoAdvance();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRapidFire, perQuestionTimeSeconds, question.id, isLastQuestion]);

  const handleTimeUpAutoAdvance = () => {
    setShowTimeUpNotice(true);
    setTimeout(() => {
      getCurrentAnswerAndSubmit(false);
      if (isLastQuestion) {
        onSubmitPrompt();
      } else {
        onNext();
      }
      setShowTimeUpNotice(false);
    }, 1200);
  };

  const getCurrentAnswerAndSubmit = (markForReview = false) => {
    let answerToSubmit = null;
    if (question.questionType === 'MCQ' || question.questionType === 'ASSERTION_REASON') {
      answerToSubmit = selectedOption ? [selectedOption] : null;
    } else if (question.questionType === 'MSQ') {
      answerToSubmit = msqSelections.length > 0 ? msqSelections : null;
    } else if (question.questionType === 'NAT') {
      answerToSubmit = natAnswer.trim() !== '' ? natAnswer.trim() : null;
    }

    onAnswerSubmit(answerToSubmit, questionTimeElapsed, markForReview);
  };

  const handleSelectOption = (optId: string) => {
    const normalizedId = String(optId).trim();
    setSelectedOption(normalizedId);
    onAnswerSubmit([normalizedId], questionTimeElapsed, status === 'MARKED_FOR_REVIEW' || status === 'ANSWERED_AND_MARKED');
  };

  const toggleMSQ = (id: string) => {
    const normalizedId = String(id).trim();
    const updated = msqSelections.includes(normalizedId)
      ? msqSelections.filter((item) => item !== normalizedId)
      : [...msqSelections, normalizedId];
    setMsqSelections(updated);
    onAnswerSubmit(updated.length > 0 ? updated : null, questionTimeElapsed, status === 'MARKED_FOR_REVIEW' || status === 'ANSWERED_AND_MARKED');
  };

  const handleNatChange = (val: string) => {
    setNatAnswer(val);
    onAnswerSubmit(val.trim() !== '' ? val.trim() : null, questionTimeElapsed, status === 'MARKED_FOR_REVIEW' || status === 'ANSWERED_AND_MARKED');
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter') {
          getCurrentAnswerAndSubmit(false);
          if (isLastQuestion) {
            onSubmitPrompt();
          } else {
            onNext();
          }
        }
        return;
      }

      const key = e.key.toUpperCase();

      if (question.questionType === 'MCQ' || question.questionType === 'ASSERTION_REASON') {
        if (key === 'A' || key === '1') {
          const opt = question.options.find((o) => o.id === 'A' || o.id === '1') || question.options[0];
          if (opt) handleSelectOption(String(opt.id));
        } else if (key === 'B' || key === '2') {
          const opt = question.options.find((o) => o.id === 'B' || o.id === '2') || question.options[1];
          if (opt) handleSelectOption(String(opt.id));
        } else if (key === 'C' || key === '3') {
          const opt = question.options.find((o) => o.id === 'C' || o.id === '3') || question.options[2];
          if (opt) handleSelectOption(String(opt.id));
        } else if (key === 'D' || key === '4') {
          const opt = question.options.find((o) => o.id === 'D' || o.id === '4') || question.options[3];
          if (opt) handleSelectOption(String(opt.id));
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        getCurrentAnswerAndSubmit(false);
        if (isLastQuestion) {
          onSubmitPrompt();
        } else {
          onNext();
        }
      } else if (key === 'N') {
        e.preventDefault();
        if (isLastQuestion) {
          onSubmitPrompt();
        } else {
          onNext();
        }
      } else if (key === 'P') {
        e.preventDefault();
        onPrevious();
      } else if (key === 'R') {
        e.preventDefault();
        getCurrentAnswerAndSubmit(true);
        if (isLastQuestion) {
          onSubmitPrompt();
        } else {
          onNext();
        }
      } else if (key === 'S') {
        e.preventDefault();
        onSkip();
        if (!isLastQuestion) onNext();
      } else if (key === 'C') {
        e.preventDefault();
        setSelectedOption(null);
        setMsqSelections([]);
        setNatAnswer('');
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, selectedOption, msqSelections, natAnswer, questionTimeElapsed, isLastQuestion]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const timerPct = perQuestionTimeSeconds > 0 ? (questionTimeLeft / perQuestionTimeSeconds) * 100 : 100;
  const isUrgent = isRapidFire && questionTimeLeft <= 7;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Time Up Notification Overlay */}
      {showTimeUpNotice && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-center max-w-sm animate-bounce">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-extrabold text-white tracking-wide">TIME UP!</h3>
            <p className="text-sm text-red-200 mt-1">
              {isLastQuestion ? 'Submitting completed test...' : 'Moving to next question...'}
            </p>
          </div>
        </div>
      )}

      {/* Header with question metadata & countdown bar */}
      <div className="bg-slate-950/80 px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold font-mono">
            QUESTION {sequenceOrder < 10 ? `0${sequenceOrder}` : sequenceOrder} / {totalQuestions}
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {question.subjectName} • {question.topicName}
          </span>
          {question.isPYQ && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              {question.year} PYQ {question.shift ? `(${question.shift})` : ''}
            </span>
          )}
          {question.isAIGenerated && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              AI GENERATED
            </span>
          )}
        </div>

        {/* Right Header Controls: Question Marks, Timing & Bookmark */}
        <div className="flex items-center space-x-3">
          <div className="text-xs text-slate-400">
            Marks: <span className="text-emerald-400 font-bold">+{question.marks}</span>
            {question.negativeMarks > 0 && (
              <span className="text-red-400 font-bold ml-1.5">-{question.negativeMarks}</span>
            )}
          </div>

          {isRapidFire ? (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border font-mono font-bold text-xs ${
                isUrgent
                  ? 'bg-red-500/20 border-red-500 text-red-400 timer-critical'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>TIME LEFT: {formatTimer(questionTimeLeft)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTimer(questionTimeElapsed)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onBookmark}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Bookmark this question"
          >
            <BookmarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rapid Fire Progress Bar */}
      {isRapidFire && (
        <div className="w-full bg-slate-800 h-1">
          <div
            className={`h-1 transition-all duration-1000 ${
              isUrgent ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      {/* Question Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="text-base md:text-lg font-medium text-slate-100 leading-relaxed">
          <FormulaRenderer content={question.questionText} />
        </div>

        {/* Options Rendering */}
        {question.questionType === 'MCQ' || question.questionType === 'ASSERTION_REASON' ? (
          <div className="space-y-3 pt-2">
            {question.options.map((opt) => {
              const optIdStr = String(opt.id).trim();
              const isSelected = selectedOption === optIdStr;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(optIdStr)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60 active:bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold font-mono transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 group-hover:border-slate-600 group-hover:text-slate-200'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <div className="flex-1 pt-0.5 text-sm md:text-base leading-relaxed text-slate-200">
                    <FormulaRenderer content={opt.text} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : question.questionType === 'MSQ' ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs text-amber-400 font-semibold mb-2 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Multiple Choice / Multiple Correct (MSQ): Select ALL correct options.</span>
            </div>
            {question.options.map((opt) => {
              const optIdStr = String(opt.id).trim();
              const isSelected = msqSelections.includes(optIdStr);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMSQ(optIdStr)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60 active:bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold font-mono transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 group-hover:border-slate-600 group-hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? '✓' : opt.id}
                  </span>
                  <div className="flex-1 pt-0.5 text-sm md:text-base leading-relaxed text-slate-200">
                    <FormulaRenderer content={opt.text} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Numerical Answer Type (NAT) */
          <div className="pt-4 space-y-4 max-w-md">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enter Numerical Answer (Round off as applicable)
            </label>
            <input
              type="text"
              value={natAnswer}
              onChange={(e) => handleNatChange(e.target.value)}
              placeholder="e.g. 14.5 or -2.3"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono text-white focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <p className="text-xs text-slate-500">
              Virtual numeric keypad is supported. NAT questions carry no negative marks in official exams.
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation Controls */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left Actions: Clear, Mark for Review, Skip */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setSelectedOption(null);
              setMsqSelections([]);
              setNatAnswer('');
              onClear();
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Clear Response (C)
          </button>
          <button
            type="button"
            onClick={() => {
              getCurrentAnswerAndSubmit(true);
              if (isLastQuestion) {
                onSubmitPrompt();
              } else {
                onNext();
              }
            }}
            className="px-3.5 py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isLastQuestion ? 'Mark & Submit Test (R)' : 'Mark for Review & Next (R)'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSkip();
              if (isLastQuestion) {
                onSubmitPrompt();
              } else {
                onNext();
              }
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Skip (S)
          </button>
        </div>

        {/* Right Actions: Previous, Save & Next OR Save & Submit */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={sequenceOrder <= 1}
            className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous (P)</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              getCurrentAnswerAndSubmit(false);
              if (isLastQuestion) {
                onSubmitPrompt();
              } else {
                onNext();
              }
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              isLastQuestion
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            <span>{isLastQuestion ? 'Save & Submit Test' : 'Save & Next'}</span>
            {isLastQuestion ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
