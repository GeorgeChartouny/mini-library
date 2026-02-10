import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLoansByBorrowerEmail } from "@/lib/books";

export default async function MyLoansPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/my-loans");
  const loans = await getLoansByBorrowerEmail(session.user.email);
  return (
    <div className="space-y-8">
      <Link href="/" className="btn-secondary inline-flex">
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          My Loans
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Books you have borrowed (matched by your account email).
        </p>
      </div>
      {loans.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No loans found for your account.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Book
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Borrowed
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Due
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/books/${loan.bookId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        {loan.bookTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {new Date(loan.borrowedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {loan.dueAt
                        ? new Date(loan.dueAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {loan.returnedAt ? (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Returned{" "}
                          {new Date(loan.returnedAt).toLocaleDateString()}
                        </span>
                      ) : loan.overdue ? (
                        <span className="badge-overdue">Overdue</span>
                      ) : (
                        <span className="badge-borrowed">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
