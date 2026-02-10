import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import { EditBookForm } from "./edit-book-form";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { session, canMutate }] = await Promise.all([
    params,
    requireAuth(),
  ]);
  if (!session) redirect(`/auth/signin?callbackUrl=/books/${id}/edit`);
  if (!canMutate) redirect(`/books/${id}`);
  return <EditBookForm id={id} />;
}
