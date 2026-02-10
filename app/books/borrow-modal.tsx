"use client";

import { useState, useEffect } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{10,}$/;

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return EMAIL_REGEX.test(trimmed) ? null : "Enter a valid email (e.g. name@example.com)";
}

function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length < 10) return "Enter at least 10 digits (e.g. +1 234 567 8900)";
  return PHONE_REGEX.test(trimmed) ? null : "Enter a valid phone (digits, spaces, dashes, or +1…)";
}

export type BorrowFormData = {
  borrowerName: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  dueAt?: string;
};

type BorrowModalProps = {
  open: boolean;
  onClose: () => void;
  bookTitle?: string;
  onSubmit: (data: BorrowFormData) => void;
  loading?: boolean;
};

export function BorrowModal({
  open,
  onClose,
  bookTitle,
  onSubmit,
  loading = false,
}: BorrowModalProps) {
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBorrowerName("");
      setBorrowerEmail("");
      setBorrowerPhone("");
      setDueDate("");
      setEmailError(null);
      setPhoneError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = borrowerName.trim();
    if (!name) return;
    const emailErr = validateEmail(borrowerEmail);
    const phoneErr = validatePhone(borrowerPhone);
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    if (emailErr || phoneErr) return;
    const dueAt = dueDate.trim() ? new Date(dueDate).toISOString() : undefined;
    onSubmit({
      borrowerName: name,
      borrowerEmail: borrowerEmail.trim() || undefined,
      borrowerPhone: borrowerPhone.trim() || undefined,
      dueAt,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrow-modal-title"
    >
      <div
        className="card w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="borrow-modal-title"
          className="mb-5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Borrow (Check-out){bookTitle ? `: ${bookTitle}` : ""}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="borrow-modal-name"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Borrower name *
            </label>
            <input
              id="borrow-modal-name"
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              required
              autoFocus
              placeholder="Enter name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label
              htmlFor="borrow-modal-email"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email (optional, for overdue reminders)
            </label>
            <input
              id="borrow-modal-email"
              type="email"
              value={borrowerEmail}
              onChange={(e) => {
                setBorrowerEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => setEmailError(validateEmail(borrowerEmail))}
              placeholder="borrower@example.com"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-1 dark:bg-zinc-800 dark:text-zinc-100 ${
                emailError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-600"
              }`}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "borrow-modal-email-error" : undefined}
            />
            {emailError && (
              <p
                id="borrow-modal-email-error"
                role="alert"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
              >
                {emailError}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="borrow-modal-phone"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Phone (optional, for call/text reminders)
            </label>
            <input
              id="borrow-modal-phone"
              type="tel"
              value={borrowerPhone}
              onChange={(e) => {
                setBorrowerPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => setPhoneError(validatePhone(borrowerPhone))}
              placeholder="+1 234 567 8900"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-1 dark:bg-zinc-800 dark:text-zinc-100 ${
                phoneError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-600"
              }`}
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? "borrow-modal-phone-error" : undefined}
            />
            {phoneError && (
              <p
                id="borrow-modal-phone-error"
                role="alert"
                className="mt-1 text-xs text-red-600 dark:text-red-400"
              >
                {phoneError}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="borrow-modal-due"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Due date (optional)
            </label>
            <input
              id="borrow-modal-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !borrowerName.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Borrowing…" : "Borrow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
