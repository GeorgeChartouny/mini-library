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
        className="flex flex-wrap items-center gap-3"
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
          className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded border border-zinc-300 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="ALL">All</option>
          <option value="AVAILABLE">Available</option>
          <option value="BORROWED">Borrowed</option>
        </select>
        <input type="hidden" name="sort" value={sort} />
        <button
          type="submit"
          className="rounded bg-zinc-800 px-3 py-1.5 text-white dark:bg-zinc-200 dark:text-zinc-900"
        >
          Search
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
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
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              sort === value
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {books.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700">
          No books found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Author</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Borrower</th>
                <th className="p-3 font-medium">Due</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3">
                    <Link
                      href={`/books/${book.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {book.title}
                    </Link>
                  </td>
                  <td className="p-3">{book.author}</td>
                  <td className="p-3">{book.category ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        book.overdue
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : book.status === "BORROWED"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {book.overdue ? "OVERDUE" : book.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {book.activeLoan?.borrowerName ?? "—"}
                  </td>
                  <td className="p-3">
                    {book.activeLoan?.dueAt
                      ? new Date(book.activeLoan.dueAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/books/${book.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View
                      </Link>
                      {canMutate && (
                        <>
                          <Link
                            href={`/books/${book.id}/edit`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(book.id)}
                            disabled={loadingAction !== null}
                            className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
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
                              className="text-zinc-700 hover:underline disabled:opacity-50 dark:text-zinc-300"
                            >
                              Borrow (Check-out)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCheckin(book.id)}
                              disabled={loadingAction !== null}
                              className="text-zinc-700 hover:underline disabled:opacity-50 dark:text-zinc-300"
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
      )}
    </div>
  );
}
