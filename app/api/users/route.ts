import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    const { session, isAdmin } = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: { message: "Sign in required" } },
        { status: 401 }
      );
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: { message: "Admin access required" } },
        { status: 403 }
      );
    }
    const users = await prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
    return NextResponse.json({ data: users });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { message: "Failed to list users" } },
      { status: 500 }
    );
  }
}
