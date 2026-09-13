export interface QuestionScoreInput {
  questionType: string;
  marks: number;
  negativeMarks: number;
  candidateAnswerJson: string | null;
  correctAnswersJson: string;
}

export interface QuestionScoreResult {
  isCorrect: boolean;
  marksAwarded: number;
  isAttempted: boolean;
}

export class ScoringEngine {
  /**
   * Evaluates a candidate's answer according to standard competitive exam rules:
   * - MCQ: Exact single match. Correct: +marks, Incorrect: -negativeMarks
   * - MSQ: All-and-only correct options selected. No negative marks.
   * - NAT: Numerical range or exact decimal match. No negative marks.
   * - ASSERTION_REASON: Standard MCQ evaluation.
   */
  public static evaluateAnswer(input: QuestionScoreInput): QuestionScoreResult {
    const { questionType, marks, negativeMarks, candidateAnswerJson, correctAnswersJson } = input;

    // Check if unattempted / skipped
    if (!candidateAnswerJson || candidateAnswerJson.trim() === '' || candidateAnswerJson === '[]' || candidateAnswerJson === 'null') {
      return {
        isCorrect: false,
        marksAwarded: 0,
        isAttempted: false,
      };
    }

    let candidateAnswer: any;
    let correctAnswer: any;

    try {
      candidateAnswer = JSON.parse(candidateAnswerJson);
    } catch {
      candidateAnswer = candidateAnswerJson.trim();
    }

    try {
      correctAnswer = JSON.parse(correctAnswersJson);
    } catch {
      correctAnswer = correctAnswersJson.trim();
    }

    switch (questionType.toUpperCase()) {
      case 'MCQ':
      case 'ASSERTION_REASON': {
        const cand = Array.isArray(candidateAnswer) ? candidateAnswer[0] : candidateAnswer;
        const corr = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;

        const isCorrect = String(cand).trim().toUpperCase() === String(corr).trim().toUpperCase();
        return {
          isCorrect,
          marksAwarded: isCorrect ? marks : -Math.abs(negativeMarks),
          isAttempted: true,
        };
      }

      case 'MSQ': {
        // Multi-select question
        const candSet = new Set(
          Array.isArray(candidateAnswer)
            ? candidateAnswer.map((s: any) => String(s).trim().toUpperCase())
            : [String(candidateAnswer).trim().toUpperCase()]
        );
        const corrSet = new Set(
          Array.isArray(correctAnswer)
            ? correctAnswer.map((s: any) => String(s).trim().toUpperCase())
            : [String(correctAnswer).trim().toUpperCase()]
        );

        if (candSet.size !== corrSet.size) {
          return {
            isCorrect: false,
            marksAwarded: 0, // In GATE, MSQ has 0 negative marks
            isAttempted: true,
          };
        }

        let match = true;
        for (const item of candSet) {
          if (!corrSet.has(item)) {
            match = false;
            break;
          }
        }

        return {
          isCorrect: match,
          marksAwarded: match ? marks : 0,
          isAttempted: true,
        };
      }

      case 'NAT':
      case 'NUMERICAL': {
        // NAT has no negative marks in GATE / competitive exams
        const candNum = parseFloat(String(candidateAnswer).trim());
        if (isNaN(candNum)) {
          return { isCorrect: false, marksAwarded: 0, isAttempted: true };
        }

        let isCorrect = false;
        if (typeof correctAnswer === 'object' && correctAnswer !== null && !Array.isArray(correctAnswer)) {
          const min = typeof correctAnswer.min === 'number' ? correctAnswer.min : parseFloat(correctAnswer.min);
          const max = typeof correctAnswer.max === 'number' ? correctAnswer.max : parseFloat(correctAnswer.max);
          isCorrect = candNum >= min - 0.0001 && candNum <= max + 0.0001;
        } else if (Array.isArray(correctAnswer)) {
          isCorrect = correctAnswer.some((ans: any) => Math.abs(parseFloat(String(ans)) - candNum) < 0.005);
        } else {
          const corrNum = parseFloat(String(correctAnswer));
          isCorrect = Math.abs(corrNum - candNum) < 0.005;
        }

        return {
          isCorrect,
          marksAwarded: isCorrect ? marks : 0,
          isAttempted: true,
        };
      }

      default: {
        const isCorrect = JSON.stringify(candidateAnswer) === JSON.stringify(correctAnswer);
        return {
          isCorrect,
          marksAwarded: isCorrect ? marks : -Math.abs(negativeMarks),
          isAttempted: true,
        };
      }
    }
  }
}
