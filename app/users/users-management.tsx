"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
};

export function UsersManagement({
  currentUserEmail,
}: {
  currentUserEmail?: string | null;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to load users");
        return;
      }
      setUsers(json.data ?? []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(userId: string, role: "ADMIN" | "MEMBER") {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to update role");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      setError(null);
    } catch {
      setError("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeUser(userId: string, email: string | null) {
    if (
      !window.confirm(
        `Remove user ${email ?? "this account"}? They will need to sign in again to re-create an account.`
      )
    ) {
      return;
    }
    setDeletingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to remove user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError("Failed to remove user");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card py-16 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">No users found.</p>
      </div>
    );
  }

  const roleLabel = (r: string) =>
    r === "ADMIN" ? "Admin" : r === "LIBRARIAN" ? "Librarian" : "Normal";

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Name
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Email
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Role
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Change to
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Remove
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
              >
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {user.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {user.email ?? "—"}
                </td>
                <td className="px-4 py-3">{roleLabel(user.role)}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role === "ADMIN" ? "ADMIN" : "MEMBER"}
                    disabled={updatingId === user.id}
                    onChange={(e) => {
                      const v = e.target.value as "ADMIN" | "MEMBER";
                      if (v !== user.role) changeRole(user.id, v);
                    }}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Normal</option>
                  </select>
                  {updatingId === user.id && (
                    <span className="ml-2 text-xs text-zinc-400">Saving…</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={
                      deletingId === user.id ||
                      (currentUserEmail != null &&
                        user.email === currentUserEmail)
                    }
                    onClick={() => removeUser(user.id, user.email)}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-70 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                    title={
                      currentUserEmail != null && user.email === currentUserEmail
                        ? "You cannot remove your own account"
                        : undefined
                    }
                  >
                    {deletingId === user.id ? "Removing…" : "Remove"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
