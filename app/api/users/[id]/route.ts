import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateUserRoleSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth-server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const current = await prisma.user.findUnique({
      where: { email: session.user?.email ?? undefined },
      select: { id: true },
    });
    if (current?.id === id) {
      return NextResponse.json(
        { error: { message: "You cannot remove your own account" } },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found" } },
        { status: 404 }
      );
    }
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { message: "Failed to remove user" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const current = await prisma.user.findUnique({
      where: { email: session.user?.email ?? undefined },
      select: { id: true },
    });
    if (current?.id === id) {
      return NextResponse.json(
        { error: { message: "You cannot change your own role" } },
        { status: 400 }
      );
    }
    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found" } },
        { status: 404 }
      );
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { message: "Failed to update user role" } },
      { status: 500 }
    );
  }
}
