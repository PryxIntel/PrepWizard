import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { MistakeEntry } from '../types/index.js';
import { FormulaRenderer } from '../components/common/FormulaRenderer.js';
import { BookOpen, AlertTriangle, CheckCircle, RotateCcw, Trash2, Edit3, Filter } from 'lucide-react';

interface MistakeBookPageProps {
  onStartMistakePractice: () => void;
}

export const MistakeBookPage: React.FC<MistakeBookPageProps> = ({ onStartMistakePractice }) => {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [activeType, setActiveType] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editType, setEditType] = useState<string>('CONCEPTUAL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMistakes();
  }, [activeType]);

  const loadMistakes = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (activeType !== 'ALL') params.type = activeType;
      const data = await ApiClient.getMistakes(params);
      const uniqueMap = new Map<string, MistakeEntry>();
      for (const item of data) {
        if (!uniqueMap.has(item.questionId)) {
          uniqueMap.set(item.questionId, item);
        }
      }
      setMistakes(Array.from(uniqueMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await ApiClient.updateMistake(id, {
        mistakeType: editType,
        userNotes: editNotes,
      });
      setEditingId(null);
      loadMistakes();
    } catch (e) {
      alert('Failed to update mistake log');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this question from your mistake notebook?')) return;
    try {
      await ApiClient.deleteMistake(id);
      loadMistakes();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Mistakes' },
    { id: 'CONCEPTUAL', label: 'Conceptual' },
    { id: 'CALCULATION', label: 'Calculation' },
    { id: 'SILLY', label: 'Silly / Trap' },
    { id: 'TIME_MANAGEMENT', label: 'Time Management' },
    { id: 'MISREAD', label: 'Misread Question' },
    { id: 'GUESSING', label: 'Guessing' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/20 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Digital Mistake Notebook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Learn From Every Mistake
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Automatically logged when you miss questions in test sessions. Categorize your errors to eliminate recurring calculation and conceptual traps.
          </p>
        </div>

        <button
          onClick={onStartMistakePractice}
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-600/30 transition-all hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice All Mistakes ({mistakes.length})</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveType(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeType === cat.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mistakes List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading mistake archives...</p>
        </div>
      ) : mistakes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Mistakes in this category!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Keep practicing mock exams to automatically identify and catalogue weak points.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                    {m.mistakeType.replace('_', ' ')} MISTAKE
                  </span>
                  <span className="text-xs text-slate-400">
                    {m.subjectName} • {m.topicName}
                  </span>
                  <span className="text-xs text-slate-500">
                    Logged {new Date(m.dateLogged).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(m.id);
                      setEditType(m.mistakeType);
                      setEditNotes(m.userNotes || '');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Classify or add note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm text-slate-200 font-medium leading-relaxed">
                <FormulaRenderer content={m.questionText} />
              </div>

              {/* Answer Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl">
                  <span className="text-red-400 font-bold block mb-1">Your Submitted Answer:</span>
                  <span className="text-red-200 font-mono font-semibold">
                    {Array.isArray(m.userChoice) ? m.userChoice.join(', ') : m.userChoice || 'Skipped'}
                  </span>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                  <span className="text-emerald-400 font-bold block mb-1">Correct Answer:</span>
                  <span className="text-emerald-200 font-mono font-semibold">
                    {Array.isArray(m.correctAnswer) ? m.correctAnswer.join(', ') : m.correctAnswer}
                  </span>
                </div>
              </div>

              {/* Solution & Concept */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
                <strong className="text-indigo-400 block">Why you made this mistake & correct deduction:</strong>
                <FormulaRenderer content={m.explanation} />
                {m.formulaConcept && (
                  <div className="pt-2 text-indigo-300">
                    <strong>Formula: </strong> <FormulaRenderer content={m.formulaConcept} />
                  </div>
                )}
              </div>

              {/* Personal Notes */}
              {m.userNotes && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200">
                  <strong>Personal Notes:</strong> {m.userNotes}
                </div>
              )}

              {/* Edit Modal / Inline form */}
              {editingId === m.id && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-3 pt-3">
                  <h4 className="text-xs font-bold text-white uppercase">Update Mistake Classification & Note</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Classification</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="CONCEPTUAL">Conceptual Mistake</option>
                        <option value="CALCULATION">Calculation Slip</option>
                        <option value="SILLY">Silly / Trap Mistake</option>
                        <option value="TIME_MANAGEMENT">Time-Management / Rushed</option>
                        <option value="MISREAD">Misread Question</option>
                        <option value="GUESSING">Guessing Mistake</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Your Personal Note</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="e.g. Always convert RPM to rad/s before calculating"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(m.id)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
