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
    <div className="card w-full max-w-md p-8 shadow-lg">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Sign in
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        Sign in with Google to access the library.
      </p>
      {error && (
        <div
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          role="alert"
        >
          <p>{error}</p>
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
        className="btn-primary mt-6 w-full"
      >
        {loading ? "Redirecting…" : "Sign in with Google"}
      </button>
    </div>
  );
}
