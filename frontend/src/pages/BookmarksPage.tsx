import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { Bookmark } from '../types/index.js';
import { FormulaRenderer } from '../components/common/FormulaRenderer.js';
import { Bookmark as BookmarkIcon, Trash2, CheckCircle, Eye, EyeOff } from 'lucide-react';

export const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBookmarks();
  }, [activeCategory]);

  const loadBookmarks = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getBookmarks(activeCategory === 'ALL' ? undefined : activeCategory);
      setBookmarks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ApiClient.deleteBookmark(id);
      loadBookmarks();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'ALL', label: 'All Saved' },
    { id: 'IMPORTANT', label: 'Important' },
    { id: 'FORMULA', label: 'Formula' },
    { id: 'DIFFICULT', label: 'Difficult' },
    { id: 'TRICKY', label: 'Tricky' },
    { id: 'REVISE_LATER', label: 'Revise Later' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookmarkIcon className="w-4 h-4" />
            <span>Curated Problem Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bookmarked Questions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Save and classify high-yield problems, tricky traps, and crucial formulas for quick revision.
          </p>
        </div>
        <span className="text-xl font-mono font-bold text-amber-300 px-4 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          {bookmarks.length} Saved
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Bookmarks in this folder</h3>
          <p className="text-xs text-slate-400 mt-1">Click the bookmark icon during exams to save questions here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((b) => {
            const isRevealed = Boolean(revealedIds[b.id]);
            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {b.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {b.question.subjectName} • {b.question.topicName}
                    </span>
                    {b.question.isPYQ && (
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {b.question.year} PYQ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleReveal(b.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center space-x-1"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Hide Solution' : 'Show Solution'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-200 font-medium leading-relaxed">
                  <FormulaRenderer content={b.question.questionText} />
                </div>

                {b.note && (
                  <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200">
                    <strong>Note: </strong> {b.note}
                  </div>
                )}

                {isRevealed && (
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2 animate-in fade-in">
                    <div className="text-emerald-400 font-bold">
                      Answer: {Array.isArray(b.question.correctAnswer) ? b.question.correctAnswer.join(', ') : b.question.correctAnswer}
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">
                      <FormulaRenderer content={b.question.explanation} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
