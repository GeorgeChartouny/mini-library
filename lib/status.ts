import type { Loan } from "@prisma/client";

export type BookStatus = "AVAILABLE" | "BORROWED";

export function getActiveLoan(loans: Loan[]): Loan | null {
  return loans.find((l) => l.returnedAt === null) ?? null;
}

export function getDerivedStatus(loans: Loan[]): BookStatus {
  return getActiveLoan(loans) ? "BORROWED" : "AVAILABLE";
}

/** Compare dueAt to start of today (UTC). */
export function isOverdue(loan: Loan): boolean {
  if (loan.returnedAt !== null) return false;
  if (loan.dueAt === null) return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return loan.dueAt < today;
}
