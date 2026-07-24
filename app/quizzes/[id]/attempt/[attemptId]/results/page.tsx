import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ParsedOption } from "@/lib/aiken";

export default async function AttemptResultsPage({
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
      answers: true,
    },
  });

  if (!attempt || attempt.quizId !== quizId || attempt.userId !== session.user.id) {
    notFound();
  }

  if (!attempt.submittedAt) {
    redirect(`/quizzes/${quizId}/attempt/${attemptId}`);
  }

  const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const total = attempt.quiz.questions.length;

  const highConfidence = attempt.answers.filter((a) => a.confidence === "HIGH");
  const highConfidenceCorrect = highConfidence.filter((a) => a.isCorrect).length;
  const highConfidenceWrong = highConfidence.length - highConfidenceCorrect;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {attempt.quiz.title} — Results
      </h1>
      <p className="mt-2 text-lg text-zinc-700">
        Score: <span className="font-semibold">{attempt.score}</span> / {total}
      </p>

      {highConfidence.length > 0 && (
        <p className="mt-1 text-sm text-zinc-600">
          Of your {highConfidence.length} High-confidence answer
          {highConfidence.length === 1 ? "" : "s"}, {highConfidenceCorrect} were
          correct{" "}
          {highConfidenceWrong > 0 && (
            <span className="text-amber-700">
              ({highConfidenceWrong} confidently wrong — worth reviewing)
            </span>
          )}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {attempt.quiz.questions.map((q, index) => {
          const answer = answersByQuestion.get(q.id);
          const options = q.options as unknown as ParsedOption[];
          return (
            <div
              key={q.id}
              className={`rounded-lg border p-5 ${
                answer?.isCorrect
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p className="text-sm font-medium text-zinc-500">
                Question {index + 1}
              </p>
              <p className="mt-1 font-medium text-zinc-900">{q.text}</p>

              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {options.map((opt) => {
                  const isCorrectOpt = opt.label === q.correctLabel;
                  const isSelected = opt.label === answer?.selectedLabel;
                  return (
                    <li
                      key={opt.label}
                      className={
                        isCorrectOpt
                          ? "font-medium text-emerald-700"
                          : isSelected
                            ? "font-medium text-red-700"
                            : "text-zinc-600"
                      }
                    >
                      {opt.label}) {opt.text}
                      {isCorrectOpt && " (correct answer)"}
                      {isSelected && !isCorrectOpt && " (your answer)"}
                    </li>
                  );
                })}
              </ul>

              {answer && (
                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                  Your confidence: {answer.confidence}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
