"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Nav() {
  const { data: session, status } = useSession();
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href={session ? "/" : "/books"}
          className="font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Mini Library
        </Link>
        {status === "authenticated" && (
          <>
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Dashboard
            </Link>
            <Link
              href="/overdue"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Overdue
            </Link>
          </>
        )}
        <Link
          href="/books"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Books
        </Link>
        {status === "authenticated" &&
          (session.user as { role?: string })?.role === "ADMIN" && (
            <Link
              href="/users"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Users
            </Link>
          )}
        {status === "authenticated" && (
          <Link
            href="/my-loans"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            My Loans
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-sm text-zinc-400">…</span>
          ) : session ? (
            <>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {(session.user as { role?: string })?.role === "ADMIN"
                  ? "Admin"
                  : (session.user as { role?: string })?.role === "LIBRARIAN"
                    ? "Librarian"
                    : "Member"}
              </span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {session.user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-200 dark:text-zinc-900"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
