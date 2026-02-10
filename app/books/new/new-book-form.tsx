"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function NewBookForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  async function handleGenerateDescription(
    title: string,
    author: string,
    category: string
  ) {
    if (!title?.trim() || !author?.trim()) {
      alert("Enter title and author first.");
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          category: category?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate");
      }
      const data = await res.json();
      const descEl = document.getElementById("description") as HTMLTextAreaElement;
      if (descEl) descEl.value = data.description ?? "";
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim();
    if (!title || !author) {
      setError("Title and author are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          isbn: (formData.get("isbn") as string)?.trim() || undefined,
          category: (formData.get("category") as string)?.trim() || undefined,
          publishedYear: (formData.get("publishedYear") as string)?.trim()
            ? parseInt((formData.get("publishedYear") as string), 10)
            : undefined,
          description: (formData.get("description") as string)?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create book");
        return;
      }
      const book = await res.json();
      router.push(`/books/${book.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/books" className="btn-secondary inline-flex">
        ← Back to Books
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Add Book
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Add a new book to the library collection.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="card max-w-xl space-y-4 p-6"
      >
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
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
              onClick={() => {
                const title = (document.getElementById("title") as HTMLInputElement)?.value ?? "";
                const author = (document.getElementById("author") as HTMLInputElement)?.value ?? "";
                const category = (document.getElementById("category") as HTMLInputElement)?.value ?? "";
                handleGenerateDescription(title, author, category);
              }}
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
            className="input-field min-h-[100px] resize-y"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Book"}
          </button>
          <Link href="/books" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
