import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Navbar } from './components/common/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ExamSelectPage } from './pages/ExamSelectPage.js';
import { ActiveSessionPage } from './pages/ActiveSessionPage.js';
import { PostExamAnalysisPage } from './pages/PostExamAnalysisPage.js';
import { MistakeBookPage } from './pages/MistakeBookPage.js';
import { RevisionPage } from './pages/RevisionPage.js';
import { BookmarksPage } from './pages/BookmarksPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ApiClient } from './api/client.js';

const MainApp: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [analysisSessionId, setAnalysisSessionId] = useState<string | null>(null);
  const [dueRevisionCount, setDueRevisionCount] = useState<number>(0);

  useEffect(() => {
    if (token) {
      // Check due revisions count for badge
      ApiClient.getDueRevisions()
        .then((res) => setDueRevisionCount(res.totalDue || 0))
        .catch(() => {});
    }
  }, [token, currentView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">INITIALIZING PREPWIZARD CBT ENGINE...</p>
        </div>
      </div>
    );
  }

  // If user not authenticated, show Login / Register
  if (!user || !token) {
    return authView === 'LOGIN' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('REGISTER')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('LOGIN')} />
    );
  }

  // Active Exam Session (Distraction-free CBT view)
  if (activeSessionId) {
    return (
      <ActiveSessionPage
        sessionId={activeSessionId}
        onFinishTest={(sId) => {
          setActiveSessionId(null);
          setAnalysisSessionId(sId);
        }}
        onExit={() => setActiveSessionId(null)}
      />
    );
  }

  // Post Exam Comprehensive Report
  if (analysisSessionId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar
          currentView="analysis"
          onNavigate={(view) => {
            setAnalysisSessionId(null);
            setCurrentView(view);
          }}
          dueRevisionCount={dueRevisionCount}
        />
        <main className="flex-1">
          <PostExamAnalysisPage
            sessionId={analysisSessionId}
            onRetake={() => {
              // Start a new session with same exam
              setAnalysisSessionId(null);
              setCurrentView('exams');
            }}
            onGoHome={() => {
              setAnalysisSessionId(null);
              setCurrentView('dashboard');
            }}
          />
        </main>
      </div>
    );
  }

  // Standard Dashboard & Study Views
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        dueRevisionCount={dueRevisionCount}
      />
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <DashboardPage
            onNavigate={(view, data) => {
              setCurrentView(view);
              if (data?.autoStartRapid) {
                setCurrentView('exams');
              }
            }}
          />
        )}
        {currentView === 'exams' && (
          <ExamSelectPage
            onStartSession={(sessionId) => setActiveSessionId(sessionId)}
          />
        )}
        {currentView === 'mistakes' && (
          <MistakeBookPage
            onStartMistakePractice={() => {
              // Launch mistake practice mode
              setCurrentView('exams');
            }}
          />
        )}
        {currentView === 'revisions' && <RevisionPage />}
        {currentView === 'bookmarks' && <BookmarksPage />}
        {currentView === 'admin' && <AdminDashboardPage />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>PrepWizard Engine © 2026 — Real-Time CBT Simulation for GATE CS, RRB JE, SSC JE & RRB ALP</p>
        <p className="text-[11px] text-slate-500">
          Domain: <span className="text-indigo-400 font-mono">priyanshuchauhan.in</span> •{' '}
          <a href="https://github.com/PryxIntel/PrepWizard/releases/download/v1.0.0/PrepWizard.apk" download="PrepWizard.apk" className="text-emerald-400 hover:underline font-semibold">
            📱 Download Android APK
          </a>
        </p>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
