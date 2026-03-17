"use server";

import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export interface RegisterFormData {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  avatarUrl?: string;
}

/**
 * Check if username is unique
 */
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    if (!username || username.trim().length < 3) {
      return {
        available: false,
        error: "Username must be at least 3 characters",
      };
    }

    const { data, error } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("username", username.trim())
      .single();

    if (error && error.code === "PGRST116") {
      // No rows found - username is available
      return { available: true };
    }

    if (data) {
      // User exists - username is not available
      return {
        available: false,
        error: "Username already taken",
      };
    }

    // Other error
    return {
      available: false,
      error: error?.message || "Error checking username",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      available: false,
      error: errorMessage,
    };
  }
}

/**
 * Register new user
 */
export async function registerUserAction(formData: RegisterFormData): Promise<{
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const { username, firstName, lastName, phone, password, avatarUrl } =
      formData;

    // Validate inputs
    if (
      !username ||
      !firstName ||
      !lastName ||
      !phone ||
      !password ||
      username.trim().length < 3 ||
      password.length < 8
    ) {
      return {
        success: false,
        error:
          "All fields are required and password must be at least 8 characters",
      };
    }

    // Check username availability
    const availabilityCheck = await checkUsernameAvailability(username);
    if (!availabilityCheck.available) {
      return {
        success: false,
        error: availabilityCheck.error || "Username not available",
      };
    }

    // Hash the provided password
    const hashedPassword = await hashPassword(password);

    // Create user with default role and inactive status
    const { data: newUser, error: createError } = await (supabase as any)
      .from("users")
      .insert([
        {
          username: username.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone.trim(),
          avatar_url: avatarUrl || null,
          role: "user", // Default role
          status: "inactive", // Default status
          password_hash: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id");

    if (createError) {
      return {
        success: false,
        error: createError.message || "Failed to create user",
      };
    }

    const userId = newUser?.[0]?.id;

    return {
      success: true,
      userId,
      message: "Registration successful! Please log in with your credentials.",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Hash password using bcryptjs
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
