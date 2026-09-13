import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { RevisionCard } from '../types/index.js';
import { FormulaRenderer } from '../components/common/FormulaRenderer.js';
import { Clock, CheckCircle2, Eye, Award, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RevisionPage: React.FC = () => {
  const [cards, setCards] = useState<RevisionCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDone, setIsDone] = useState<boolean>(false);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getDueRevisions();
      setCards(res.cards || []);
      setCurrentIdx(0);
      setRevealed(false);
      setIsDone(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (quality: number) => {
    if (!currentCard) return;
    try {
      await ApiClient.submitReview({
        cardId: currentCard.id,
        quality,
      });

      if (currentIdx + 1 < cards.length) {
        setCurrentIdx(currentIdx + 1);
        setRevealed(false);
      } else {
        setIsDone(true);
        confetti({ particleCount: 70, spread: 60 });
      }
    } catch (e) {
      alert('Error updating revision schedule');
    }
  };

  const currentCard = cards[currentIdx];

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Spaced Repetition Engine (SM-2)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Today&apos;s Revision Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimized interval recall: Questions resurface after 1, 3, 7, 14, and 30 days to cement concepts into permanent memory.
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-extrabold font-mono text-purple-300">
            {cards.length > 0 ? `${currentIdx + 1} / ${cards.length}` : '0 / 0'}
          </span>
          <span className="block text-[11px] text-slate-500">Cards Due</span>
        </div>
      </div>

      {isDone || cards.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">All Revisions Completed for Today!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Outstanding dedication. You have cleared all spaced repetition cards due for today. Next review batches will unlock automatically according to their SM-2 schedules.
          </p>
          <button
            onClick={loadDueCards}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
          >
            Check for New Cards
          </button>
        </div>
      ) : (
        /* Active Flashcard Card */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono">
                CARD #{currentIdx + 1}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentCard.question.subjectName} • {currentCard.question.topicName}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Current Interval: {currentCard.intervalDays} Days
            </span>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
            <FormulaRenderer content={currentCard.question.questionText} />
          </div>

          {/* Options */}
          {currentCard.question.options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {currentCard.question.options.map((opt) => (
                <div
                  key={opt.id}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs sm:text-sm text-slate-300 flex items-center space-x-2"
                >
                  <span className="font-mono font-bold text-slate-500 w-5">({opt.id})</span>
                  <div><FormulaRenderer content={opt.text} /></div>
                </div>
              ))}
            </div>
          )}

          {/* Solution Reveal or Button */}
          {!revealed ? (
            <div className="pt-6 border-t border-slate-800 flex justify-center">
              <button
                onClick={() => setRevealed(true)}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-xl shadow-purple-600/30 transition-all hover:scale-105"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal Answer & Concept</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-in fade-in">
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Correct Answer
                </span>
                <span className="text-sm font-mono text-emerald-200 font-bold">
                  {Array.isArray(currentCard.question.correctAnswer)
                    ? currentCard.question.correctAnswer.join(', ')
                    : currentCard.question.correctAnswer}
                </span>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                <strong className="text-indigo-400 block">Explanation:</strong>
                <FormulaRenderer content={currentCard.question.explanation} />
                {currentCard.question.formulaConcept && (
                  <div className="pt-2 text-indigo-300">
                    <strong>Formula: </strong> <FormulaRenderer content={currentCard.question.formulaConcept} />
                  </div>
                )}
              </div>

              {/* Memory Ease Rating (SuperMemo SM-2) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
                  How easily did you recall this concept?
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => handleRate(1)}
                    className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-center transition-colors"
                  >
                    <span className="text-xs font-bold block">1 • Blackout</span>
                    <span className="text-[10px] text-red-400 block mt-0.5">Reset to 1d</span>
                  </button>

                  <button
                    onClick={() => handleRate(3)}
                    className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-center transition-colors"
                  >
                    <span className="text-xs font-bold block">3 • Hard</span>
                    <span className="text-[10px] text-amber-400 block mt-0.5">Repeat soon</span>
                  </button>

                  <button
                    onClick={() => handleRate(4)}
                    className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-center transition-colors"
                  >
                    <span className="text-xs font-bold block">4 • Good</span>
                    <span className="text-[10px] text-blue-400 block mt-0.5">Standard step</span>
                  </button>

                  <button
                    onClick={() => handleRate(5)}
                    className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-center transition-colors"
                  >
                    <span className="text-xs font-bold block">5 • Easy</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">Boost interval</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
