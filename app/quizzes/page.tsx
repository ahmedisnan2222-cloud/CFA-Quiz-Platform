import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startAttemptAction } from "./actions";
import Link from "next/link";

function statusFor(opensAt: Date, closesAt: Date) {
  const now = new Date();
  if (now < opensAt) return "upcoming";
  if (now > closesAt) return "closed";
  return "open";
}

export default async function QuizzesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const quizzes = await prisma.quiz.findMany({
    orderBy: { opensAt: "desc" },
    include: {
      attempts: {
        where: { userId },
        orderBy: { startedAt: "desc" },
      },
      _count: { select: { questions: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">Quizzes</h1>

      <div className="mt-8 flex flex-col gap-4">
        {quizzes.length === 0 && (
          <p className="text-zinc-600">No quizzes have been published yet.</p>
        )}
        {quizzes.map((quiz) => {
          const status = statusFor(quiz.opensAt, quiz.closesAt);
          const priorAttempts = quiz.attempts;

          return (
            <div
              key={quiz.id}
              className="rounded-lg border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-zinc-900">{quiz.title}</h2>
                  {quiz.description && (
                    <p className="mt-1 text-sm text-zinc-600">
                      {quiz.description}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-zinc-500">
                    {quiz._count.questions} questions · {quiz.durationMinutes}{" "}
                    min · {quiz.opensAt.toLocaleString()} →{" "}
                    {quiz.closesAt.toLocaleString()}
                  </p>
                </div>

                {status === "open" && (
                  <form
                    action={async () => {
                      "use server";
                      await startAttemptAction(quiz.id);
                    }}
                  >
                    <button className="whitespace-nowrap rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                      {priorAttempts.length > 0 ? "Retake" : "Start"}
                    </button>
                  </form>
                )}
                {status === "upcoming" && (
                  <span className="whitespace-nowrap rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500">
                    Not open yet
                  </span>
                )}
                {status === "closed" && priorAttempts.length === 0 && (
                  <span className="whitespace-nowrap rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500">
                    Closed
                  </span>
                )}
              </div>

              {priorAttempts.length > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Your attempts
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {priorAttempts.map((a) => (
                      <li key={a.id} className="text-sm text-zinc-700">
                        {a.submittedAt ? (
                          <Link
                            href={`/quizzes/${quiz.id}/attempt/${a.id}/results`}
                            className="underline"
                          >
                            Score: {a.score}/{quiz._count.questions} —{" "}
                            {a.submittedAt.toLocaleString()}
                          </Link>
                        ) : (
                          <Link
                            href={`/quizzes/${quiz.id}/attempt/${a.id}`}
                            className="text-amber-700 underline"
                          >
                            In progress — resume
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
