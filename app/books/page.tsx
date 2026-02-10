import { Suspense } from "react";
import { getBooksList } from "@/lib/books";
import { BooksList } from "./books-list";
import { requireAuth } from "@/lib/auth-server";
import Link from "next/link";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; sort?: string }>;
}) {
  const { canMutate } = await requireAuth();
  const { query = "", status = "ALL", sort = "title" } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Books</h1>
        {canMutate && (
          <Link
            href="/books/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add Book
          </Link>
        )}
      </div>
      <Suspense fallback={<div className="text-zinc-500">Loading…</div>}>
        <BooksPageContent query={query} status={status} sort={sort} canMutate={canMutate} />
      </Suspense>
    </div>
  );
}

async function BooksPageContent({
  query,
  status,
  sort,
  canMutate,
}: {
  query: string;
  status: string;
  sort: string;
  canMutate: boolean;
}) {
  const books = await getBooksList({ query, status, sort });
  return (
    <BooksList
      initialBooks={books}
      query={query}
      status={status}
      sort={sort}
      canMutate={canMutate}
    />
  );
}
