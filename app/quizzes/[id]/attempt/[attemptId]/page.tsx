import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AttemptClient } from "./AttemptClient";
import type { ParsedOption } from "@/lib/aiken";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id: quizId, attemptId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { include: { questions: { orderBy: { order: "asc" } } } },
    },
  });

  if (!attempt || attempt.quizId !== quizId || attempt.userId !== session.user.id) {
    notFound();
  }

  if (attempt.submittedAt) {
    redirect(`/quizzes/${quizId}/attempt/${attemptId}/results`);
  }

  const deadline = new Date(
    Math.min(
      attempt.startedAt.getTime() + attempt.quiz.durationMinutes * 60_000,
      attempt.quiz.closesAt.getTime()
    )
  );

  const questions = attempt.quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options as unknown as ParsedOption[],
  }));

  return (
    <AttemptClient
      quizId={quizId}
      attemptId={attemptId}
      quizTitle={attempt.quiz.title}
      deadlineIso={deadline.toISOString()}
      questions={questions}
    />
  );
}
