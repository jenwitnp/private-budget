import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";

/**
 * Mock user database - For seed purposes only
 * In production, all queries will be from Supabase
 */
const mockUsers = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    username: "owner",
    email: "owner@example.com",
    name: "Owner User",
    password: "$2b$10$RDm91P.v.M1FLA.M8f55O.GuxJzcupa/1Qq6qHqmTkZKbF7EM3dr2", // hashed: "password123"
    role: "owner" as const,
    status: "active" as const,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    username: "admin",
    email: "admin@example.com",
    name: "Admin User",
    password: "$2b$10$RDm91P.v.M1FLA.M8f55O.GuxJzcupa/1Qq6qHqmTkZKbF7EM3dr2", // hashed: "password123"
    role: "admin" as const,
    status: "active" as const,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    username: "user",
    email: "user@example.com",
    name: "Regular User",
    password: "$2b$10$RDm91P.v.M1FLA.M8f55O.GuxJzcupa/1Qq6qHqmTkZKbF7EM3dr2", // hashed: "password123"
    role: "user" as const,
    status: "active" as const,
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "owner",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          // Query user from Supabase by username
          const { data: user, error } = await (supabase as any)
            .from("users")
            .select(
              "id, username, email, first_name, last_name, password_hash, role, status",
            )
            .eq("username", credentials.username)
            .single();

          if (error || !user) {
            console.error("❌ [AUTH] User not found:", credentials.username);
            throw new Error("No user found with this username");
          }

          // Verify password
          if (!user.password_hash) {
            console.error(
              "❌ [AUTH] No password hash found for user:",
              credentials.username,
            );
            throw new Error("User account is not properly configured");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash,
          );

          if (!isPasswordValid) {
            console.error(
              "❌ [AUTH] Invalid password for user:",
              credentials.username,
            );
            throw new Error("Invalid password");
          }

          console.log("✅ [AUTH] User authenticated:", credentials.username);

          // Update last login
          await (supabase as any)
            .from("users")
            .update({
              last_login_at: new Date().toISOString(),
              failed_login_attempts: 0,
            })
            .eq("id", user.id);

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`.trim(),
            role: user.role,
            status: user.status,
          };
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Authentication failed";
          console.error("❌ [AUTH] Error:", errorMessage);
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;

        // Fetch fresh user data from database on every session check
        try {
          const { data: freshUser } = await (supabase as any)
            .from("users")
            .select("id, username, email, first_name, last_name, role, status")
            .eq("id", token.id)
            .single();

          if (freshUser) {
            session.user.email = freshUser.email;
            session.user.name =
              `${freshUser.first_name} ${freshUser.last_name}`.trim();
            (session.user as any).first_name = freshUser.first_name;
            (session.user as any).last_name = freshUser.last_name;
            (session.user as any).username = freshUser.username;
            (session.user as any).role = freshUser.role;
            (session.user as any).status = freshUser.status;
          }
        } catch (err) {
          console.warn("⚠️  [AUTH] Could not fetch fresh user data:", err);
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
};

export default NextAuth(authOptions);
