import React, { useState } from 'react';
import { ApiClient } from '../../api/client.js';
import { Sparkles, Send, X, Bot, AlertCircle } from 'lucide-react';
import { FormulaRenderer } from '../common/FormulaRenderer.js';

interface AIDoubtSolverModalProps {
  questionId: string;
  questionText: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AIDoubtSolverModal: React.FC<AIDoubtSolverModalProps> = ({
  questionId,
  questionText,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; tag?: string }[]
  >([]);

  if (!isOpen) return null;

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await ApiClient.answerDoubt({
        questionId,
        userQuery: textToSend,
      });

      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          text: res.response,
          tag: res.tag,
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          text: 'Unable to connect to AI Doubt Assistant. Please check your network connection.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">AI Doubt Assistant</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  AI GENERATED
                </span>
              </div>
              <p className="text-xs text-slate-400">Instant pedagogical doubt resolution for this question</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Excerpt */}
        <div className="bg-slate-950/40 px-6 py-2.5 border-b border-slate-800 text-xs text-slate-400 line-clamp-2 italic">
          &quot;{questionText}&quot;
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-300">Have a doubt regarding this question?</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Ask about the concept, why other options are wrong, or ask for shortcuts:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleSend('Why is the correct answer chosen?')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-500 transition-colors"
                >
                  💡 Why is this option correct?
                </button>
                <button
                  onClick={() => handleSend('What is the relevant formula/concept?')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-500 transition-colors"
                >
                  📐 Core Formula breakdown
                </button>
                <button
                  onClick={() => handleSend('Is there any shortcut to solve this faster?')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-500 transition-colors"
                >
                  ⚡ Shortcut / 30-sec trick
                </button>
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                {m.tag && (
                  <div className="text-[10px] font-bold text-cyan-400 tracking-wider mb-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{m.tag}</span>
                  </div>
                )}
                <div className="whitespace-pre-line leading-relaxed">
                  <FormulaRenderer content={m.text} />
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded-xl p-3.5 text-xs flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
                <span>AI analyzing question parameters...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-slate-950 p-4 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any doubt about this question..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
