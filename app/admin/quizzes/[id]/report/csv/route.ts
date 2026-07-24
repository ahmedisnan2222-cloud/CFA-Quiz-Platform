import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string | number | boolean) {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      attempts: {
        where: { submittedAt: { not: null } },
        include: { user: true, answers: true },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const questionIndexById = new Map(quiz.questions.map((q, i) => [q.id, i + 1]));

  const header = [
    "studentName",
    "studentEmail",
    "attemptId",
    "submittedAt",
    "score",
    "totalQuestions",
    "questionNumber",
    "questionText",
    "selectedLabel",
    "correctLabel",
    "isCorrect",
    "confidence",
    "confidentlyWrong",
  ];

  const questionsById = new Map(quiz.questions.map((q) => [q.id, q]));

  const rows: string[] = [header.join(",")];

  for (const attempt of quiz.attempts) {
    for (const answer of attempt.answers) {
      const question = questionsById.get(answer.questionId);
      const confidentlyWrong = answer.confidence === "HIGH" && !answer.isCorrect;
      rows.push(
        [
          csvEscape(attempt.user.name),
          csvEscape(attempt.user.email),
          csvEscape(attempt.id),
          csvEscape(attempt.submittedAt?.toISOString() ?? ""),
          csvEscape(attempt.score ?? ""),
          csvEscape(quiz.questions.length),
          csvEscape(questionIndexById.get(answer.questionId) ?? ""),
          csvEscape(question?.text ?? ""),
          csvEscape(answer.selectedLabel),
          csvEscape(question?.correctLabel ?? ""),
          csvEscape(answer.isCorrect),
          csvEscape(answer.confidence),
          csvEscape(confidentlyWrong),
        ].join(",")
      );
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${quiz.title.replace(/[^a-z0-9]+/gi, "_")}_report.csv"`,
    },
  });
}
