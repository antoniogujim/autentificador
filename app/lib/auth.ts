import type { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              returnSecureToken: true,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          // data.error.message: "EMAIL_NOT_FOUND", "INVALID_PASSWORD",
          // "INVALID_LOGIN_CREDENTIALS", etc.
          throw new Error(data.error?.message ?? "INVALID_LOGIN_CREDENTIALS");
        }

        return {
          id: data.localId,
          email: data.email,
          name: data.displayName || data.email,
        };
      },
    }),
    CredentialsProvider({
      id: "firebase-google",
      name: "Firebase Google",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          return null;
        }

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: credentials.idToken }),
          }
        );

        const data = await res.json();

        if (!res.ok || !data.users?.length) {
          throw new Error(data.error?.message ?? "INVALID_ID_TOKEN");
        }

        const user = data.users[0];

        return {
          id: user.localId,
          email: user.email,
          name: user.displayName || user.email,
          image: user.photoUrl,
        };
      },
    }),
  ],
};
