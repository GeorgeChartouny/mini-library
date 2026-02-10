import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { NewBookForm } from "./new-book-form";

export default async function NewBookPage() {
  const { session, canMutate } = await requireAuth();
  if (!session) redirect("/auth/signin?callbackUrl=/books/new");
  if (!canMutate) redirect("/books");
  return <NewBookForm />;
}
