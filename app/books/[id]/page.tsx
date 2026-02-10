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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/books"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to Books
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {data.author}
            {data.category && ` · ${data.category}`}
          </p>
        </div>
        <div className="flex gap-2">
          {canMutate && (
            <Link
              href={`/books/${id}/edit`}
              className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
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
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-2">
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
              data.overdue
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : data.status === "BORROWED"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            }`}
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
          <p className="mt-2 text-zinc-700 dark:text-zinc-300">
            {data.description}
          </p>
        )}
        {data.activeLoan && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm font-medium">Current loan</p>
            <p>Borrower: {data.activeLoan.borrowerName}</p>
            <p>Borrowed: {new Date(data.activeLoan.borrowedAt).toLocaleString()}</p>
            {data.activeLoan.dueAt && (
              <p>
                Due: {new Date(data.activeLoan.dueAt).toLocaleDateString()}
                {data.overdue && " (overdue)"}
              </p>
            )}
          </div>
        )}
      </div>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Loan history</h2>
        {data.loanHistory.length === 0 ? (
          <p className="text-zinc-500">No loan history.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="p-3 font-medium">Borrower</th>
                  <th className="p-3 font-medium">Borrowed</th>
                  <th className="p-3 font-medium">Due</th>
                  <th className="p-3 font-medium">Returned</th>
                </tr>
              </thead>
              <tbody>
                {data.loanHistory.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="p-3">{loan.borrowerName}</td>
                    <td className="p-3">
                      {new Date(loan.borrowedAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {loan.dueAt
                        ? new Date(loan.dueAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3">
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
