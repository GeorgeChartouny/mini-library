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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total books</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Available</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {stats.available}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Borrowed</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {stats.borrowed}
          </p>
        </div>
        <Link
          href="/overdue"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-200 dark:hover:border-red-900/50"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Overdue</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {stats.overdue}
          </p>
        </Link>
      </div>
      <div className="flex flex-wrap gap-4">
        {canMutate && (
          <Link
            href="/books/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add Book
          </Link>
        )}
        <Link
          href="/books"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          View Books
        </Link>
      </div>
    </div>
  );
}
