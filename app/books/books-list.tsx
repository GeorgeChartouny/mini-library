"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BorrowModal } from "./borrow-modal";

type BookItem = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  status: string;
  activeLoan: {
    borrowerName: string;
    borrowerEmail?: string | null;
    borrowerPhone?: string | null;
    borrowedAt: string;
    dueAt: string | null;
  } | null;
  overdue: boolean;
};

export function BooksList({
  initialBooks,
  query,
  status,
  sort,
  canMutate = false,
}: {
  initialBooks: BookItem[];
  query: string;
  status: string;
  sort: string;
  canMutate?: boolean;
}) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [checkoutBook, setCheckoutBook] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Sync local state when server sends new data (search, checkout/checkin, refresh)
  useEffect(() => {
    setBooks(initialBooks);
  }, [initialBooks]);

  const searchParams = new URLSearchParams();
  if (query) searchParams.set("query", query);
  if (status !== "ALL") searchParams.set("status", status);
  if (sort !== "title") searchParams.set("sort", sort);
  const baseQuery = searchParams.toString();

  async function handleDelete(id: string) {
    if (!confirm("Delete this book? This cannot be undone.")) return;
    setLoadingAction(`delete-${id}`);
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== id));
        setDeletingId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete");
      }
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCheckoutSubmit(data: {
    borrowerName: string;
    borrowerEmail?: string;
    borrowerPhone?: string;
    dueAt?: string;
  }) {
    if (!checkoutBook) return;
    const id = checkoutBook.id;
    setLoadingAction(`checkout-${id}`);
    try {
      const res = await fetch(`/api/books/${id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerName: data.borrowerName,
          ...(data.borrowerEmail && { borrowerEmail: data.borrowerEmail }),
          ...(data.borrowerPhone && { borrowerPhone: data.borrowerPhone }),
          ...(data.dueAt && { dueAt: data.dueAt }),
        }),
      });
      if (res.ok) {
        setCheckoutBook(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to borrow");
      }
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCheckin(id: string) {
    setLoadingAction(`checkin-${id}`);
    try {
      const res = await fetch(`/api/books/${id}/checkin`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to return");
      }
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <BorrowModal
        open={checkoutBook !== null}
        onClose={() => setCheckoutBook(null)}
        bookTitle={checkoutBook?.title}
        onSubmit={handleCheckoutSubmit}
        loading={loadingAction?.startsWith("checkout-") ?? false}
      />
      <form
        className="card flex flex-wrap items-center gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const q = (form.querySelector('[name="query"]') as HTMLInputElement)
            ?.value;
          const s = (form.querySelector('[name="status"]') as HTMLSelectElement)
            ?.value;
          const sortSel = (form.querySelector(
            '[name="sort"]'
          ) as HTMLSelectElement)?.value;
          const p = new URLSearchParams();
          if (q) p.set("query", q);
          if (s && s !== "ALL") p.set("status", s);
          if (sortSel) p.set("sort", sortSel);
          router.push(`/books?${p.toString()}`);
        }}
      >
        <input
          type="search"
          name="query"
          defaultValue={query}
          placeholder="Search title, author, ISBN, category…"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-500"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">All</option>
          <option value="AVAILABLE">Available</option>
          <option value="BORROWED">Borrowed</option>
        </select>
        <input type="hidden" name="sort" value={sort} />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Sort by:
        </span>
        {(
          [
            { value: "title", label: "Title" },
            { value: "author", label: "Author" },
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              const p = new URLSearchParams();
              if (query) p.set("query", query);
              if (status !== "ALL") p.set("status", status);
              p.set("sort", value);
              router.push(`/books?${p.toString()}`);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              sort === value
                ? "bg-indigo-600 text-white dark:bg-indigo-500"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {books.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No books found. Try a different search or filter.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Title
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Author
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Category
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Borrower
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Due
                  </th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr
                    key={book.id}
                    className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/books/${book.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {book.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {book.author}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {book.category ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          book.overdue
                            ? "badge-overdue"
                            : book.status === "BORROWED"
                              ? "badge-borrowed"
                              : "badge-available"
                        }
                      >
                        {book.overdue ? "OVERDUE" : book.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.activeLoan?.borrowerName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.activeLoan?.dueAt
                        ? new Date(book.activeLoan.dueAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/books/${book.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                          View
                        </Link>
                        {canMutate && (
                          <>
                            <Link
                              href={`/books/${book.id}/edit`}
                              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(book.id)}
                              disabled={loadingAction !== null}
                              className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50 dark:text-red-400"
                            >
                              Delete
                            </button>
                            {book.status === "AVAILABLE" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setCheckoutBook({ id: book.id, title: book.title })
                                }
                                disabled={loadingAction !== null}
                                className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
                              >
                                Borrow (Check-out)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCheckin(book.id)}
                                disabled={loadingAction !== null}
                                className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
                              >
                                Return (Check-in)
                              </button>
                            )}
                          </>
                        )}
                      </div>
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
