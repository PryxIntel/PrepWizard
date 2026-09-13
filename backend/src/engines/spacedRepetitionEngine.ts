export interface SM2Input {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  quality: number; // 0 to 5 (0-2 = fail/mistake, 3 = hard, 4 = good, 5 = easy)
}

export interface SM2Result {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: Date;
}

export class SpacedRepetitionEngine {
  // Standard interval steps for competitive exam revision: 1, 3, 7, 14, 30 days
  private static readonly REVISION_STEPS = [1, 3, 7, 14, 30];

  /**
   * Calculates the next review date and updated SM-2 parameters.
   */
  public static calculateNextReview(input: SM2Input): SM2Result {
    let { repetitions, intervalDays, easeFactor, quality } = input;

    // Quality clamp
    quality = Math.max(0, Math.min(5, quality));

    if (quality < 3) {
      // Failed - reset repetition step to 1 day
      repetitions = 0;
      intervalDays = 1;
    } else {
      if (repetitions < this.REVISION_STEPS.length) {
        intervalDays = this.REVISION_STEPS[repetitions];
      } else {
        // Beyond preset steps, scale by easeFactor
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitions += 1;
    }

    // Update Ease Factor (SuperMemo SM-2 formula)
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    return {
      repetitions,
      intervalDays,
      easeFactor: parseFloat(easeFactor.toFixed(2)),
      nextReviewDate,
    };
  }
}
