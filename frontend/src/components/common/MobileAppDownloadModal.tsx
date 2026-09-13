import React from 'react';
import { Smartphone, Download, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface MobileAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa?: () => void;
  hasPwaPrompt?: boolean;
}

export const MobileAppDownloadModal: React.FC<MobileAppDownloadModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa,
  hasPwaPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <span>PrepWizard for Mobile</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Android & Web
                </span>
              </h2>
              <p className="text-xs text-slate-400">Continue your CBT exam preparation anywhere, anytime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full CBT Engine</span>
            </div>
            <p className="text-[11px] text-slate-400">Exact exam palette, countdown timer & formula KaTeX rendering.</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Offline Revision</span>
            </div>
            <p className="text-[11px] text-slate-400">Digital Mistake Book & SuperMemo SM-2 spaced repetition on phone.</p>
          </div>
        </div>

        {/* Installation Options */}
        <div className="space-y-3">
          {/* Option 1: Direct PWA Install (Zero warnings, instant) */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider block">
                  Method 1: 1-Tap Direct Phone App
                </span>
                <span className="text-[11px] text-slate-400">
                  Installs instantly on Android & iOS without security prompts.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (onInstallPwa) onInstallPwa();
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Smartphone className="w-4 h-4" />
              <span>{hasPwaPrompt ? 'Install App on This Device Now' : 'How to Add to Home Screen'}</span>
            </button>
          </div>

          {/* Option 2: Standalone APK File Download */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
                  Method 2: Standalone Android APK File (.apk)
                </span>
                <span className="text-[11px] text-slate-400">
                  Download and manually install the compiled Android APK package.
                </span>
              </div>
            </div>
            <a
              href="/PrepWizard.apk"
              download="PrepWizard.apk"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-2 border border-slate-700 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download PrepWizard.apk</span>
            </a>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-300 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Installation Guide for Candidates:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
            <li><strong>Phone Browser:</strong> Open <code className="text-indigo-300">priyanshuchauhan.in</code> on Chrome, tap (⋮) &gt; &quot;Install app&quot;.</li>
            <li><strong>APK Installation:</strong> Download <code className="text-indigo-300">PrepWizard.apk</code>, tap to install, and allow &quot;Install unknown apps&quot; if prompted.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
