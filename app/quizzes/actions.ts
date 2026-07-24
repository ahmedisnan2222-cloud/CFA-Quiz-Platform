"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function startAttemptAction(quizId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new Error("Quiz not found");

  const now = new Date();
  if (now < quiz.opensAt || now > quiz.closesAt) {
    throw new Error("This quiz is not currently open");
  }

  const attempt = await prisma.attempt.create({
    data: { quizId, userId: session.user.id },
  });

  redirect(`/quizzes/${quizId}/attempt/${attempt.id}`);
}
