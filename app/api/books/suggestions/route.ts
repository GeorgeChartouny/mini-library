import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  category: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET() {
  try {
    const list = await prisma.bookSuggestion.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        notes: true,
        createdAt: true,
      },
    });
    const data = list.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load suggestions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const created = await prisma.bookSuggestion.create({
      data: {
        title: parsed.data.title,
        author: parsed.data.author,
        category: parsed.data.category || null,
        notes: parsed.data.notes || null,
      },
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        notes: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      data: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to add suggestion" },
      { status: 500 }
    );
  }
}
