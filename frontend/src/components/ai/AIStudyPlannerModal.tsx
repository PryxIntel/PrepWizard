import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client.js';
import { Calendar, X, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

interface AIStudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIStudyPlannerModal: React.FC<AIStudyPlannerModalProps> = ({ isOpen, onClose }) => {
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      ApiClient.getStudyPlan()
        .then((data) => {
          setPlan(data);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Adaptive 30-Day Study Planner</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  AI GENERATED
                </span>
              </div>
              <p className="text-xs text-slate-400">Synthesized from your mock results, target score & daily study goal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Generating your high-yield 30-day exam roadmap...</p>
            </div>
          ) : plan ? (
            <>
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
                  Strategy Overview
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">{plan.overview}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phased 4-Week Milestone Roadmap
                </h4>
                {plan.weeklyPhases.map((phase: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>{phase.week}</span>
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        Phase {index + 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong className="text-slate-400">Core Focus:</strong> {phase.focus}
                    </p>
                    <p className="text-xs text-indigo-200/90 font-medium">
                      <strong className="text-slate-400">Daily Target:</strong> {phase.dailyGoal}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Could not load study plan.</p>
          )}
        </div>
      </div>
    </div>
  );
};
