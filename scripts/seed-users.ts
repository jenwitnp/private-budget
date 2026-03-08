/**
 * Seed Script - Initialize test users in Supabase
 * Run with: npx ts-node scripts/seed-users.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

async function seedUsers() {
  try {
    console.log("🌱 Starting user seed...");

    // Check if users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .in(
        "email",
        testUsers.map((u) => u.email),
      );

    if (checkError) {
      console.error("❌ Error checking existing users:", checkError);
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(
        `⚠️  ${existingUsers.length} user(s) already exist. Skipping insertion.`,
      );
      console.log(
        "📋 Existing emails:",
        existingUsers.map((u) => u.id),
      );
      return;
    }

    // Insert users
    const { data, error } = await (supabase.from("users") as any).insert(
      testUsers,
    );

    if (error) {
      console.error("❌ Error inserting users:", error);
      return;
    }

    console.log("✅ Successfully seeded", testUsers.length, "users");
    console.log("📝 Test Credentials:");
    testUsers.forEach((user) => {
      console.log(`   ${user.role}: ${user.email} / password123`);
    });
  } catch (error) {
    console.error("❌ Seed script error:", error);
  }
}

seedUsers();
