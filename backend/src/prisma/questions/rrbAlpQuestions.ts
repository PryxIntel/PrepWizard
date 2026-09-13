import { RawQuestionData } from './gateQuestions.js';
import { rrbAlp2024PartAQuestions } from './rrbAlp2024PartAQuestions.js';
import { rrbAlp2024PartBQuestions } from './rrbAlp2024PartBQuestions.js';
import { rrbAlp2026Feb17Shift1Questions } from './rrbAlp2026Feb17Shift1Questions.js';
import { rrbAlp2026Feb16Shift1Questions } from './rrbAlp2026Feb16Shift1Questions.js';
import { rrbAlp2026Feb17Shift2Questions } from './rrbAlp2026Feb17Shift2Questions.js';

export const rrbAlpQuestions: RawQuestionData[] = [
  ...rrbAlp2024PartAQuestions,
  ...rrbAlp2024PartBQuestions,
  ...rrbAlp2026Feb17Shift1Questions,
  ...rrbAlp2026Feb16Shift1Questions,
  ...rrbAlp2026Feb17Shift2Questions,
];
