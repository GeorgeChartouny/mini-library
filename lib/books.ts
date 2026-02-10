import type { Book, Loan } from "../node_modules/.prisma/client";
import { getActiveLoan, getDerivedStatus, isOverdue } from "./status";
import { prisma } from "./prisma";

export type BookWithLoans = Book & { loans: Loan[] };

const SORT_VALUES = ["title", "author", "newest", "oldest"] as const;
const STATUS_VALUES = ["ALL", "AVAILABLE", "BORROWED"] as const;

export type ListBooksParams = {
  query?: string;
  status?: string;
  sort?: string;
};

export async function getBooksList(params: ListBooksParams = {}) {
  const query = (params.query ?? "").trim();
  const status = (params.status ?? "ALL").toUpperCase();
  const sort = (params.sort ?? "title") as (typeof SORT_VALUES)[number];

  const books = await prisma.book.findMany({
    include: { loans: true },
    where: {
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { author: { contains: query } },
              ...(query.match(/^\d[\d-]*$/)
                ? [{ isbn: { contains: query } }]
                : []),
              { category: { contains: query } },
              { description: { contains: query } },
            ].filter(Boolean),
          }
        : {}),
    },
    orderBy:
      sort === "title"
        ? { title: "asc" }
        : sort === "author"
          ? { author: "asc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : { createdAt: "asc" },
  });

  let filtered: BookWithLoans[] = books;
  if (status === "AVAILABLE") {
    filtered = books.filter((b: BookWithLoans) => getDerivedStatus(b.loans) === "AVAILABLE");
  } else if (status === "BORROWED") {
    filtered = books.filter((b: BookWithLoans) => getDerivedStatus(b.loans) === "BORROWED");
  }

  return filtered.map(toBookResponse);
}

export type ActiveLoanInfo = {
  borrowerName: string;
  borrowerEmail: string | null;
  borrowerPhone: string | null;
  borrowedAt: string;
  dueAt: string | null;
};

export function toBookResponse(book: BookWithLoans) {
  const active = getActiveLoan(book.loans);
  const status = getDerivedStatus(book.loans);
  const overdue = active ? isOverdue(active) : false;
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    category: book.category,
    publishedYear: book.publishedYear,
    description: book.description,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    status,
    activeLoan: active
      ? {
          borrowerName: active.borrowerName,
          borrowerEmail: active.borrowerEmail ?? null,
          borrowerPhone: active.borrowerPhone ?? null,
          borrowedAt: active.borrowedAt.toISOString(),
          dueAt: active.dueAt?.toISOString() ?? null,
        }
      : null,
    overdue,
  };
}

export function toBookDetailResponse(book: BookWithLoans) {
  const base = toBookResponse(book);
  const loanHistory = [...book.loans]
    .sort(
      (a, b) =>
        new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime()
    )
    .map((l) => ({
      id: l.id,
      borrowerName: l.borrowerName,
      borrowerEmail: l.borrowerEmail ?? null,
      borrowerPhone: l.borrowerPhone ?? null,
      borrowedAt: l.borrowedAt.toISOString(),
      dueAt: l.dueAt?.toISOString() ?? null,
      returnedAt: l.returnedAt?.toISOString() ?? null,
    }));
  return { ...base, loanHistory };
}

export type OverdueLoanItem = {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerName: string;
  borrowerEmail: string | null;
  borrowerPhone: string | null;
  borrowedAt: string;
  dueAt: string;
};

export async function getLoansByBorrowerEmail(
  email: string
): Promise<
  Array<{
    id: string;
    bookId: string;
    bookTitle: string;
    borrowerName: string;
    borrowedAt: string;
    dueAt: string | null;
    returnedAt: string | null;
    overdue: boolean;
  }>
> {
  const loans = await prisma.loan.findMany({
    where: { borrowerEmail: email },
    include: { book: true },
    orderBy: { borrowedAt: "desc" },
  });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return loans.map((l) => ({
    id: l.id,
    bookId: l.bookId,
    bookTitle: l.book.title,
    borrowerName: l.borrowerName,
    borrowedAt: l.borrowedAt.toISOString(),
    dueAt: l.dueAt?.toISOString() ?? null,
    returnedAt: l.returnedAt?.toISOString() ?? null,
    overdue:
      l.returnedAt === null &&
      l.dueAt !== null &&
      l.dueAt < today,
  }));
}

export async function getOverdueLoans(): Promise<OverdueLoanItem[]> {
  const loans = await prisma.loan.findMany({
    where: {
      returnedAt: null,
      dueAt: { not: null },
    },
    include: { book: true },
  });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return loans
    .filter((l) => l.dueAt && l.dueAt < today)
    .map((l) => ({
      id: l.id,
      bookId: l.bookId,
      bookTitle: l.book?.title ?? "Unknown",
      borrowerName: l.borrowerName,
      borrowerEmail: l.borrowerEmail ?? null,
      borrowerPhone: l.borrowerPhone ?? null,
      borrowedAt: l.borrowedAt.toISOString(),
      dueAt: l.dueAt!.toISOString(),
    }));
}
