import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveLoan } from "@/lib/status";
import { toBookResponse } from "@/lib/books";

export async function POST(
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
    const active = getActiveLoan(book.loans);
    if (!active) {
      return NextResponse.json(
        { error: "No active loan for this book" },
        { status: 409 }
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
