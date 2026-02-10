"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publishedYear: number | null;
  description: string | null;
};

export function EditBookForm({ id }: { id: string }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setBook(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleGenerateDescription() {
    if (!book) return;
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          category: book.category ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate");
      }
      const data = await res.json();
      setBook((prev) =>
        prev ? { ...prev, description: data.description ?? "" } : null
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!book) return;
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim();
    if (!title || !author) {
      setError("Title and author are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          isbn: (formData.get("isbn") as string)?.trim() || null,
          category: (formData.get("category") as string)?.trim() || null,
          publishedYear: (formData.get("publishedYear") as string)?.trim()
            ? parseInt((formData.get("publishedYear") as string), 10)
            : null,
          description: (formData.get("description") as string)?.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update book");
        return;
      }
      router.push(`/books/${id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }
  if (!book) {
    return (
      <div className="card py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">Book not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href={`/books/${id}`} className="btn-secondary inline-flex">
        ← Back to Book
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Edit Book
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Update the book details below.
        </p>
      </div>
      <form onSubmit={onSubmit} className="card max-w-xl space-y-4 p-6">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title *
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={book.title}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="author" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Author *
          </label>
          <input
            id="author"
            name="author"
            required
            defaultValue={book.author}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="isbn" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ISBN
          </label>
          <input
            id="isbn"
            name="isbn"
            defaultValue={book.isbn ?? ""}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={book.category ?? ""}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="publishedYear" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Published Year
          </label>
          <input
            id="publishedYear"
            name="publishedYear"
            type="number"
            min="1"
            max="2100"
            defaultValue={book.publishedYear ?? ""}
            className="input-field"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDesc}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
            >
              {generatingDesc ? "Generating…" : "Generate with AI"}
            </button>
          </div>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={book.description ?? ""}
            onChange={(e) =>
              setBook((prev) =>
                prev ? { ...prev, description: e.target.value } : null
              )
            }
            className="input-field min-h-[100px] resize-y"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link href={`/books/${id}`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
