import React from 'react';
import { PaletteItem, QuestionStatus } from '../../types/index.js';

interface QuestionPaletteProps {
  palette: PaletteItem[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  sections: string[];
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  palette,
  currentIndex,
  onSelectQuestion,
  sections,
  activeSection,
  onSelectSection,
}) => {
  // Compute counts
  const counts = {
    answered: palette.filter((p) => p.status === 'ANSWERED').length,
    notAnswered: palette.filter((p) => p.status === 'NOT_ANSWERED').length,
    notVisited: palette.filter((p) => p.status === 'NOT_VISITED').length,
    marked: palette.filter((p) => p.status === 'MARKED_FOR_REVIEW').length,
    markedAnswered: palette.filter((p) => p.status === 'ANSWERED_AND_MARKED').length,
  };

  const getStatusClass = (status: QuestionStatus) => {
    switch (status) {
      case 'ANSWERED':
        return 'bg-emerald-600 text-white hover:bg-emerald-500 font-semibold';
      case 'NOT_ANSWERED':
        return 'bg-orange-600 text-white hover:bg-orange-500 font-semibold';
      case 'MARKED_FOR_REVIEW':
        return 'bg-purple-600 text-white hover:bg-purple-500 rounded-full font-semibold';
      case 'ANSWERED_AND_MARKED':
        return 'bg-purple-600 text-white hover:bg-purple-500 rounded-full relative after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-emerald-400 after:rounded-full after:ring-1 after:ring-white font-semibold';
      case 'NOT_VISITED':
      default:
        return 'bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium';
    }
  };

  const filteredPalette = activeSection === 'ALL'
    ? palette
    : palette.filter((p) => p.sectionName === activeSection);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-xl">
      <div className="border-b border-slate-800 pb-3 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
          Question Palette
        </h3>

        {/* Section Tabs */}
        {sections.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              onClick={() => onSelectSection('ALL')}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                activeSection === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All ({palette.length})
            </button>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => onSelectSection(sec)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  activeSection === sec
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        )}

        {/* Legend Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-emerald-600 text-white rounded text-[10px] font-bold">
              {counts.answered}
            </span>
            <span className="text-slate-400 text-[11px]">Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-orange-600 text-white rounded text-[10px] font-bold">
              {counts.notAnswered}
            </span>
            <span className="text-slate-400 text-[11px]">Not Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-300 rounded text-[10px] font-bold">
              {counts.notVisited}
            </span>
            <span className="text-slate-400 text-[11px]">Not Visited</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-purple-600 text-white rounded-full text-[10px] font-bold">
              {counts.marked}
            </span>
            <span className="text-slate-400 text-[11px]">Marked Review</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2">
            <span className="w-5 h-5 flex items-center justify-center bg-purple-600 text-white rounded-full relative after:absolute after:bottom-0 after:right-0 after:w-1.5 after:h-1.5 after:bg-emerald-400 after:rounded-full text-[10px] font-bold">
              {counts.markedAnswered}
            </span>
            <span className="text-slate-400 text-[11px]">Ans & Marked (Evaluated)</span>
          </div>
        </div>
      </div>

      {/* Grid of Question Numbers */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-5 gap-2">
          {filteredPalette.map((item) => {
            const isCurrent = item.sequenceOrder - 1 === currentIndex;
            return (
              <button
                key={item.sequenceOrder}
                onClick={() => onSelectQuestion(item.sequenceOrder - 1)}
                className={`h-9 text-xs rounded transition-all flex items-center justify-center shadow-sm relative ${getStatusClass(
                  item.status
                )} ${
                  isCurrent
                    ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-105 z-10'
                    : ''
                }`}
                title={`Q${item.sequenceOrder}: ${item.status}`}
              >
                {item.sequenceOrder < 10 ? `0${item.sequenceOrder}` : item.sequenceOrder}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
