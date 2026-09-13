import test from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:5000/api';

test('End-to-End CBT Flow: Auth, Session, Scoring, Analytics, Mistake Book & AI', async () => {
  // 1. Candidate Registration & Auth
  const testEmail = `candidate_${Date.now()}@prepwizard.com`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecureTestPass@2026',
      name: 'Ankit Sharma',
      targetExam: 'RRB_JE_EE',
    }),
  });
  const regData = (await regRes.json()) as any;
  assert.strictEqual(regRes.status, 201);
  assert(regData.token, 'Must return JWT token');
  const token = regData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Fetch Exams
  const examsRes = await fetch(`${BASE}/exams`);
  const exams = (await examsRes.json()) as any;
  assert.strictEqual(examsRes.status, 200);
  assert(Array.isArray(exams) && exams.length >= 4, 'Must support at least 4 exams');

  const rrbExam = exams.find((e: any) => e.code === 'RRB_JE_EE');
  assert(rrbExam, 'RRB JE Electrical exam must exist');

  // 3. Start Rapid Fire CBT Session
  const sessionRes = await fetch(`${BASE}/sessions/start`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      examId: rrbExam.id,
      mode: 'RAPID_FIRE',
      questionCount: 4,
      timePerQuestionSeconds: 30,
    }),
  });
  const sessionStartData = (await sessionRes.json()) as any;
  assert.strictEqual(sessionRes.status, 201);
  assert(sessionStartData.sessionId, 'Must generate sessionId');
  const sessionId = sessionStartData.sessionId;

  // 4. Get Session State
  const stateRes = await fetch(`${BASE}/sessions/${sessionId}/state`, {
    headers: authHeaders,
  });
  const stateData = (await stateRes.json()) as any;
  assert.strictEqual(stateRes.status, 200);
  assert.strictEqual(stateData.session.mode, 'RAPID_FIRE');
  assert(stateData.questions.length > 0, 'Questions must be loaded');

  // Verify Anti-Cheat: questions sent to active test taker MUST NOT leak correct answers or explanations
  const firstQ = stateData.questions[0].question;
  assert.strictEqual(firstQ.correctAnswersJson, undefined, 'Must not leak correct answer');
  assert.strictEqual(firstQ.explanation, undefined, 'Must not leak explanation');

  // 5. Submit Answers
  // Q1: Submit Answer
  const answerQ1 = await fetch(`${BASE}/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sequenceOrder: 1,
      candidateAnswer: ['B'],
      timeTakenSeconds: 18,
      markForReview: false,
    }),
  });
  assert.strictEqual(answerQ1.status, 200);

  // Q2: Mark for review
  const answerQ2 = await fetch(`${BASE}/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sequenceOrder: 2,
      candidateAnswer: ['A'],
      timeTakenSeconds: 22,
      markForReview: true,
    }),
  });
  assert.strictEqual(answerQ2.status, 200);

  // 6. Submit Test Session
  const submitRes = await fetch(`${BASE}/sessions/${sessionId}/submit`, {
    method: 'POST',
    headers: authHeaders,
  });
  const submitData = (await submitRes.json()) as any;
  assert.strictEqual(submitRes.status, 200);
  assert.strictEqual(submitData.status, 'SUBMITTED');
  assert(typeof submitData.score === 'number', 'Must calculate score');

  // 7. Get Post-Exam Analysis & 4-Quadrant Matrix
  const analysisRes = await fetch(`${BASE}/sessions/${sessionId}/analysis`, {
    headers: authHeaders,
  });
  const analysisData = (await analysisRes.json()) as any;
  assert.strictEqual(analysisRes.status, 200);
  assert(analysisData.speedAccuracyQuadrant, 'Must generate Speed vs Accuracy quadrant');
  assert(analysisData.questions[0].explanation, 'Post exam analysis MUST now reveal full explanation');

  // 8. Test AI Question Explainer & Doubt Solver
  const aiExplainRes = await fetch(`${BASE}/ai/explain/${firstQ.id}?tone=simple`, {
    headers: authHeaders,
  });
  const aiExplainData = (await aiExplainRes.json()) as any;
  assert.strictEqual(aiExplainRes.status, 200);
  assert.strictEqual(aiExplainData.isAIGenerated, true, 'AI features must be labeled AI GENERATED');

  // 9. Test Spaced Repetition Due Queue
  const revisionRes = await fetch(`${BASE}/revisions/due`, {
    headers: authHeaders,
  });
  const revisionData = (await revisionRes.json()) as any;
  assert.strictEqual(revisionRes.status, 200);
  assert(Array.isArray(revisionData.cards), 'Revision cards array returned');

  console.log('✅ End-to-End CBT test workflow passed with 100% precision!');
});
