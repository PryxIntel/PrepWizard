import React from 'react';
import { SpeedAccuracyQuadrant } from '../../types/index.js';
import { Zap, Target, AlertTriangle, HelpCircle } from 'lucide-react';

interface SpeedAccuracyMatrixProps {
  data: SpeedAccuracyQuadrant;
}

export const SpeedAccuracyMatrix: React.FC<SpeedAccuracyMatrixProps> = ({ data }) => {
  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'FAST_AND_ACCURATE':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'SLOW_AND_ACCURATE':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      case 'FAST_AND_INACCURATE':
        return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
      case 'SLOW_AND_INACCURATE':
      default:
        return 'text-red-400 border-red-500/40 bg-red-500/10';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span>Speed vs. Accuracy Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostic placement based on {data.totalQuestions} questions attempted (Avg: {data.avgTimeSec}s, Accuracy: {data.accuracyPercent}%)
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${getQuadrantColor(data.quadrant)}`}>
          {data.description}
        </div>
      </div>

      {/* 2x2 Quadrant Visual Grid */}
      <div className="relative border border-slate-800 rounded-xl p-4 bg-slate-950/60 my-6">
        <div className="grid grid-cols-2 gap-3 h-52">
          {/* Top Left: Fast & Accurate */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
              data.quadrant === 'FAST_AND_ACCURATE'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
                : 'bg-slate-900/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <Target className="w-3.5 h-3.5" />
                <span>Fast & Accurate</span>
              </span>
              <span className="text-[10px] text-emerald-500/80 font-mono">Q1 (Elite)</span>
            </div>
            <p className="text-[11px] text-slate-400">High speed, high accuracy. Top percentile candidate zone.</p>
          </div>

          {/* Top Right: Slow & Accurate */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
              data.quadrant === 'SLOW_AND_ACCURATE'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50'
                : 'bg-slate-900/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                <Target className="w-3.5 h-3.5" />
                <span>Slow & Accurate</span>
              </span>
              <span className="text-[10px] text-amber-500/80 font-mono">Q2 (Thorough)</span>
            </div>
            <p className="text-[11px] text-slate-400">Concepts are clear, but slow speed causes lost questions.</p>
          </div>

          {/* Bottom Left: Fast & Inaccurate */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
              data.quadrant === 'FAST_AND_INACCURATE'
                ? 'bg-orange-950/40 border-orange-500 shadow-lg shadow-orange-950/50'
                : 'bg-slate-900/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Fast & Inaccurate</span>
              </span>
              <span className="text-[10px] text-orange-500/80 font-mono">Q3 (Impulsive)</span>
            </div>
            <p className="text-[11px] text-slate-400">Rushing creates heavy negative marks. Needs patience.</p>
          </div>

          {/* Bottom Right: Slow & Inaccurate */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
              data.quadrant === 'SLOW_AND_INACCURATE'
                ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-950/50'
                : 'bg-slate-900/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Slow & Inaccurate</span>
              </span>
              <span className="text-[10px] text-red-500/80 font-mono">Q4 (Struggling)</span>
            </div>
            <p className="text-[11px] text-slate-400">Requires foundational concept revision before full mocks.</p>
          </div>
        </div>
      </div>

      {/* Actionable Recommendation */}
      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
          Targeted Recommendation
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {data.recommendation}
        </p>
      </div>
    </div>
  );
};
