"use server";

import { supabase } from "@/lib/supabaseClient";

export interface User {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: "owner" | "admin" | "user";
  status: "active" | "inactive";
  balance: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password: string;
  role: "owner" | "admin" | "user";
  status: "active" | "inactive";
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: "owner" | "admin" | "user";
  status?: "active" | "inactive";
}

/**
 * Get all users
 */
export async function getUsers(): Promise<{
  success: boolean;
  data?: User[];
  error?: string;
}> {
  try {
    console.log("📋 [USERS] Fetching all users");

    const { data, error } = await (supabase as any)
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [USERS] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ [USERS] Fetched ${data?.length || 0} users`);
    return { success: true, data: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [USERS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get single user by ID
 */
export async function getUserById(id: string): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    console.log("📋 [USERS] Fetching user:", id);

    const { data, error } = await (supabase as any)
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ [USERS] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [USERS] User fetched:", data?.username);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [USERS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create new user
 */
export async function createUser(input: CreateUserInput): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    console.log("➕ [USERS] Creating user:", {
      username: input.username,
      role: input.role,
    });

    if (!input.username || input.username.trim() === "") {
      return { success: false, error: "Username is required" };
    }

    if (!input.password || input.password.trim() === "") {
      return { success: false, error: "Password is required" };
    }

    // Hash password
    const bcrypt = require("bcryptjs");
    const password_hash = await bcrypt.hash(input.password, 10);

    // Check if username already exists
    const { data: existing } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("username", input.username)
      .single();

    if (existing) {
      return { success: false, error: "Username already exists" };
    }

    const { data, error } = await (supabase as any)
      .from("users")
      .insert([
        {
          username: input.username,
          email: input.email || null,
          first_name: input.first_name || null,
          last_name: input.last_name || null,
          phone_number: input.phone_number || null,
          password_hash,
          role: input.role,
          status: input.status || "active",
          balance: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ [USERS] Create error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [USERS] User created:", data?.username);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [USERS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    console.log("✏️ [USERS] Updating user:", id);

    const { data, error } = await (supabase as any)
      .from("users")
      .update({
        ...(input.username && { username: input.username }),
        ...(input.email && { email: input.email }),
        ...(input.first_name && { first_name: input.first_name }),
        ...(input.last_name && { last_name: input.last_name }),
        ...(input.phone_number && { phone_number: input.phone_number }),
        ...(input.role && { role: input.role }),
        ...(input.status && { status: input.status }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ [USERS] Update error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [USERS] User updated:", data?.username);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [USERS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete user (soft delete or hard delete)
 */
export async function deleteUser(id: string): Promise<{
  success: boolean;
  data?: boolean;
  error?: string;
}> {
  try {
    console.log("🗑️ [USERS] Deleting user:", id);

    const { error } = await (supabase as any)
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ [USERS] Delete error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [USERS] User deleted");
    return { success: true, data: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [USERS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
