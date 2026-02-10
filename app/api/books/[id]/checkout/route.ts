import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators";
import { getActiveLoan } from "@/lib/status";
import { toBookResponse } from "@/lib/books";
import { requireAuth } from "@/lib/auth-server";

export async function POST(
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
        { error: "Only librarians and admins can check out books" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { loans: true },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const active = getActiveLoan(book.loans);
    if (active) {
      return NextResponse.json(
        { error: "Book is already borrowed" },
        { status: 409 }
      );
    }
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues.map((e: { message: string }) => e.message).join("; ") ||
        "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { borrowerName, borrowerEmail, borrowerPhone, dueAt } = parsed.data;
    await prisma.loan.create({
      data: {
        bookId: id,
        borrowerName,
        borrowerEmail: borrowerEmail?.trim() || undefined,
        borrowerPhone: borrowerPhone?.trim() || undefined,
        dueAt: dueAt ?? undefined,
      },
    });
    const updated = await prisma.book.findUniqueOrThrow({
      where: { id },
      include: { loans: true },
    });
    return NextResponse.json(toBookResponse(updated));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to checkout book" },
      { status: 500 }
    );
  }
}
