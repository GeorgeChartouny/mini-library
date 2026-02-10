import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-server";
import { UsersManagement } from "./users-management";

export default async function UsersPage() {
  const { session, isAdmin } = await requireAdmin();
  if (!session) {
    redirect("/auth/signin?callbackUrl=/users");
  }
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold">User management</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Change a user’s role or remove their account. You cannot change or
        remove your own account.
      </p>
      <UsersManagement currentUserEmail={session.user?.email ?? undefined} />
    </div>
  );
}
