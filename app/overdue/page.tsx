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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Overdue loans</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 py-4 px-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Failed to load overdue loans. Check the console for details.
        </p>
      </div>
    );
  }
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
      <h1 className="text-2xl font-bold">Overdue loans</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Contact borrowers to remind them to return books. Use Email to open your
        mail client with a pre-filled reminder, or Call/Text directly.
      </p>
      {overdue.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700">
          No overdue loans.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium">Book</th>
                <th className="p-3 font-medium">Borrower</th>
                <th className="p-3 font-medium">Due date</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Actions</th>
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
                    <td className="p-3">{loan.borrowerName}</td>
                    <td className="p-3">
                      {new Date(loan.dueAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {loan.borrowerEmail ?? (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {loan.borrowerPhone ?? (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {mailto ? (
                          <a
                            href={mailto}
                            className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
                            className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                          >
                            Call
                          </a>
                        ) : null}
                        {sms ? (
                          <a
                            href={sms}
                            className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
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
      )}
    </div>
  );
}
