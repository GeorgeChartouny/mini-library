import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveLoan, getDerivedStatus, isOverdue } from "@/lib/status";
import { requireAuth } from "@/lib/auth-server";

async function getStats() {
  const books = await prisma.book.findMany({ include: { loans: true } });
  let available = 0;
  let borrowed = 0;
  let overdue = 0;
  for (const book of books) {
    const status = getDerivedStatus(book.loans);
    if (status === "AVAILABLE") available++;
    else {
      borrowed++;
      const active = getActiveLoan(book.loans);
      if (active && isOverdue(active)) overdue++;
    }
  }
  return { total: books.length, available, borrowed, overdue };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/books");
  const [stats, { canMutate }] = await Promise.all([getStats(), requireAuth()]);
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Overview of your library collection and loans.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6 transition hover:shadow-md">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total books
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {stats.total}
          </p>
        </div>
        <div className="card p-6 transition hover:shadow-md">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Available
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.available}
          </p>
        </div>
        <div className="card p-6 transition hover:shadow-md">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Borrowed
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {stats.borrowed}
          </p>
        </div>
        <Link
          href="/overdue"
          className="card flex flex-col justify-center p-6 transition hover:shadow-md hover:border-red-200 dark:hover:border-red-900/50"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Overdue
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {stats.overdue}
          </p>
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        {canMutate && (
          <Link href="/books/new" className="btn-primary">
            Add Book
          </Link>
        )}
        <Link href="/books" className="btn-secondary">
          View Books
        </Link>
      </div>
    </div>
  );
}
