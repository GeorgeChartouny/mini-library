import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "LIBRARIAN" | "MEMBER";

const ADMIN_EMAILS = (process.env.NEXTAUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, email: true },
        });
        if (dbUser) {
          let role = dbUser.role;
          if (dbUser.email && ADMIN_EMAILS.includes(dbUser.email.toLowerCase())) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN" },
            });
            role = "ADMIN" as Role;
          }
          (session.user as { role: Role }).role = role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};
