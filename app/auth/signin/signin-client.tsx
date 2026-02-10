"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInClient({
  initialError = null,
  callbackUrl = "/",
  missingEnv = [],
}: {
  initialError?: string | null;
  callbackUrl?: string;
  missingEnv?: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("google", {
        callbackUrl,
        redirect: true,
      });
      if (result?.error) {
        setError(
          result.error === "Configuration"
            ? "Sign-in is not configured. Add NEXTAUTH_SECRET and Google OAuth credentials to .env and restart the dev server."
            : result.error
        );
        setLoading(false);
        return;
      }
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in with Google to access the library.
      </p>
      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <p className="mb-2">{error}</p>
          {missingEnv.length > 0 && (
            <p className="mt-2 border-t border-red-200 pt-2 dark:border-red-800">
              <strong>Missing in .env:</strong> {missingEnv.join(", ")}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="w-full rounded bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Redirecting…" : "Sign in with Google"}
      </button>
    </div>
  );
}
