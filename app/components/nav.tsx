"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const navLink =
  "text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export function Nav() {
  const { data: session, status } = useSession();
  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href={session ? "/" : "/books"}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Mini Library
        </Link>
        <div className="flex flex-1 items-center gap-6">
          {status === "authenticated" && (
            <>
              <Link href="/" className={navLink}>
                Dashboard
              </Link>
              <Link href="/books" className={navLink}>
                Books
              </Link>
              <Link href="/overdue" className={navLink}>
                Overdue
              </Link>
              {(session.user as { role?: string })?.role === "ADMIN" && (
                <Link href="/users" className={navLink}>
                  Users
                </Link>
              )}
              <Link href="/my-loans" className={navLink}>
                My Loans
              </Link>
            </>
          )}
          {status !== "authenticated" && (
            <Link href="/books" className={navLink}>
              Books
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <span className="text-sm text-zinc-400">…</span>
          ) : session ? (
            <>
              <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
                {(session.user as { role?: string })?.role === "ADMIN"
                  ? "Admin"
                  : (session.user as { role?: string })?.role === "LIBRARIAN"
                    ? "Librarian"
                    : "Member"}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm text-zinc-700 dark:text-zinc-300 md:inline">
                {session.user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="btn-primary inline-flex items-center"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
