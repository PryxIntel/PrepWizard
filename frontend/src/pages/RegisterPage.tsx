import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { Sparkles, UserPlus, ArrowLeft, Moon, Sun, Zap } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetExam, setTargetExam] = useState('GATE_CS');
  const [targetScore, setTargetScore] = useState(85);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cycleTheme = () => {
    const currentIndex = availableThemes.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        targetExam,
        targetScore,
        dailyStudyGoalMinutes: dailyGoal,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme} (Click to switch)`}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all shadow-md"
        >
          {theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : theme === 'neon' ? (
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          ) : theme === 'emerald' ? (
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span className="capitalize text-[11px]">{theme}</span>
        </button>
      </div>

      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Aspirant Profile</h1>
          <p className="text-xs text-slate-400">Configure your target exam and study goals</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Primary Target Exam
              </label>
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="GATE_CS">GATE Computer Science & Engineering</option>
                <option value="RRB_JE_EE">RRB JE Electrical Engineering</option>
                <option value="SSC_JE_EE">SSC JE Electrical Engineering</option>
                <option value="RRB_ALP_EE">RRB ALP Electrical Trade</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Target Score
                </label>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Daily Goal (Mins)
                </label>
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Creating Profile...' : 'Complete Registration'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onSwitchToLogin}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center space-x-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Already registered? Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
