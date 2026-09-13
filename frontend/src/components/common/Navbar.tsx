import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  Flame,
  BookOpen,
  CheckSquare,
  Bookmark,
  ShieldCheck,
  LogOut,
  Sparkles,
  Layers,
  ChevronDown,
  Clock,
  Compass,
  Moon,
  Sun,
  Zap,
  Check,
  Palette,
  Smartphone,
  Download,
} from 'lucide-react';
import { MobileAppDownloadModal } from './MobileAppDownloadModal.js';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  dueRevisionCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  dueRevisionCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      setDownloadModalOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'exams', label: 'Practice & Mocks', icon: Layers },
    { id: 'mistakes', label: 'Mistake Book', icon: BookOpen },
    {
      id: 'revisions',
      label: "Today's Revision",
      icon: Clock,
      badge: dueRevisionCount > 0 ? dueRevisionCount : undefined,
    },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  const getTargetExamName = (code: string) => {
    switch (code) {
      case 'GATE_CS':
        return 'GATE Computer Science';
      case 'RRB_JE_EE':
        return 'RRB JE Electrical';
      case 'SSC_JE_EE':
        return 'SSC JE Electrical';
      case 'RRB_ALP_EE':
        return 'RRB ALP Electrical';
      default:
        return code;
    }
  };

  const renderThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'neon':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'emerald':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'dark':
      default:
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
                Prep<span className="text-indigo-400">Wizard</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                CBT Exam Suite
              </span>
            </div>
          </button>

          {/* Target Exam Pill */}
          {user && (
            <button
              onClick={() => onNavigate('exams')}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-indigo-300 hover:border-indigo-500 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{getTargetExamName(user.targetExam)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all relative ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Stats, Theme Switcher & Profile Dropdown */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{user.streakCount}D</span>
            </div>
          )}

          {/* Theme Selector Dropdown */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => {
                setThemeOpen(!themeOpen);
                setProfileOpen(false);
              }}
              title={`Current Theme: ${theme}`}
              className="flex items-center space-x-1.5 p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all hover:scale-105"
            >
              {renderThemeIcon()}
              <span className="hidden sm:inline text-[11px] font-bold capitalize text-slate-300">
                {theme}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Theme</span>
                  </span>
                </div>
                <div className="space-y-1">
                  {availableThemes.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setThemeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: t.accentPreview }}
                          />
                          <div className="text-left">
                            <span className="block leading-tight">{t.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                            {t.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile App Download Button */}
          <button
            onClick={() => setDownloadModalOpen(true)}
            title="Download PrepWizard Android App (.apk)"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all hover:scale-105 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Get App</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setThemeOpen(false);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {user ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300">
                    Target: {user?.targetExam}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('exams');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Change Target Exam</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleInstallApp();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-indigo-300 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Install App on Phone</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-slate-800 flex items-center space-x-2 border-t border-slate-800/80"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileAppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onInstallPwa={handleInstallApp}
        hasPwaPrompt={!!installPrompt}
      />
    </header>
  );
};
