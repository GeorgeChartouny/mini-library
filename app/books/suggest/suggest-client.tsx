"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Suggestion = {
  book: {
    id: string;
    title: string;
    author: string;
    category: string | null;
    description: string | null;
  };
  reason: string;
};

type BookSuggestionRow = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  notes: string | null;
  createdAt: string;
};

export function SuggestClient() {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [input3, setInput3] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [aiSuggestedBook, setAiSuggestedBook] = useState<{
    title: string;
    author: string;
    category?: string;
  } | null>(null);
  const [suggestedToAdd, setSuggestedToAdd] = useState<BookSuggestionRow[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addAuthor, setAddAuthor] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingAi, setAddingAi] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const showSuggestToAddSection =
    suggestions !== null && suggestions.length === 0;

  async function loadSuggestedToAdd() {
    setLoadingSuggested(true);
    try {
      const res = await fetch("/api/books/suggestions");
      const json = await res.json();
      if (res.ok) setSuggestedToAdd(json.data ?? []);
    } catch {
      setSuggestedToAdd([]);
    } finally {
      setLoadingSuggested(false);
    }
  }

  useEffect(() => {
    if (suggestions !== null && suggestions.length === 0) loadSuggestedToAdd();
  }, [suggestions]);

  async function handleAddSuggestion(e: React.FormEvent) {
    e.preventDefault();
    const title = addTitle.trim();
    const author = addAuthor.trim();
    if (!title || !author) {
      setAddError("Title and author are required.");
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/books/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          category: addCategory.trim() || undefined,
          notes: addNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data?.error ?? data?.details?.title?.[0] ?? "Failed to add suggestion.");
        return;
      }
      setAddTitle("");
      setAddAuthor("");
      setAddCategory("");
      setAddNotes("");
      setSuggestedToAdd((prev) => [data.data, ...prev]);
    } catch {
      setAddError("Failed to add suggestion.");
    } finally {
      setAdding(false);
    }
  }

  async function handleAddAiSuggestion() {
    if (!aiSuggestedBook) return;
    setAddError(null);
    setAddingAi(true);
    try {
      const res = await fetch("/api/books/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiSuggestedBook.title,
          author: aiSuggestedBook.author,
          category: aiSuggestedBook.category || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data?.error ?? "Failed to add suggestion.");
        return;
      }
      setAiSuggestedBook(null);
      setSuggestedToAdd((prev) => [data.data, ...prev]);
    } catch {
      setAddError("Failed to add suggestion.");
    } finally {
      setAddingAi(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inputs = [input1, input2, input3].filter((s) => s.trim());
    if (inputs.length === 0) {
      setError("Enter at least one preference (e.g. genre, mood, or topic).");
      return;
    }
    setError(null);
    setSuggestions(null);
    setAiSuggestedBook(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? data?.error ?? "Failed to get suggestions.");
        return;
      }
      setSuggestions(data.suggestions ?? []);
      setAiSuggestedBook(data.aiSuggestedBook ?? null);
    } catch {
      setError("Failed to get suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="block mb-1">Preference 1</span>
            <input
              type="text"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              placeholder="e.g. sci-fi"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              disabled={loading}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="block mb-1">Preference 2</span>
            <input
              type="text"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              placeholder="e.g. short read"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              disabled={loading}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="block mb-1">Preference 3</span>
            <input
              type="text"
              value={input3}
              onChange={(e) => setInput3(e.target.value)}
              placeholder="e.g. for vacation"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              disabled={loading}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-ai w-full disabled:opacity-70"
        >
          {loading ? "Finding books…" : "Find books"}
        </button>
      </form>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {suggestions !== null && suggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Suggested books</h2>
          <ul className="space-y-3">
            {suggestions.map(({ book, reason }) => (
              <li
                key={book.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link
                  href={`/books/${book.id}`}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {book.title}
                </Link>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {book.author}
                  {book.category && ` · ${book.category}`}
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestToAddSection && (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            What you’re looking for is not available on our shelves right now.
            {aiSuggestedBook
              ? " We’ve suggested a book below—add it to our suggestion list or suggest a different one."
              : " You can suggest a book you’d like us to add to the collection."}
          </p>
          {aiSuggestedBook && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Suggested book
              </h2>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Based on your preferences, we suggest:
              </p>
              <p className="mt-2 font-medium">
                {aiSuggestedBook.title}
                <span className="font-normal text-zinc-600 dark:text-zinc-400">
                  {" "}
                  · {aiSuggestedBook.author}
                  {aiSuggestedBook.category && ` · ${aiSuggestedBook.category}`}
                </span>
              </p>
              <button
                type="button"
                onClick={handleAddAiSuggestion}
                disabled={addingAi}
                className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {addingAi ? "Adding…" : "Add to suggested books"}
              </button>
            </div>
          )}
          <h2 className="text-lg font-semibold">
            Add your own suggestion
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {aiSuggestedBook
              ? "Prefer a different book? Add it here:"
              : "Suggest a book you’d like us to add to the collection."}
          </p>
          <form onSubmit={handleAddSuggestion} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <span className="block mb-1">Title *</span>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Book title"
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={adding}
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <span className="block mb-1">Author *</span>
                <input
                  type="text"
                  value={addAuthor}
                  onChange={(e) => setAddAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={adding}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <span className="block mb-1">Category (optional)</span>
                <input
                  type="text"
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  placeholder="e.g. Fiction, Sci-Fi"
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={adding}
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <span className="block mb-1">Notes (optional)</span>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Why you’d like this book"
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={adding}
                />
              </label>
            </div>
            {addError && (
              <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
            )}
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {adding ? "Adding…" : "Add to suggested books"}
            </button>
          </form>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <h3 className="text-base font-semibold">
              Suggested books to be added to the library
            </h3>
            {loadingSuggested ? (
              <p className="mt-2 text-sm text-zinc-500">Loading…</p>
            ) : suggestedToAdd.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                No suggestions yet. Add one above.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {suggestedToAdd.map((row) => (
                  <li
                    key={row.id}
                    className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <span className="font-medium">{row.title}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {" "}
                      · {row.author}
                      {row.category && ` · ${row.category}`}
                    </span>
                    {row.notes && (
                      <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                        {row.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
