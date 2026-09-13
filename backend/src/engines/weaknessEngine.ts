export interface TopicStat {
  topicId: string;
  topicName: string;
  subjectName: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  avgTimeSeconds: number;
  accuracy: number;
}

export interface WeakAreaReport {
  topicId: string;
  topicName: string;
  subjectName: string;
  accuracy: number;
  avgTimeSeconds: number;
  incorrectCount: number;
  totalQuestions: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedActions: string[];
}

export interface SpeedAccuracyQuadrant {
  quadrant: 'FAST_AND_ACCURATE' | 'SLOW_AND_ACCURATE' | 'FAST_AND_INACCURATE' | 'SLOW_AND_INACCURATE';
  description: string;
  recommendation: string;
  avgTimeSec: number;
  accuracyPercent: number;
  totalQuestions: number;
}

export class WeaknessEngine {
  /**
   * Evaluates topic stats and returns identified weak areas sorted by urgency.
   */
  public static analyzeWeaknesses(topicStats: TopicStat[]): WeakAreaReport[] {
    const weakAreas: WeakAreaReport[] = [];

    for (const stat of topicStats) {
      if (stat.totalQuestions < 2) continue; // Need minimum attempts to assess

      let priority: 'HIGH' | 'MEDIUM' | 'LOW' | null = null;
      const actions: string[] = [];

      if (stat.accuracy < 50) {
        priority = 'HIGH';
        actions.push(`Revise foundational theory for ${stat.topicName}`);
        actions.push(`Solve 20 Easy & 20 Medium PYQs without time pressure`);
        actions.push(`Review core formulas & sign conventions`);
        actions.push(`Attempt a focused 15-minute diagnostic quiz`);
      } else if (stat.accuracy < 70) {
        priority = 'MEDIUM';
        actions.push(`Analyze careless & calculation mistakes in ${stat.topicName}`);
        actions.push(`Practice 25 timed previous-year questions`);
        actions.push(`Target 80%+ accuracy on numerical problems`);
      } else if (stat.avgTimeSeconds > 90) {
        // High accuracy but excessive time
        priority = 'LOW';
        actions.push(`Speed drill: Practice shortcut methods & dimensional analysis`);
        actions.push(`Solve questions with strict 45-second timer`);
      }

      if (priority) {
        weakAreas.push({
          topicId: stat.topicId,
          topicName: stat.topicName,
          subjectName: stat.subjectName,
          accuracy: Math.round(stat.accuracy),
          avgTimeSeconds: Math.round(stat.avgTimeSeconds),
          incorrectCount: stat.incorrectCount,
          totalQuestions: stat.totalQuestions,
          priority,
          recommendedActions: actions,
        });
      }
    }

    // Sort by priority (HIGH first) then lowest accuracy
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return weakAreas.sort((a, b) => {
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return a.accuracy - b.accuracy;
    });
  }

  /**
   * Categorizes the candidate into one of 4 Speed vs Accuracy quadrants
   */
  public static classifySpeedAccuracy(totalQuestions: number, avgTimeSec: number, accuracyPercent: number, benchmarkTimeSec: number = 60): SpeedAccuracyQuadrant {
    const isAccurate = accuracyPercent >= 75;
    const isFast = avgTimeSec <= benchmarkTimeSec;

    if (isFast && isAccurate) {
      return {
        quadrant: 'FAST_AND_ACCURATE',
        description: 'Elite / Exam-Ready',
        recommendation: 'Exceptional speed and precision! Maintain peak performance with full-length timed mock tests and high-difficulty multi-concept questions.',
        avgTimeSec,
        accuracyPercent,
        totalQuestions
      };
    } else if (!isFast && isAccurate) {
      return {
        quadrant: 'SLOW_AND_ACCURATE',
        description: 'Thorough but Time-Vulnerable',
        recommendation: 'Strong conceptual clarity, but lengthy calculation is costing you precious marks. Practice Rapid Fire mode and shortcut elimination techniques.',
        avgTimeSec,
        accuracyPercent,
        totalQuestions
      };
    } else if (isFast && !isAccurate) {
      return {
        quadrant: 'FAST_AND_INACCURATE',
        description: 'Impulsive / Prone to Traps',
        recommendation: 'Rushing through questions leading to negative marks. Read questions carefully, verify units, and double-check negative signs before submitting.',
        avgTimeSec,
        accuracyPercent,
        totalQuestions
      };
    } else {
      return {
        quadrant: 'SLOW_AND_INACCURATE',
        description: 'Needs Conceptual & Speed Foundation',
        recommendation: 'Struggling with both comprehension and execution. Pause full mocks; focus on topic-wise deep practice and review fundamental textbook concepts.',
        avgTimeSec,
        accuracyPercent,
        totalQuestions
      };
    }
  }
}
