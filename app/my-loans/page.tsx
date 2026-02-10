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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold">My Loans</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Books you have borrowed (matched by your account email).
      </p>
      {loans.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700">
          No loans found for your account.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium">Book</th>
                <th className="p-3 font-medium">Borrowed</th>
                <th className="p-3 font-medium">Due</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3">
                    <Link
                      href={`/books/${loan.bookId}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {loan.bookTitle}
                    </Link>
                  </td>
                  <td className="p-3">
                    {new Date(loan.borrowedAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {loan.dueAt
                      ? new Date(loan.dueAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    {loan.returnedAt ? (
                      <span className="text-zinc-500">
                        Returned {new Date(loan.returnedAt).toLocaleDateString()}
                      </span>
                    ) : loan.overdue ? (
                      <span className="text-red-600 dark:text-red-400">
                        Overdue
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
