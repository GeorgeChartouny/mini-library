import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDerivedStatus, isOverdue } from "@/lib/status";

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      include: { loans: true },
    });
    let available = 0;
    let borrowed = 0;
    let overdue = 0;
    for (const book of books) {
      const status = getDerivedStatus(book.loans);
      if (status === "AVAILABLE") available++;
      else {
        borrowed++;
        const active = book.loans.find((l) => l.returnedAt === null);
        if (active && isOverdue(active)) overdue++;
      }
    }
    return NextResponse.json({
      total: books.length,
      available,
      borrowed,
      overdue,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
