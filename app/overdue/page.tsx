import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOverdueLoans } from "@/lib/books";

export default async function OverduePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/books");
  let overdue: Awaited<ReturnType<typeof getOverdueLoans>> = [];
  try {
    overdue = await getOverdueLoans();
  } catch (err) {
    console.error("Overdue page error:", err);
    return (
      <div className="space-y-8">
        <Link href="/" className="btn-secondary inline-flex">
          ← Dashboard
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Overdue loans
          </h1>
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
          >
            Failed to load overdue loans. Check the console for details.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <Link href="/" className="btn-secondary inline-flex">
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Overdue loans
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Contact borrowers to remind them to return books. Use Email to open
          your mail client with a pre-filled reminder, or Call/Text directly.
        </p>
      </div>
      {overdue.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No overdue loans.
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
                    Borrower
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Due date
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Phone
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((loan) => {
                  const subject = encodeURIComponent(
                    `Overdue: Please return "${loan.bookTitle}"`
                  );
                  const body = encodeURIComponent(
                    `Hi ${loan.borrowerName},\n\nThis is a reminder that "${loan.bookTitle}" was due on ${new Date(loan.dueAt).toLocaleDateString()}. Please return it at your earliest convenience.\n\nThank you,\nLibrary`
                  );
                  const mailto = loan.borrowerEmail
                    ? `mailto:${loan.borrowerEmail}?subject=${subject}&body=${body}`
                    : null;
                  const tel = loan.borrowerPhone
                    ? `tel:${loan.borrowerPhone.replace(/\s/g, "")}`
                    : null;
                  const sms = loan.borrowerPhone
                    ? `sms:${loan.borrowerPhone.replace(/\s/g, "")}?body=${encodeURIComponent(`Hi ${loan.borrowerName}, reminder: "${loan.bookTitle}" is overdue. Please return it. Thank you!`)}`
                    : null;
                  return (
                    <tr
                      key={loan.id}
                      className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/books/${loan.bookId}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {loan.bookTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {loan.borrowerName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(loan.dueAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {loan.borrowerEmail ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {loan.borrowerPhone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {mailto ? (
                            <a
                              href={mailto}
                              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium leading-none text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                            >
                              Email reminder
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              No email
                            </span>
                          )}
                          {tel ? (
                            <a
                              href={tel}
                              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium leading-none hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            >
                              Call
                            </a>
                          ) : null}
                          {sms ? (
                            <a
                              href={sms}
                              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium leading-none hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            >
                              Text
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
