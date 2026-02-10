import Link from "next/link";
import { SuggestClient } from "./suggest-client";

export default function SuggestPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/books"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Books
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Find a book</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Tell us what you’re in the mood for (e.g. genre, mood, length). We’ll
        suggest books that are available on our shelves. If nothing matches,
        we’ll suggest a book you can add to our request list.
      </p>
      <SuggestClient />
    </div>
  );
}
