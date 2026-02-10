import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toBookDetailResponse } from "@/lib/books";
import { BookActions } from "./book-actions";
import { requireAuth } from "@/lib/auth-server";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { canMutate }] = await Promise.all([
    params,
    requireAuth(),
  ]);
  const book = await prisma.book.findUnique({
    where: { id },
    include: { loans: true },
  });
  if (!book) notFound();
  const data = toBookDetailResponse(book);
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/books"
          className="btn-secondary inline-flex items-center gap-1 text-sm"
        >
          ← Back to Books
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {data.title}
          </h1>
          <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">
            {data.author}
            {data.category && ` · ${data.category}`}
          </p>
        </div>
        <div className="flex gap-3">
          {canMutate && (
            <Link href={`/books/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
          )}
          <BookActions
            bookId={id}
            bookTitle={data.title}
            status={data.status}
            activeLoan={data.activeLoan}
            canMutate={canMutate}
          />
        </div>
      </div>
      <div className="card p-6">
        <p className="mb-4">
          <span
            className={
              data.overdue
                ? "badge-overdue"
                : data.status === "BORROWED"
                  ? "badge-borrowed"
                  : "badge-available"
            }
          >
            {data.overdue ? "OVERDUE" : data.status}
          </span>
        </p>
        {data.isbn && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ISBN: {data.isbn}
          </p>
        )}
        {data.publishedYear && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Published: {data.publishedYear}
          </p>
        )}
        {data.description && (
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            {data.description}
          </p>
        )}
        {data.activeLoan && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Current loan
            </p>
            <p className="mt-1 text-zinc-700 dark:text-zinc-300">
              Borrower: {data.activeLoan.borrowerName}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Borrowed: {new Date(data.activeLoan.borrowedAt).toLocaleString()}
            </p>
            {data.activeLoan.dueAt && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Due: {new Date(data.activeLoan.dueAt).toLocaleDateString()}
                {data.overdue && " (overdue)"}
              </p>
            )}
          </div>
        )}
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Loan history
        </h2>
        {data.loanHistory.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No loan history.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Borrower
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Borrowed
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Due
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Returned
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.loanHistory.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  >
                    <td className="px-4 py-3">{loan.borrowerName}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {new Date(loan.borrowedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {loan.dueAt
                        ? new Date(loan.dueAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {loan.returnedAt
                        ? new Date(loan.returnedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
