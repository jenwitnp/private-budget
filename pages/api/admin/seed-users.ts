/**
 * API Endpoint to seed test users into Supabase
 * POST /api/admin/seed-users
 *
 * Use only in development!
 * Should be protected in production or removed
 */

import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const testUsers = [
  {
    id: "1",
    email: "owner@example.com",
    name: "Owner User",
    password_hash:
      "$2a$10$W/JJpV6F5n1MYJw.3K6n.ePfPPJPGLqR4pHN4gqKcQ8sK4Gj5Ljd2",
    role: "owner",
    status: "active",
  },
  {
    id: "2",
    email: "admin@example.com",
    name: "Admin User",
    password_hash:
      "$2a$10$W/JJpV6F5n1MYJw.3K6n.ePfPPJPGLqR4pHN4gqKcQ8sK4Gj5Ljd2",
    role: "admin",
    status: "active",
  },
  {
    id: "3",
    email: "user@example.com",
    name: "Regular User",
    password_hash:
      "$2a$10$W/JJpV6F5n1MYJw.3K6n.ePfPPJPGLqR4pHN4gqKcQ8sK4Gj5Ljd2",
    role: "user",
    status: "active",
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Development only - add auth check in production
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  try {
    // Check if users already exist
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id, email")
      .in(
        "email",
        testUsers.map((u) => u.email),
      );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        error: "Users already exist",
        existing: existingUsers.map((u) => u.email),
      });
    }

    // Insert test users
    const { data, error } = await supabase.from("users").insert(testUsers);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Test users created successfully",
      users: testUsers.map((u) => ({
        email: u.email,
        role: u.role,
        status: u.status,
      })),
      credentials: {
        owner: "owner@example.com / password123",
        admin: "admin@example.com / password123",
        user: "user@example.com / password123",
      },
    });
  } catch (error) {
    console.error("Seed endpoint error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
