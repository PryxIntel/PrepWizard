import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Flame,
  Target,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Play,
  Calendar,
  Sparkles,
  Award,
  BarChart2,
  Smartphone,
} from 'lucide-react';
import { AIStudyPlannerModal } from '../components/ai/AIStudyPlannerModal.js';
import { MobileAppDownloadModal } from '../components/common/MobileAppDownloadModal.js';

interface DashboardPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [studyPlannerOpen, setStudyPlannerOpen] = useState<boolean>(false);
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getDashboardSummary();
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading your preparation cockpit...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const weakAreas = data?.weakAreas || [];
  const todaySolved = stats.todayQuestionsSolved ?? 0;
  const todayTarget = stats.dailyTargetQuestions ?? 30;
  const todayPercent = todayTarget > 0 ? Math.min(100, Math.round((todaySolved / todayTarget) * 100)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Greeting & Streak */}
      <div className="bg-gradient-to-r from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Exam Prep Cockpit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Aspirant'} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Targeting <strong className="text-indigo-300">{user?.targetExam.replace(/_/g, ' ')}</strong>. You are training under real examination conditions with live countdown timers.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('exams', { autoStartRapid: true })}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Launch Rapid Fire</span>
            </button>
            <button
              onClick={() => setStudyPlannerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-2 transition-colors"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>AI Study Plan</span>
            </button>
            <button
              onClick={() => setMobileModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center space-x-2 transition-all hover:scale-105 shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mobile App / APK</span>
            </button>
          </div>
        </div>

        {/* Overview Stat Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Overall Accuracy</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono flex items-baseline space-x-1">
              <span>{stats.totalQuestionsSolved > 0 ? `${stats.overallAccuracy}%` : '0%'}</span>
              <span className="text-xs text-slate-400 font-sans font-medium">
                {stats.totalQuestionsSolved > 0 ? 'Live Score' : 'New Candidate'}
              </span>
            </div>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Questions Solved</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              {stats.totalQuestionsSolved ? stats.totalQuestionsSolved.toLocaleString() : '0'}
            </div>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Study Streak</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono flex items-center space-x-1.5">
              <Flame className="w-5 h-5 fill-amber-400" />
              <span>{stats.streakCount || user?.streakCount || 1} Day{(stats.streakCount || user?.streakCount || 1) > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Mock Tests Completed</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              {stats.testsCompleted || 0}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Core Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Continue Practice / Real CBT Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Continue Practice
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold">
                Resume
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{user?.targetExam.replace(/_/g, ' ')}</h3>
            <p className="text-xs text-slate-400 mb-4">High-yield Previous Year Questions session with active countdown.</p>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs mb-4">
              <span className="text-slate-400">Session Capacity</span>
              <span className="text-white font-mono font-bold">25 questions</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('exams')}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Continue Practice Session</span>
          </button>
        </div>

        {/* Column 2: Today's Daily Target */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Today&apos;s Target
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                Daily Goal
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">30 Questions • 45 Minutes</h3>
            <p className="text-xs text-slate-400 mb-4">
              Maintain your daily rhythm to solidify speed and mental resilience for CBT day.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {todayPercent}% ({todaySolved}/{todayTarget} solved)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${todayPercent}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('exams', { autoStartRapid: true })}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Target className="w-4 h-4" />
            <span>Start Daily Target Drill</span>
          </button>
        </div>

        {/* Column 3: Spaced Repetition (Today's Revision) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Today&apos;s Revision
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold">
                SM-2 Spaced
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {stats.dueRevisionsCount ?? 0} Cards Due Today
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Questions you answered incorrectly are scheduled at 1, 3, 7, 14, 30 day intervals.
            </p>
            <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl text-xs text-purple-300 mb-4">
              Reviewing spaced items prevents memory decay before the final examination.
            </div>
          </div>
          <button
            onClick={() => onNavigate('revisions')}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Start Today&apos;s Revision</span>
          </button>
        </div>
      </div>

      {/* Intelligent Weak Areas Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Intelligent Weakness Detection</h3>
              <p className="text-xs text-slate-400">
                Algorithmic diagnostic identifying high-risk topics based on past mistakes and speed lag
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('exams', { mode: 'WEAK_AREA' })}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <span>Practice Weak Areas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weakAreas.length > 0 ? (
            weakAreas.map((w: any, index: number) => (
              <div
                key={index}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[70%]">
                    {w.topicName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      w.priority === 'HIGH'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {w.priority} PRIORITY
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Accuracy: <strong className="text-red-400 font-mono">{w.accuracy}%</strong></span>
                  <span>Avg Time: <strong className="text-white font-mono">{w.avgTimeSeconds}s</strong></span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {w.recommendedActions[0] || 'Solve targeted easy/medium numerical questions.'}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-slate-950/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-75" />
              <p className="text-sm font-semibold text-white">No weak areas identified yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Complete your first practice drill or mock test. The AI Weakness Engine will automatically track speed-to-accuracy ratios and flag high-priority topics here.
              </p>
              <button
                onClick={() => onNavigate('exams')}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                Start Practice Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Study Planner Modal */}
      <AIStudyPlannerModal isOpen={studyPlannerOpen} onClose={() => setStudyPlannerOpen(false)} />

      {/* Mobile App & APK Download Modal */}
      <MobileAppDownloadModal
        isOpen={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
      />
    </div>
  );
};
