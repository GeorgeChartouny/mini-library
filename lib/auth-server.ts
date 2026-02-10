import { getServerSession } from "next-auth";
import { authOptions, type Role } from "@/lib/auth";

const MUTATE_ROLES: Role[] = ["ADMIN", "LIBRARIAN"];

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) return { session: null, canMutate: false as const };
  const role = (session.user as { role?: Role }).role ?? "MEMBER";
  return {
    session,
    role,
    canMutate: MUTATE_ROLES.includes(role),
  };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return { session: null, isAdmin: false as const };
  const role = (session.user as { role?: Role }).role ?? "MEMBER";
  return { session, isAdmin: role === "ADMIN" as const };
}
