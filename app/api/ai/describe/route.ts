import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const describeSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = describeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }
    const { title, author, category } = parsed.data;
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Write a short book description in 2 to 4 sentences. Book: "${title}" by ${author}${category ? `. Category: ${category}.` : "."} Do not use markdown or quotes.`,
            },
          ],
          max_tokens: 150,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: "AI service error" },
          { status: 502 }
        );
      }
      const data = await res.json();
      const text =
        data.choices?.[0]?.message?.content?.trim() ||
        "No description generated.";
      return NextResponse.json({ description: text });
    }
    // Fallback when no API key: return a simple placeholder
    const placeholder = `"${title}" by ${author}${category ? ` is a work in the ${category} genre.` : "."} This book is part of the library collection.`;
    return NextResponse.json({ description: placeholder });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
