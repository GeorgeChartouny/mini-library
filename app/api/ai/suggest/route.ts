import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableBooksForSuggestions } from "@/lib/books";

const suggestSchema = z.object({
  inputs: z
    .array(z.string().trim())
    .min(1, "At least one input is required")
    .max(5, "At most 5 inputs"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = suggestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { inputs } = parsed.data;
    const books = await getAvailableBooksForSuggestions();
    const key = process.env.OPENAI_API_KEY;

    if (books.length === 0) {
      if (!key) {
        return NextResponse.json({
          suggestions: [],
          message: "No books are currently available to suggest.",
        });
      }
      const userPrefs = inputs.join("; ");
      const fallbackPrompt = `The user is looking for a book. Their preferences: ${userPrefs}. We have no books in our library yet. Suggest one real, published book that would fit their request (title and author). Reply with only a JSON object: {"title": "Book Title", "author": "Author Name", "category": "Genre or category"}. Category is optional. Output only the JSON object, no other text.`;
      const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fallbackPrompt }],
          max_tokens: 150,
        }),
      });
      let aiSuggestedBook: { title: string; author: string; category?: string } | undefined;
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const raw = fallbackData.choices?.[0]?.message?.content?.trim()?.replace(/^```json?\s*|\s*```$/g, "") ?? "{}";
        try {
          const obj = JSON.parse(raw);
          if (obj && typeof obj.title === "string" && typeof obj.author === "string") {
            aiSuggestedBook = {
              title: obj.title.trim(),
              author: obj.author.trim(),
              category: typeof obj.category === "string" ? obj.category.trim() : undefined,
            };
          }
        } catch {
          // ignore
        }
      }
      return NextResponse.json({
        suggestions: [],
        message: "No books are currently available to suggest.",
        aiSuggestedBook,
      });
    }

    if (!key) {
      return NextResponse.json(
        {
          error: "AI suggestions are not configured",
          message: "Add OPENAI_API_KEY to .env to enable book suggestions.",
        },
        { status: 503 }
      );
    }

    const bookList = books
      .map(
        (b) =>
          `- id: "${b.id}" | title: "${b.title}" | author: ${b.author}${b.category ? ` | category: ${b.category}` : ""}${b.description ? ` | description: ${b.description.slice(0, 200)}${b.description.length > 200 ? "…" : ""}` : ""}`
      )
      .join("\n");

    const userPrefs = inputs.join("; ");
    const prompt = `You are a library assistant. The user is looking for a book. Their preferences or hints (what they said): ${userPrefs}

Available books (only suggest from this list; only these are in stock):
${bookList}

Respond with a JSON array of up to 5 book recommendations, most relevant first. Each item must have exactly: "bookId" (use the id from the list above) and "reason" (one short sentence why it matches). If nothing fits well, return an empty array [].
Example: [{"bookId":"abc123","reason":"Matches your interest in sci-fi."}]
Output only the JSON array, no other text.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", res.status, err);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const raw =
      data.choices?.[0]?.message?.content?.trim()?.replace(/^```json?\s*|\s*```$/g, "") ?? "[]";
    let items: { bookId: string; reason: string }[] = [];
    try {
      items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [];
    } catch {
      console.error("OpenAI returned invalid JSON:", raw);
    }

    const idSet = new Set(books.map((b) => b.id));
    const valid = items
      .filter(
        (x): x is { bookId: string; reason: string } =>
          typeof x?.bookId === "string" &&
          typeof x?.reason === "string" &&
          idSet.has(x.bookId)
      )
      .slice(0, 5);

    const suggestions = valid.map(({ bookId, reason }) => {
      const book = books.find((b) => b.id === bookId)!;
      return {
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          description: book.description,
        },
        reason,
      };
    });

    let aiSuggestedBook: { title: string; author: string; category?: string } | null = null;
    if (suggestions.length === 0) {
      const fallbackPrompt = `The user is looking for a book. Their preferences: ${userPrefs}. We have no matching books in our library. Suggest one real, published book that would fit their request (title and author). Reply with only a JSON object: {"title": "Book Title", "author": "Author Name", "category": "Genre or category"}.
Category is optional (e.g. Fiction, Sci-Fi). Output only the JSON object, no other text.`;
      const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fallbackPrompt }],
          max_tokens: 150,
        }),
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const rawFallback =
          fallbackData.choices?.[0]?.message?.content?.trim()?.replace(/^```json?\s*|\s*```$/g, "") ?? "{}";
        try {
          const obj = JSON.parse(rawFallback);
          if (obj && typeof obj.title === "string" && typeof obj.author === "string") {
            aiSuggestedBook = {
              title: obj.title.trim(),
              author: obj.author.trim(),
              category: typeof obj.category === "string" ? obj.category.trim() : undefined,
            };
          }
        } catch {
          // ignore parse error
        }
      }
    }

    return NextResponse.json({ suggestions, aiSuggestedBook: aiSuggestedBook ?? undefined });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
