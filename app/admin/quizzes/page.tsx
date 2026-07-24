import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminQuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Quizzes</h1>
        <Link
          href="/admin/quizzes/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New quiz
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {quizzes.length === 0 && (
          <p className="text-zinc-600">
            No quizzes yet. Create one to get started.
          </p>
        )}
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/admin/quizzes/${quiz.id}/report`}
            className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-zinc-900">{quiz.title}</h2>
              <span className="text-sm text-zinc-500">
                {quiz._count.questions} questions ·{" "}
                {quiz._count.attempts} attempts
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Open {quiz.opensAt.toLocaleString()} → {quiz.closesAt.toLocaleString()} ·{" "}
              {quiz.durationMinutes} min
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
