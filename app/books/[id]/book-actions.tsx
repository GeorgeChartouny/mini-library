"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BorrowModal } from "../borrow-modal";

type ActiveLoan = {
  borrowerName: string;
  borrowerEmail?: string | null;
  borrowedAt: string;
  dueAt: string | null;
} | null;

function canReturn(
  canMutate: boolean,
  activeLoan: ActiveLoan,
  currentUserEmail: string | null
): boolean {
  if (!activeLoan) return false;
  if (canMutate) return true;
  if (!currentUserEmail || !activeLoan.borrowerEmail) return false;
  return (
    activeLoan.borrowerEmail.toLowerCase().trim() ===
    currentUserEmail.toLowerCase().trim()
  );
}

export function BookActions({
  bookId,
  bookTitle,
  status,
  activeLoan,
  canMutate = false,
  currentUserEmail = null,
}: {
  bookId: string;
  bookTitle?: string;
  status: string;
  activeLoan: ActiveLoan;
  canMutate?: boolean;
  currentUserEmail?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  async function handleCheckoutSubmit(data: {
    borrowerName: string;
    borrowerEmail?: string;
    borrowerPhone?: string;
    dueAt?: string;
  }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/checkout`, {
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
        setShowBorrowModal(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to borrow");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/checkin`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to return");
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "AVAILABLE") {
    if (!canMutate) return null;
    return (
      <>
        <BorrowModal
          open={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          bookTitle={bookTitle}
          onSubmit={handleCheckoutSubmit}
          loading={loading}
        />
        <button
          type="button"
          onClick={() => setShowBorrowModal(true)}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "…" : "Borrow (Check-out)"}
        </button>
      </>
    );
  }
  if (!canReturn(canMutate, activeLoan, currentUserEmail)) return null;
  return (
    <button
      type="button"
      onClick={handleCheckin}
      disabled={loading}
      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-500 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-400"
    >
      {loading ? "…" : "Return (Check-in)"}
    </button>
  );
}
