import { z } from "zod";

export const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  category: z.string().optional(),
  publishedYear: z.coerce.number().int().min(1).max(2100).optional(),
  description: z.string().optional(),
});

export const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  publishedYear: z.coerce.number().int().min(1).max(2100).optional().nullable(),
  description: z.string().optional().nullable(),
});

export const checkoutSchema = z.object({
  borrowerName: z.string().min(1, "Borrower name is required"),
  borrowerEmail: z.string().optional().transform((v) => v?.trim() || undefined),
  borrowerPhone: z.string().optional().transform((v) => v?.trim() || undefined),
  dueAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v instanceof Date ? v : v ? new Date(v) : undefined)),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], { message: "Role must be Admin or Normal" }),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
