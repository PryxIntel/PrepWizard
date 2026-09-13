export interface QuestionContext {
  id: string;
  exam: string;
  subject: string;
  topic: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: any;
  explanation: string;
  formula?: string;
  candidateAnswer?: any;
}

export class AIService {
  /**
   * Explains a question in simple, pedagogical language with intuition and analogies.
   */
  public static explainQuestion(ctx: QuestionContext, targetTone: 'simple' | 'deep' | 'exam_trick' = 'simple') {
    return {
      isAIGenerated: true,
      tag: 'AI GENERATED EXPLANATION',
      summary: `Concept Breakdown for ${ctx.topic} (${ctx.exam})`,
      intuitiveExplanation: `To tackle this question without memorizing formulas blindly, look at what the physical/logical system represents:\n\n` +
        `In ${ctx.topic}, the governing principle is centered on conservation and state progression. ` +
        `Notice the question asks: "${ctx.questionText.slice(0, 80)}...".\n\n` +
        `The key turning point is: When applying ${ctx.formula || 'the standard relationship'}, we observe that the correct choice (${Array.isArray(ctx.correctAnswer) ? ctx.correctAnswer.join(', ') : ctx.correctAnswer}) emerges directly from setting up the balance equation.`,
      stepByStep: [
        `Step 1: Identify given quantities and required unknown from the problem statement.`,
        `Step 2: Check unit consistency and eliminate obvious distractor options.`,
        `Step 3: Apply ${ctx.formula ? `formula: ${ctx.formula}` : 'core concept relationship'}.`,
        `Step 4: Verify the result against standard physical/mathematical bounds.`
      ],
      examTrapWarning: `Common Trap: Aspirants frequently make sign convention errors or confuse synchronous speed with rotor slip speed in numerical problems.`,
      speedShortcut: `Shortcut: Look at the order of magnitude in the options. Often, 2 options can be rejected immediately using dimensional analysis.`
    };
  }

  /**
   * AI Doubt Solver responding to candidate questions
   */
  public static answerDoubt(ctx: QuestionContext, userQuery: string) {
    const cleanQuery = userQuery.toLowerCase();
    let reply = "";

    if (cleanQuery.includes('why') && (cleanQuery.includes('incorrect') || cleanQuery.includes('wrong') || cleanQuery.includes('option'))) {
      reply = `Great observation! In competitive exams like ${ctx.exam}, incorrect options are deliberately designed to match common misconceptions.\n\n` +
        `The distractor options assume either inverted parameters or ignore initial conditions. Specifically, the correct deduction requires following: "${ctx.explanation}".`;
    } else if (cleanQuery.includes('formula') || cleanQuery.includes('equation') || cleanQuery.includes('calc')) {
      reply = `The fundamental formula required here is:\n` +
        `${ctx.formula || 'Base relation defined in syllabus'}\n\n` +
        `Ensure you keep units uniform (e.g. converting RPM to rad/s or Hertz to angular frequency) before computing.`;
    } else if (cleanQuery.includes('trick') || cleanQuery.includes('shortcut') || cleanQuery.includes('faster')) {
      reply = `To solve this in under 30 seconds during the exam:\n` +
        `1. Read the last sentence of the problem first to know exactly what is asked.\n` +
        `2. Eliminate extreme option values.\n` +
        `3. Approximate arithmetic: round numbers like 9.8 to 10 or 3.14 to 3 if options are widely spaced!`;
    } else {
      reply = `Regarding your question "${userQuery}":\n` +
        `In ${ctx.subject} (${ctx.topic}), remember that ${ctx.explanation.slice(0, 150)}...\n` +
        `Always verify if the question has negative marking before taking an educated guess!`;
    }

    return {
      isAIGenerated: true,
      tag: 'AI GENERATED DOUBT RESOLUTION',
      doubt: userQuery,
      response: reply,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyzes recurring mistake patterns
   */
  public static analyzeMistakes(mistakes: { mistakeType: string; topicName: string; count: number }[]) {
    const total = mistakes.reduce((acc, m) => acc + m.count, 0);
    const calculationErrors = mistakes.filter(m => m.mistakeType === 'CALCULATION').reduce((acc, m) => acc + m.count, 0);
    const conceptualErrors = mistakes.filter(m => m.mistakeType === 'CONCEPTUAL').reduce((acc, m) => acc + m.count, 0);
    const sillyErrors = mistakes.filter(m => m.mistakeType === 'SILLY' || m.mistakeType === 'MISREAD').reduce((acc, m) => acc + m.count, 0);

    let diagnostic = "";
    if (calculationErrors > total * 0.4) {
      diagnostic = "Calculation Precision Issue: You understand the concepts, but loose rough-work and arithmetic slips are costing you ranks. Use virtual calculators cleanly and avoid mental arithmetic on 2-mark questions.";
    } else if (conceptualErrors > total * 0.4) {
      diagnostic = "Foundational Knowledge Gap: Frequent conceptual mistakes indicate revision is due. Re-read standard textbooks or notes before attempting further mock tests.";
    } else if (sillyErrors > total * 0.3) {
      diagnostic = "Question Misreading Trap: You are rushing through question text. Underline 'NOT TRUE', 'EXCEPT', and unit specifications before solving.";
    } else {
      diagnostic = "Balanced Learning Curve: Work on time management during multi-step numericals to improve your speed-to-accuracy ratio.";
    }

    return {
      isAIGenerated: true,
      tag: 'AI GENERATED MISTAKE DIAGNOSTIC',
      totalMistakesAnalyzed: total,
      breakdown: { calculationErrors, conceptualErrors, sillyErrors },
      diagnosticRecommendation: diagnostic
    };
  }

  /**
   * Generates a personalized 30-day preparation schedule
   */
  public static generateStudyPlan(exam: string, targetScore: number, dailyHours: number, weakTopics: string[]) {
    return {
      isAIGenerated: true,
      tag: 'AI GENERATED STUDY SCHEDULE',
      exam,
      targetScore,
      dailyHours,
      overview: `A rigorous ${dailyHours} hours/day strategy designed to elevate your score to ${targetScore}+ in ${exam}.`,
      weeklyPhases: [
        {
          week: 'Week 1: Weak-Area Deep Cleansing',
          focus: weakTopics.slice(0, 3).join(', ') || 'High-Weightage Core Topics',
          dailyGoal: `${dailyHours * 0.6}h Concept Revision + 30 Target PYQs + Mistake Book Review`,
        },
        {
          week: 'Week 2: Speed & Numerical Accuracy Drill',
          focus: 'Formulas, NAT / Numerical Problems & Time-Bounded Practice',
          dailyGoal: `Daily 25-Question Rapid Fire + 45min Formula Sheet Memorization`,
        },
        {
          week: 'Week 3: Subject-Wise Mock Test Simulation',
          focus: 'Sectional CBT Tests with Strict Negative Marking',
          dailyGoal: `1 Sectional Test daily + In-depth Post-Exam Analysis`,
        },
        {
          week: 'Week 4: Full-Length CBT Real Exam Conditioning',
          focus: 'Full Mock Tests #1 to #5 under exact exam timing',
          dailyGoal: `Full 3-Hour Simulation + Spaced Repetition Flashcards`,
        }
      ]
    };
  }
}
