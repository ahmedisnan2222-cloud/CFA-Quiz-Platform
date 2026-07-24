import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  calibrationMatrix,
  confidentlyWrongCount,
  perQuestionStats,
} from "@/lib/reportStats";

export default async function QuizReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      attempts: {
        where: { submittedAt: { not: null } },
        orderBy: { submittedAt: "desc" },
        include: { user: true, answers: true },
      },
    },
  });

  if (!quiz) notFound();

  const allAnswers = quiz.attempts.flatMap((a) => a.answers);
  const matrix = calibrationMatrix(allAnswers);
  const totalConfidentlyWrong = confidentlyWrongCount(allAnswers);
  const questionStats = perQuestionStats(quiz.questions, allAnswers);

  const scores = quiz.attempts.map((a) => a.score ?? 0);
  const avg =
    scores.length === 0
      ? 0
      : Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10;
  const high = scores.length ? Math.max(...scores) : 0;
  const low = scores.length ? Math.min(...scores) : 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{quiz.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {quiz.questions.length} questions · {quiz.attempts.length} submitted
            attempts
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/admin/quizzes/${quizId}/report/csv`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Export CSV
          </a>
          <Link
            href="/admin/quizzes"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            All quizzes
          </Link>
        </div>
      </div>

      <section className="mt-8 grid grid-cols-3 gap-4">
        <Stat label="Average score" value={`${avg} / ${quiz.questions.length}`} />
        <Stat label="High / Low" value={`${high} / ${low}`} />
        <Stat
          label="Confidently wrong"
          value={String(totalConfidentlyWrong)}
          highlight={totalConfidentlyWrong > 0}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900">
          Confidence calibration
        </h2>
        <table className="mt-3 w-full border-collapse overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2">Confidence</th>
              <th className="px-4 py-2">Correct</th>
              <th className="px-4 py-2">Incorrect</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">% correct</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.confidence} className="border-t border-zinc-100">
                <td className="px-4 py-2 font-medium">{row.confidence}</td>
                <td className="px-4 py-2">{row.correct}</td>
                <td className="px-4 py-2">
                  {row.confidence === "HIGH" && row.incorrect > 0 ? (
                    <span className="font-medium text-amber-700">
                      {row.incorrect}
                    </span>
                  ) : (
                    row.incorrect
                  )}
                </td>
                <td className="px-4 py-2">{row.total}</td>
                <td className="px-4 py-2">{row.correctPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900">Per-question stats</h2>
        <table className="mt-3 w-full border-collapse overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2">Question</th>
              <th className="px-4 py-2">% correct</th>
              <th className="px-4 py-2">Confidently wrong</th>
            </tr>
          </thead>
          <tbody>
            {questionStats.map((q, i) => (
              <tr key={q.questionId} className="border-t border-zinc-100">
                <td className="max-w-md px-4 py-2">
                  {i + 1}. {q.text}
                </td>
                <td className="px-4 py-2">{q.correctPct}%</td>
                <td className="px-4 py-2">
                  {q.confidentlyWrong > 0 ? (
                    <span className="font-medium text-amber-700">
                      {q.confidentlyWrong}
                    </span>
                  ) : (
                    0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900">Attempts</h2>
        <table className="mt-3 w-full border-collapse overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-zinc-500">
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {quiz.attempts.map((a) => (
              <tr key={a.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">
                  {a.user.name}{" "}
                  <span className="text-zinc-400">({a.user.email})</span>
                </td>
                <td className="px-4 py-2">
                  {a.score} / {quiz.questions.length}
                </td>
                <td className="px-4 py-2">{a.submittedAt?.toLocaleString()}</td>
              </tr>
            ))}
            {quiz.attempts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-zinc-500">
                  No submitted attempts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
