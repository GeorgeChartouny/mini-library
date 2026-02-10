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
  const { canMutate, session } = await requireAuth();
  const { query = "", status = "ALL", sort = "title" } = await searchParams;
  const currentUserEmail = session?.user?.email ?? null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Books
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Search, filter, and manage the collection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/books/suggest" className="btn-ai">
            Find a book (AI)
          </Link>
          {canMutate && (
            <Link href="/books/new" className="btn-primary">
              Add Book
            </Link>
          )}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="card flex items-center justify-center py-12">
            <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
          </div>
        }
      >
        <BooksPageContent query={query} status={status} sort={sort} canMutate={canMutate} currentUserEmail={currentUserEmail} />
      </Suspense>
    </div>
  );
}

async function BooksPageContent({
  query,
  status,
  sort,
  canMutate,
  currentUserEmail,
}: {
  query: string;
  status: string;
  sort: string;
  canMutate: boolean;
  currentUserEmail: string | null;
}) {
  const books = await getBooksList({ query, status, sort });
  return (
    <BooksList
      initialBooks={books}
      query={query}
      status={status}
      sort={sort}
      canMutate={canMutate}
      currentUserEmail={currentUserEmail}
    />
  );
}
