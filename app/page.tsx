import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin/quizzes" : "/quizzes");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-900">
        Timed CFA-style quizzes for your class
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600">
        Sign up as a student to take quizzes, or log in with your instructor
        account to manage them.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-800"
        >
          Create student account
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-5 py-2.5 hover:bg-zinc-100"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
