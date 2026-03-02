import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getUserByEmail, getPrimaryMembership } from "@/server/repositories/auth/user-repository";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await getUserByEmail(email);

        if (!user) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const membership = await getPrimaryMembership(user.id);

        token.organizationId = membership?.organizationId;
        token.organizationName = membership?.organizationName;
        token.role = membership?.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.organizationId =
          typeof token.organizationId === "string" ? token.organizationId : undefined;
        session.user.organizationName =
          typeof token.organizationName === "string" ? token.organizationName : undefined;
        session.user.role =
          token.role === "OWNER" || token.role === "ADMIN" || token.role === "MEMBER"
            ? token.role
            : undefined;
      }

      return session;
    },
  },
};
