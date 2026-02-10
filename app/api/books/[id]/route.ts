import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateBookSchema } from "@/lib/validators";
import { toBookResponse, toBookDetailResponse } from "@/lib/books";
import { requireAuth } from "@/lib/auth-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { loans: true },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json(toBookDetailResponse(book));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, canMutate } = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    if (!canMutate) {
      return NextResponse.json(
        { error: "Only librarians and admins can edit books" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const body = await request.json();
    const parsed = updateBookSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues.map((e: { message: string }) => e.message).join("; ") ||
        "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const data = parsed.data;
    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.author !== undefined && { author: data.author }),
        ...(data.isbn !== undefined && { isbn: data.isbn }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.publishedYear !== undefined && {
          publishedYear: data.publishedYear,
        }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: { loans: true },
    });
    return NextResponse.json(toBookResponse(updated));
  } catch (e) {
    console.error(e);
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A book with this ISBN already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, canMutate } = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    if (!canMutate) {
      return NextResponse.json(
        { error: "Only librarians and admins can delete books" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await prisma.book.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
