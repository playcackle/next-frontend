import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    credentials({
      name: "Credentials",
      id: "credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const name = credentials!.name;
          const password = credentials!.password;

          const res = await fetch(
            `${process.env.BACKEND_URL}/players/by-name/${encodeURIComponent(
              name
            )}`
          );

          if (!res.ok) {
            throw new Error("User not found");
          }

          const user = await res.json();

          const passwordMatch = await bcrypt.compare(
            password,
            user.encrypted_password
          );
          if (!passwordMatch) {
            throw new Error("Wrong Password");
          }

          return user;
        } catch (error) {
          console.error("Authorization error:", error);
          throw new Error("Authorization failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = user?.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;

      return session;
    },
  },
};
