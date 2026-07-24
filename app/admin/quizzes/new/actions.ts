"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseAiken, AikenParseError, type ParsedQuestion } from "@/lib/aiken";
import { quizFormSchema } from "@/lib/validation";

export type PreviewState = {
  error?: string;
  questions?: ParsedQuestion[];
};

export async function previewAikenAction(
  _prev: PreviewState,
  formData: FormData
): Promise<PreviewState> {
  const text = String(formData.get("aikenText") ?? "");

  try {
    const questions = parseAiken(text);
    return { questions };
  } catch (err) {
    if (err instanceof AikenParseError) {
      return { error: err.message };
    }
    return { error: "Failed to parse Aiken text" };
  }
}

export type CreateQuizState = { error?: string };

export async function createQuizAction(
  _prev: CreateQuizState,
  formData: FormData
): Promise<CreateQuizState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Not authorized" };
  }

  const parsed = quizFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    opensAt: formData.get("opensAt"),
    closesAt: formData.get("closesAt"),
    durationMinutes: formData.get("durationMinutes"),
    aikenText: formData.get("aikenText"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { title, description, opensAt, closesAt, durationMinutes, aikenText } =
    parsed.data;

  let questions: ParsedQuestion[];
  try {
    questions = parseAiken(aikenText);
  } catch (err) {
    if (err instanceof AikenParseError) {
      return { error: err.message };
    }
    return { error: "Failed to parse Aiken text" };
  }

  const quiz = await prisma.$transaction(async (tx) => {
    const created = await tx.quiz.create({
      data: {
        title,
        description: description || null,
        opensAt: new Date(opensAt),
        closesAt: new Date(closesAt),
        durationMinutes,
        createdById: session.user.id,
      },
    });

    await tx.question.createMany({
      data: questions.map((q, index) => ({
        quizId: created.id,
        text: q.text,
        options: q.options,
        correctLabel: q.correctLabel,
        order: index,
      })),
    });

    return created;
  });

  redirect(`/admin/quizzes/${quiz.id}/report`);
}
