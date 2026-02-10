import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBookSchema } from "@/lib/validators";
import { toBookResponse, getBooksList } from "@/lib/books";

const statusValues = ["ALL", "AVAILABLE", "BORROWED"] as const;
const sortValues = ["title", "author", "newest", "oldest"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";
    const status = (searchParams.get("status") ?? "ALL").toUpperCase();
    const sort = (searchParams.get("sort") ?? "title") as (typeof sortValues)[number];

    if (!statusValues.includes(status as (typeof statusValues)[number])) {
      return NextResponse.json(
        { error: "Invalid status; use ALL, AVAILABLE, or BORROWED" },
        { status: 400 }
      );
    }
    if (!sortValues.includes(sort)) {
      return NextResponse.json(
        { error: "Invalid sort; use title, author, newest, or oldest" },
        { status: 400 }
      );
    }

    const result = await getBooksList({ query, status, sort });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to list books" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBookSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues.map((e: { message: string }) => e.message).join("; ") ||
        "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const data = parsed.data;
    const book = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn ?? undefined,
        category: data.category ?? undefined,
        publishedYear: data.publishedYear ?? undefined,
        description: data.description ?? undefined,
      },
      include: { loans: true },
    });
    return NextResponse.json(toBookResponse(book));
  } catch (e) {
    console.error(e);
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A book with this ISBN already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
