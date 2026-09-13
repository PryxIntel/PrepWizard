import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { Exam } from '../types/index.js';
import {
  Layers,
  Zap,
  Clock,
  BookOpen,
  Target,
  AlertTriangle,
  Play,
  CheckCircle,
  Sliders,
  ChevronRight,
  Shield,
  Calendar,
} from 'lucide-react';

interface ExamSelectPageProps {
  onStartSession: (sessionId: string) => void;
  initialMode?: string;
}

export const ExamSelectPage: React.FC<ExamSelectPageProps> = ({
  onStartSession,
  initialMode = 'REAL_EXAM',
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>(initialMode);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30); // for rapid fire
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    ApiClient.getExams()
      .then((data) => {
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const currentExam = exams.find((e) => e.id === selectedExamId);

  const practiceModes = [
    {
      id: 'REAL_EXAM',
      name: 'Real Exam CBT Simulation',
      desc: 'Official exam duration, question distribution, section tabs, and negative marking scheme.',
      icon: Shield,
      badge: 'Full CBT Simulation',
      color: 'border-indigo-500 bg-indigo-500/10 text-indigo-300',
    },
    {
      id: 'RAPID_FIRE',
      name: 'Rapid Fire Question Firing Engine',
      desc: '20–30 seconds per question with automatic question firing and response-time tracking.',
      icon: Zap,
      badge: 'Core Firing Engine',
      color: 'border-amber-500 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'TOPIC_PRACTICE',
      name: 'Topic-Wise Mastery Drill',
      desc: 'Select specific subjects and syllabus topics to master individual concepts deeply.',
      icon: Layers,
      badge: 'Targeted Syllabus',
      color: 'border-blue-500 bg-blue-500/10 text-blue-300',
    },
    {
      id: 'WEAK_AREA',
      name: 'Weak Area Recovery Mode',
      desc: 'Automatically fires questions from topics where your accuracy is historically below 60%.',
      icon: AlertTriangle,
      badge: 'AI Weakness Engine',
      color: 'border-red-500 bg-red-500/10 text-red-300',
    },
    {
      id: 'PYQ_MARATHON',
      name: 'PYQ Marathon',
      desc: 'Large continuous practice session consisting exclusively of verified previous-year questions.',
      icon: BookOpen,
      badge: '100% Authentic PYQs',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
    },
    {
      id: 'MISTAKE_PRACTICE',
      name: 'Mistake Notebook Practice',
      desc: 'Targeted re-attempt drill of questions you previously got wrong across past mock tests.',
      icon: Target,
      badge: 'Mistake Book',
      color: 'border-purple-500 bg-purple-500/10 text-purple-300',
    },
    {
      id: 'SPEED_PRACTICE',
      name: 'Speed Conditioning Drill',
      desc: 'Questions prioritizing rapid calculation and formula recall to boost your questions/hour rate.',
      icon: Clock,
      badge: 'Speed Drill',
      color: 'border-cyan-500 bg-cyan-500/10 text-cyan-300',
    },
    {
      id: 'CUSTOM_TEST',
      name: 'Custom Diagnostic Test',
      desc: 'Configure custom question counts, difficulty filters, and timing parameters.',
      icon: Sliders,
      badge: 'User Configured',
      color: 'border-slate-500 bg-slate-800 text-slate-300',
    },
  ];

  const handleStart = async () => {
    if (!selectedExamId) return;
    setIsStarting(true);
    try {
      const res = await ApiClient.startSession({
        examId: selectedExamId,
        mode: selectedMode,
        subjectId: selectedSubjectId || undefined,
        topicId: selectedTopicId || undefined,
        questionCount,
        timePerQuestionSeconds: selectedMode === 'RAPID_FIRE' ? timePerQuestion : undefined,
        year: selectedYear || undefined,
      });

      onStartSession(res.sessionId);
    } catch (err: any) {
      alert(err.message || 'Failed to start session');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step 1: Select Examination */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <span>Step 1 of 2</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Select Target Competitive Exam</h1>
        <p className="text-slate-400 text-xs mt-1">
          Each exam is configured with its official syllabus, question distribution, and marking rules.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {exams.map((exam) => {
            const isSelected = exam.id === selectedExamId;
            return (
              <button
                key={exam.id}
                onClick={() => {
                  setSelectedExamId(exam.id);
                  setSelectedSubjectId('');
                  setSelectedTopicId('');
                  setSelectedYear(undefined);
                }}
                className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold">
                      {exam.code}
                    </span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">{exam.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{exam.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">{exam.subjects.length} Subjects</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{exam.pyqInfo && exam.pyqInfo.minYear ? `${exam.pyqInfo.yearRange} PYQs` : 'PYQs Ready'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40 font-mono">
                    <span className="text-slate-500 text-[10px] font-sans">Total PYQs:</span>
                    <span className="text-emerald-300 font-bold text-[11px]">
                      {exam.pyqInfo?.totalCount || 0} Questions
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Exam PYQ Detailed Year-by-Year Breakdown */}
        {currentExam?.pyqInfo && currentExam.pyqInfo.totalCount > 0 && (
          <div className="mt-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">
                      {currentExam.name} • PYQ Archive
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold font-mono">
                      {currentExam.pyqInfo.yearRange}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authentic previous year question papers cataloged with detailed explanations and timing benchmarks.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Total PYQs:</span>
                <span className="text-sm font-extrabold font-mono text-emerald-400">
                  {currentExam.pyqInfo.totalCount} Questions
                </span>
              </div>
            </div>

            {/* List of each PYQ year and questions count */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Available PYQ Papers &amp; Question Counts
                </span>
                <span className="text-[11px] text-indigo-300">
                  Click a year paper to drill into it
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {currentExam.pyqInfo.years.map((y) => {
                  const isYearActive = selectedYear === y.year;
                  return (
                    <button
                      key={y.year}
                      type="button"
                      onClick={() => setSelectedYear(isYearActive ? undefined : y.year)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isYearActive
                          ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span className="font-mono flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{y.year} Paper</span>
                        </span>
                        {isYearActive && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 text-[10px]">Questions:</span>
                        <span className="text-emerald-400 font-mono font-bold">{y.questionCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Select Practice Mode */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <span>Step 2 of 2</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Select Practice or Examination Mode</h2>
        <p className="text-slate-400 text-xs mt-1">
          Choose between full CBT exam simulations, rapid-fire countdown drills, or focused topic practice.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {practiceModes.map((mode) => {
            const isSelected = mode.id === selectedMode;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mode.color}`}>
                      {mode.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{mode.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{mode.desc}</p>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs text-indigo-300 font-bold">
                    <span>Selected Mode</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Specific Customizers: Rapid Fire timing, Topic selection, Question Count */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
          Session Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Question Count */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Number of Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10 Questions (Quick Sprint)</option>
              <option value={20}>20 Questions (Standard Drill)</option>
              <option value={30}>30 Questions (Target Practice)</option>
              <option value={50}>50 Questions (Half Mock)</option>
              <option value={65}>65 Questions (Full GATE Mock)</option>
              <option value={100}>100 Questions (Full RRB/SSC Mock)</option>
            </select>
          </div>

          {/* Filter by PYQ Year */}
          {currentExam?.pyqInfo && currentExam.pyqInfo.years.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>PYQ Paper Year</span>
                {selectedYear && (
                  <button
                    type="button"
                    onClick={() => setSelectedYear(undefined)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 lowercase font-normal"
                  >
                    (clear filter)
                  </button>
                )}
              </label>
              <select
                value={selectedYear !== undefined ? selectedYear : ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
              >
                <option value="">All PYQs ({currentExam.pyqInfo.yearRange} • {currentExam.pyqInfo.totalCount} Qs)</option>
                {currentExam.pyqInfo.years.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} Official PYQ Paper ({y.questionCount} Questions)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rapid Fire Countdown per question */}
          {selectedMode === 'RAPID_FIRE' && (
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Rapid Countdown (Sec / Question)
              </label>
              <select
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value={15}>15 Seconds (Blitz Fire)</option>
                <option value={25}>25 Seconds (Standard Rapid)</option>
                <option value={35}>35 Seconds (Balanced Pace)</option>
                <option value={45}>45 Seconds (Numerical Pace)</option>
              </select>
            </div>
          )}

          {/* Topic Practice Filter */}
          {selectedMode === 'TOPIC_PRACTICE' && currentExam && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedTopicId('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Subjects</option>
                  {currentExam.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubjectId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Specific Topic
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Topics in Subject</option>
                    {currentExam.subjects
                      .find((s) => s.id === selectedSubjectId)
                      ?.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Start Button */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Authoritative CBT session with anti-cheat protection and browser refresh recovery.
          </div>
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm flex items-center space-x-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isStarting ? 'Firing Engine Initializing...' : 'Start Examination Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
