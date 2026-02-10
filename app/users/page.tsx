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
    <div className="space-y-8">
      <Link href="/" className="btn-secondary inline-flex">
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          User management
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Change a user’s role or remove their account. You cannot change or
          remove your own account.
        </p>
      </div>
      <UsersManagement currentUserEmail={session.user?.email ?? undefined} />
    </div>
  );
}
