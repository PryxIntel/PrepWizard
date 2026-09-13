import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client.js';
import { FormulaRenderer } from '../components/common/FormulaRenderer.js';
import { ShieldCheck, PlusCircle, Upload, Settings, BarChart3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'STATS' | 'ADD_QUESTION' | 'BULK_IMPORT' | 'PATTERNS'>('STATS');
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  // Add Question Form State
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [marks, setMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.33);
  const [explanation, setExplanation] = useState('');
  const [formulaConcept, setFormulaConcept] = useState('');
  const [shortcutTrick, setShortcutTrick] = useState('');
  const [year, setYear] = useState(2024);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import State
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [importReport, setImportReport] = useState<any>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsData, examsData, qData] = await Promise.all([
        ApiClient.getSystemStats(),
        ApiClient.getExams(),
        ApiClient.getAdminQuestions({ limit: 15 }),
      ]);
      setStats(statsData);
      setExams(examsData);
      setQuestions(qData.questions || []);

      if (examsData.length > 0) {
        setExamId(examsData[0].id);
        if (examsData[0].subjects.length > 0) {
          setSubjectId(examsData[0].subjects[0].id);
          if (examsData[0].subjects[0].topics.length > 0) {
            setTopicId(examsData[0].subjects[0].topics[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const options = [
        { id: 'A', text: optionA },
        { id: 'B', text: optionB },
        { id: 'C', text: optionC },
        { id: 'D', text: optionD },
      ];

      await ApiClient.createAdminQuestion({
        examId,
        subjectId,
        topicId,
        questionText,
        questionType,
        options,
        correctAnswer: [correctAnswer],
        marks,
        negativeMarks,
        explanation,
        formulaConcept,
        shortcutTrick,
        year,
        isPYQ: true,
      });

      alert('Question published to database successfully!');
      // Reset
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setExplanation('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error creating question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) return;
    setIsSubmitting(true);
    try {
      // Parse CSV lines
      const lines = bulkCsvText.trim().split('\n');
      const parsedQuestions: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 8) {
          parsedQuestions.push({
            examId: examId || exams[0]?.id,
            subjectId: subjectId || exams[0]?.subjects[0]?.id,
            topicId: topicId || exams[0]?.subjects[0]?.topics[0]?.id,
            questionText: parts[0]?.trim(),
            options: [
              { id: 'A', text: parts[1]?.trim() },
              { id: 'B', text: parts[2]?.trim() },
              { id: 'C', text: parts[3]?.trim() },
              { id: 'D', text: parts[4]?.trim() },
            ],
            correctAnswer: [parts[5]?.trim() || 'A'],
            explanation: parts[6]?.trim() || 'Verified answer explanation.',
            year: parts[7] ? parseInt(parts[7].trim()) : 2024,
            marks: 1.0,
            negativeMarks: 0.33,
            isPYQ: true,
          });
        }
      }

      const res = await ApiClient.bulkImportQuestions(parsedQuestions);
      setImportReport(res);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error parsing bulk import');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQ = async (id: string) => {
    if (!confirm('Permanently delete this question?')) return;
    try {
      await ApiClient.deleteAdminQuestion(id);
      loadAdminData();
    } catch (e) {
      alert('Failed to delete question');
    }
  };

  const currentExam = exams.find((e) => e.id === examId);
  const currentSubject = currentExam?.subjects.find((s: any) => s.id === subjectId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Administration & Content Engine</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage PYQ repository, bulk import previous years, and configure CBT exam patterns
            </p>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'STATS', label: 'System Analytics', icon: BarChart3 },
          { id: 'ADD_QUESTION', label: 'Add New Question', icon: PlusCircle },
          { id: 'BULK_IMPORT', label: 'Bulk CSV / Excel Import', icon: Upload },
          { id: 'PATTERNS', label: 'Exam Patterns & Rules', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: System Analytics */}
      {activeTab === 'STATS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total Questions in DB</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                {stats?.totalQuestions || 0}
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Registered Aspirants</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                {stats?.totalUsers || 0}
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Exam Sessions Taken</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                {stats?.totalSessions || 0}
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Configured Exams</span>
              <div className="text-2xl font-extrabold text-indigo-400 mt-1 font-mono">
                {stats?.totalExams || 4}
              </div>
            </div>
          </div>

          {/* Recent Questions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Recently Added PYQs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5">Exam</th>
                    <th className="py-2.5">Subject</th>
                    <th className="py-2.5">Topic</th>
                    <th className="py-2.5">Question Excerpt</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono font-bold text-indigo-300">{q.examName}</td>
                      <td className="py-3">{q.subjectName}</td>
                      <td className="py-3">{q.topicName}</td>
                      <td className="py-3 max-w-xs truncate">{q.questionText}</td>
                      <td className="py-3 font-mono text-[10px] font-bold text-emerald-400">{q.questionType}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteQ(q.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Add New Question */}
      {activeTab === 'ADD_QUESTION' && (
        <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Create New Examination Question</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Exam</label>
              <select
                value={examId}
                onChange={(e) => {
                  setExamId(e.target.value);
                  const ex = exams.find((x) => x.id === e.target.value);
                  if (ex?.subjects.length > 0) {
                    setSubjectId(ex.subjects[0].id);
                    if (ex.subjects[0].topics.length > 0) {
                      setTopicId(ex.subjects[0].topics[0].id);
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  const sub = currentExam?.subjects.find((s: any) => s.id === e.target.value);
                  if (sub?.topics.length > 0) setTopicId(sub.topics[0].id);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                {currentExam?.subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                {currentSubject?.topics.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Question Text (Supports LaTeX e.g. $s = \\frac&#123;N_s - N&#125;&#123;N_s&#125;$)
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. A 4-pole, 50 Hz induction motor operates at 1440 RPM. What is the rotor slip frequency?"
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
            {questionText && (
              <div className="mt-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-indigo-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Live Formula Preview:</span>
                <FormulaRenderer content={questionText} />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Option A</label>
              <input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Option B</label>
              <input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Option C</label>
              <input
                type="text"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Option D</label>
              <input
                type="text"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">Correct Answer</label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-white font-bold"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Marks (+)</label>
              <input
                type="number"
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-400 uppercase mb-1">Negative Marks (-)</label>
              <input
                type="number"
                step="0.01"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Detailed Step-by-Step Explanation & Concept
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the derivation and why the correct answer holds..."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-indigo-400 uppercase mb-1">Formula / Concept Tag</label>
              <input
                type="text"
                value={formulaConcept}
                onChange={(e) => setFormulaConcept(e.target.value)}
                placeholder="e.g. $N_s = \\frac{120 f}{P}$"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase mb-1">Exam Shortcut / Trick</label>
              <input
                type="text"
                value={shortcutTrick}
                onChange={(e) => setShortcutTrick(e.target.value)}
                placeholder="e.g. 1500 - 1440 = 60, then 60/1500 * 50 = 2 Hz"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving to Database...' : 'Publish Question to PYQ Database'}
          </button>
        </form>
      )}

      {/* Tab 3: Bulk CSV Import */}
      {activeTab === 'BULK_IMPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Bulk Question CSV Importer</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste CSV data formatted as: <code className="text-amber-300">question,option_a,option_b,option_c,option_d,answer,explanation,year</code>
              </p>
            </div>
            <button
              onClick={() => {
                setBulkCsvText(
                  'question,option_a,option_b,option_c,option_d,answer,explanation,year\n' +
                  '"In a 3-phase induction motor, synchronous speed is given by:",120f/P,120P/f,60f/P,60P/f,A,"Ns = 120f/P is the standard synchronous speed formula.",2024\n' +
                  '"Which instrument measures both AC and DC quantities without error?",PMMC,Moving Iron,Electro-dynamometer,Induction type,C,"Electro-dynamometer instruments can be used on both AC and DC as transfer instruments.",2023'
                );
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Load Sample CSV Template
            </button>
          </div>

          <textarea
            rows={8}
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
            placeholder="question,option_a,option_b,option_c,option_d,answer,explanation,year"
            className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Target Exam: <strong className="text-indigo-300">{currentExam?.name}</strong>
            </span>
            <button
              onClick={handleBulkImport}
              disabled={isSubmitting || !bulkCsvText.trim()}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Importing Rows...' : 'Run Bulk Import'}
            </button>
          </div>

          {importReport && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-emerald-400 block mb-1">
                Import Completed: {importReport.imported} questions created successfully!
              </span>
              {importReport.errors && importReport.errors.length > 0 && (
                <div className="text-red-400 mt-2">
                  <strong>Errors encountered:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {importReport.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Exam Patterns */}
      {activeTab === 'PATTERNS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Configured Examination Patterns</h3>
          <p className="text-xs text-slate-400">
            Rules are dynamically stored in database tables and not hardcoded. Modify official exam durations or negative marking when agency notices change.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-400 uppercase font-mono">{ex.code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                {ex.patterns.map((p: any) => (
                  <div key={p.id} className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                    <div>Duration: <strong className="text-white">{p.durationMinutes} Minutes</strong></div>
                    <div>Total Questions: <strong className="text-white">{p.totalQuestions} Questions</strong></div>
                    <div>Default Negative Marking: <strong className="text-red-400">{p.negativeMarking} Marks</strong></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
