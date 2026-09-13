import test from 'node:test';
import assert from 'node:assert';
import { ScoringEngine } from '../engines/scoringEngine.js';
import { SpacedRepetitionEngine } from '../engines/spacedRepetitionEngine.js';
import { WeaknessEngine } from '../engines/weaknessEngine.js';

test('ScoringEngine - MCQ Correct and Negative Marking', () => {
  const correctResult = ScoringEngine.evaluateAnswer({
    questionType: 'MCQ',
    marks: 1.0,
    negativeMarks: 0.33,
    candidateAnswerJson: JSON.stringify(['B']),
    correctAnswersJson: JSON.stringify(['B']),
  });

  assert.strictEqual(correctResult.isCorrect, true);
  assert.strictEqual(correctResult.marksAwarded, 1.0);
  assert.strictEqual(correctResult.isAttempted, true);

  const incorrectResult = ScoringEngine.evaluateAnswer({
    questionType: 'MCQ',
    marks: 1.0,
    negativeMarks: 0.33,
    candidateAnswerJson: JSON.stringify(['A']),
    correctAnswersJson: JSON.stringify(['B']),
  });

  assert.strictEqual(incorrectResult.isCorrect, false);
  assert.strictEqual(incorrectResult.marksAwarded, -0.33);
});

test('ScoringEngine - MSQ Evaluation', () => {
  const msqCorrect = ScoringEngine.evaluateAnswer({
    questionType: 'MSQ',
    marks: 2.0,
    negativeMarks: 0.0,
    candidateAnswerJson: JSON.stringify(['A', 'C']),
    correctAnswersJson: JSON.stringify(['C', 'A']),
  });

  assert.strictEqual(msqCorrect.isCorrect, true);
  assert.strictEqual(msqCorrect.marksAwarded, 2.0);

  const msqPartial = ScoringEngine.evaluateAnswer({
    questionType: 'MSQ',
    marks: 2.0,
    negativeMarks: 0.0,
    candidateAnswerJson: JSON.stringify(['A']),
    correctAnswersJson: JSON.stringify(['A', 'C']),
  });

  // MSQ in GATE has zero partial credit and zero negative marks
  assert.strictEqual(msqPartial.isCorrect, false);
  assert.strictEqual(msqPartial.marksAwarded, 0.0);
});

test('ScoringEngine - NAT Numerical Range Evaluation', () => {
  const natResult = ScoringEngine.evaluateAnswer({
    questionType: 'NAT',
    marks: 2.0,
    negativeMarks: 0.0,
    candidateAnswerJson: '3.00',
    correctAnswersJson: JSON.stringify({ min: 2.99, max: 3.01 }),
  });

  assert.strictEqual(natResult.isCorrect, true);
  assert.strictEqual(natResult.marksAwarded, 2.0);
});

test('SpacedRepetitionEngine - SM-2 Progression', () => {
  // First review with high quality (5 = easy)
  const step1 = SpacedRepetitionEngine.calculateNextReview({
    repetitions: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    quality: 5,
  });

  assert.strictEqual(step1.repetitions, 1);
  assert.strictEqual(step1.intervalDays, 1); // first interval is 1 day
  assert(step1.easeFactor >= 2.5);

  // Subsequent review
  const step2 = SpacedRepetitionEngine.calculateNextReview({
    repetitions: 1,
    intervalDays: 1,
    easeFactor: step1.easeFactor,
    quality: 4,
  });

  assert.strictEqual(step2.repetitions, 2);
  assert.strictEqual(step2.intervalDays, 3); // second interval is 3 days
});

test('WeaknessEngine - Speed vs Accuracy Classification', () => {
  const elite = WeaknessEngine.classifySpeedAccuracy(50, 35, 88, 60);
  assert.strictEqual(elite.quadrant, 'FAST_AND_ACCURATE');

  const slowAccurate = WeaknessEngine.classifySpeedAccuracy(50, 95, 85, 60);
  assert.strictEqual(slowAccurate.quadrant, 'SLOW_AND_ACCURATE');

  const impulsive = WeaknessEngine.classifySpeedAccuracy(50, 25, 45, 60);
  assert.strictEqual(impulsive.quadrant, 'FAST_AND_INACCURATE');
});
