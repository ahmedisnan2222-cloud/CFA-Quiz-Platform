import type { Confidence } from "@/app/generated/prisma/enums";

export type AnswerLike = {
  confidence: Confidence;
  isCorrect: boolean;
  questionId: string;
};

export type CalibrationRow = {
  confidence: Confidence;
  correct: number;
  incorrect: number;
  total: number;
  correctPct: number;
};

export function calibrationMatrix(answers: AnswerLike[]): CalibrationRow[] {
  return (["HIGH", "MEDIUM", "LOW"] as const).map((confidence) => {
    const forLevel = answers.filter((a) => a.confidence === confidence);
    const correct = forLevel.filter((a) => a.isCorrect).length;
    const total = forLevel.length;
    return {
      confidence,
      correct,
      incorrect: total - correct,
      total,
      correctPct: total === 0 ? 0 : Math.round((correct / total) * 100),
    };
  });
}

export function confidentlyWrongCount(answers: AnswerLike[]): number {
  return answers.filter((a) => a.confidence === "HIGH" && !a.isCorrect).length;
}

export function perQuestionStats(
  questions: { id: string; text: string }[],
  answers: AnswerLike[]
) {
  return questions.map((q) => {
    const forQuestion = answers.filter((a) => a.questionId === q.id);
    const correct = forQuestion.filter((a) => a.isCorrect).length;
    const total = forQuestion.length;
    return {
      questionId: q.id,
      text: q.text,
      correct,
      total,
      correctPct: total === 0 ? 0 : Math.round((correct / total) * 100),
      confidentlyWrong: confidentlyWrongCount(forQuestion),
    };
  });
}
