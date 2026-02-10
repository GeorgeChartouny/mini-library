"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewBookPage() {
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/books"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to Books
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Add Book</h1>
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
              onClick={() => {
                const title = (document.getElementById("title") as HTMLInputElement)?.value ?? "";
                const author = (document.getElementById("author") as HTMLInputElement)?.value ?? "";
                const category = (document.getElementById("category") as HTMLInputElement)?.value ?? "";
                handleGenerateDescription(title, author, category);
              }}
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
            className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Creating…" : "Create Book"}
          </button>
          <Link
            href="/books"
            className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
