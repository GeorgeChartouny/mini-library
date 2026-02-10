import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInClient from "./signin-client";

const AUTH_ENV_KEYS = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

function getMissingAuthEnv(): string[] {
  return AUTH_ENV_KEYS.filter((key) => {
    const v = process.env[key];
    return v === undefined || (typeof v === "string" && v.trim() === "");
  });
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const messages: Record<string, string> = {
    Configuration:
      "Sign-in is not configured. Add NEXTAUTH_SECRET and Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) to .env. Restart the dev server after changing .env.",
    AccessDenied: "Access denied.",
    OAuthSignin:
      "Google sign-in failed. Add the missing variables below to a .env file in the project root (copy from .env.example), then restart the dev server. Get Google credentials at https://console.cloud.google.com/apis/credentials and set the redirect URI to http://localhost:3000/api/auth/callback/google",
    OAuthCallback:
      "Error in sign-in callback. Ensure the redirect URI in Google Console is exactly: http://localhost:3000/api/auth/callback/google",
    OAuthCreateAccount: "Could not create account.",
    OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
    SessionRequired: "Please sign in.",
  };
  return messages[code] ?? `Sign-in error: ${code}`;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");
  const params = await searchParams;
  const initialError = errorMessage(params.error ?? null);
  const missingEnv = getMissingAuthEnv();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SignInClient
        initialError={initialError}
        callbackUrl={params.callbackUrl ?? "/"}
        missingEnv={missingEnv}
      />
    </div>
  );
}
