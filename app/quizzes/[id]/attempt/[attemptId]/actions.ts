"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { confidenceSchema } from "@/lib/validation";
import { z } from "zod";

const submitSchema = z.array(
  z.object({
    questionId: z.string(),
    selectedLabel: z.string(),
    confidence: confidenceSchema,
  })
);

const GRACE_MS = 60_000;

export type SubmitResult = { resultsUrl: string };

export async function submitAttemptAction(
  quizId: string,
  attemptId: string,
  answersJson: string
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { include: { questions: true } } },
  });

  if (!attempt || attempt.userId !== session.user.id || attempt.quizId !== quizId) {
    throw new Error("Attempt not found");
  }

  const resultsUrl = `/quizzes/${quizId}/attempt/${attemptId}/results`;

  if (attempt.submittedAt) {
    return { resultsUrl };
  }

  const deadline = new Date(
    Math.min(
      attempt.startedAt.getTime() + attempt.quiz.durationMinutes * 60_000,
      attempt.quiz.closesAt.getTime()
    )
  );

  if (Date.now() > deadline.getTime() + GRACE_MS) {
    throw new Error(
      "The time window for this attempt has passed. Contact your instructor."
    );
  }

  const parsed = submitSchema.safeParse(JSON.parse(answersJson));
  if (!parsed.success) {
    throw new Error("Invalid submission");
  }

  const questionsById = new Map(
    attempt.quiz.questions.map((q) => [q.id, q])
  );

  let score = 0;
  const answerRows = parsed.data
    .filter((a) => questionsById.has(a.questionId))
    .map((a) => {
      const question = questionsById.get(a.questionId)!;
      const isCorrect = question.correctLabel === a.selectedLabel;
      if (isCorrect) score += 1;
      return {
        attemptId,
        questionId: a.questionId,
        selectedLabel: a.selectedLabel,
        confidence: a.confidence,
        isCorrect,
      };
    });

  await prisma.$transaction([
    prisma.attemptAnswer.createMany({ data: answerRows }),
    prisma.attempt.update({
      where: { id: attemptId },
      data: { submittedAt: new Date(), score },
    }),
  ]);

  return { resultsUrl };
}
