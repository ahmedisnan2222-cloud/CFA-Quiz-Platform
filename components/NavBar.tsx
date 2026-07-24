import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function NavBar() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          CFA Quiz Platform
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-700">
          {session?.user ? (
            <>
              {session.user.role === "ADMIN" ? (
                <Link href="/admin/quizzes">Admin</Link>
              ) : (
                <Link href="/quizzes">Quizzes</Link>
              )}
              <span className="text-zinc-400">{session.user.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
