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

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (!book) return <p className="text-zinc-500">Book not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/books/${id}`}
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to Book
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Edit Book</h1>
      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title *
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={book.title}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="author" className="mb-1 block text-sm font-medium">
            Author *
          </label>
          <input
            id="author"
            name="author"
            required
            defaultValue={book.author}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="isbn" className="mb-1 block text-sm font-medium">
            ISBN
          </label>
          <input
            id="isbn"
            name="isbn"
            defaultValue={book.isbn ?? ""}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={book.category ?? ""}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="publishedYear" className="mb-1 block text-sm font-medium">
            Published Year
          </label>
          <input
            id="publishedYear"
            name="publishedYear"
            type="number"
            min="1"
            max="2100"
            defaultValue={book.publishedYear ?? ""}
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDesc}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
            >
              {generatingDesc ? "Generating…" : "Generate Description with AI"}
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
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link
            href={`/books/${id}`}
            className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
