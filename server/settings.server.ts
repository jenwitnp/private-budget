"use server";

import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export interface UserSettings {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  role: "owner" | "admin" | "user";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

/**
 * Get user settings
 */
export async function getUserSettings(userId: string): Promise<{
  success: boolean;
  data?: UserSettings;
  error?: string;
}> {
  try {
    console.log("📋 [SETTINGS] Fetching settings for user:", userId);

    const { data, error } = await (supabase as any)
      .from("users")
      .select(
        "id, username, first_name, last_name, phone_number, avatar_url, role, status, created_at, updated_at",
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ [SETTINGS] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [SETTINGS] Settings fetched for user:", userId);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [SETTINGS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user settings
 */
export async function updateSettings(
  userId: string,
  input: UpdateSettingsInput,
): Promise<{
  success: boolean;
  data?: UserSettings;
  error?: string;
}> {
  try {
    console.log("✏️  [SETTINGS] Updating settings for user:", userId, input);

    if (
      !input.first_name?.trim() &&
      !input.last_name?.trim() &&
      !input.phone_number?.trim() &&
      !input.avatar_url
    ) {
      return { success: false, error: "At least one field is required" };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.first_name !== undefined)
      updateData.first_name = input.first_name || null;
    if (input.last_name !== undefined)
      updateData.last_name = input.last_name || null;
    if (input.phone_number !== undefined)
      updateData.phone_number = input.phone_number || null;
    if (input.avatar_url !== undefined)
      updateData.avatar_url = input.avatar_url || null;

    const { data, error } = await (supabase as any)
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select(
        "id, username, first_name, last_name, phone_number, avatar_url, role, status, created_at, updated_at",
      )
      .single();

    if (error) {
      console.error("❌ [SETTINGS] Update error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [SETTINGS] Settings updated for user:", userId);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [SETTINGS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("🔐 [SETTINGS] Changing password for user:", userId);

    if (!input.current_password) {
      return { success: false, error: "Current password is required" };
    }

    if (!input.new_password || input.new_password.length < 6) {
      return {
        success: false,
        error: "New password must be at least 6 characters",
      };
    }

    if (input.current_password === input.new_password) {
      return {
        success: false,
        error: "New password must be different from current password",
      };
    }

    // Get current password hash
    const { data: user, error: fetchError } = await (supabase as any)
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      console.error("❌ [SETTINGS] User not found");
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      input.current_password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      console.warn("⚠️  [SETTINGS] Invalid current password");
      return { success: false, error: "Current password is incorrect" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(input.new_password, 10);

    // Update password
    const { error: updateError } = await (supabase as any)
      .from("users")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error(
        "❌ [SETTINGS] Password update error:",
        updateError.message,
      );
      return { success: false, error: updateError.message };
    }

    console.log("✅ [SETTINGS] Password changed for user:", userId);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [SETTINGS] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
