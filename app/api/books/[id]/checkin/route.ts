import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveLoan } from "@/lib/status";
import { toBookResponse } from "@/lib/books";
import { requireAuth } from "@/lib/auth-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, canMutate } = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
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
    if (!active) {
      return NextResponse.json(
        { error: "No active loan for this book" },
        { status: 409 }
      );
    }
    const isBorrower =
      session.user?.email &&
      active.borrowerEmail &&
      session.user.email.toLowerCase().trim() ===
        active.borrowerEmail.toLowerCase().trim();
    if (!canMutate && !isBorrower) {
      return NextResponse.json(
        { error: "Only librarians, admins, or the borrower can return this book" },
        { status: 403 }
      );
    }
    await prisma.loan.update({
      where: { id: active.id },
      data: { returnedAt: new Date() },
    });
    const updated = await prisma.book.findUniqueOrThrow({
      where: { id },
      include: { loans: true },
    });
    return NextResponse.json(toBookResponse(updated));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to checkin book" },
      { status: 500 }
    );
  }
}
