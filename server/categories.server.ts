"use server";

import { supabase } from "@/lib/supabaseClient";

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  status: "active" | "inactive";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  color: string;
  display_order: number;
  status: "active" | "inactive";
}

/**
 * Fetch active categories only (for dropdown/select)
 */
export async function getActiveCategories(): Promise<Category[]> {
  try {
    console.log("📋 [CATEGORIES] Fetching active categories...");

    const { data, error } = await (supabase as any)
      .from("categories")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("❌ [CATEGORIES] Fetch error:", error.message);
      throw new Error(error.message);
    }

    console.log(
      `✅ [CATEGORIES] Fetched ${data?.length || 0} active categories`,
    );
    return data || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    throw err;
  }
}

/**
 * Fetch all categories from Supabase
 */
export async function getAllCategories(): Promise<{
  success: boolean;
  data?: Category[];
  error?: string;
}> {
  try {
    console.log("📋 [CATEGORIES] Fetching all categories...");

    const { data, error } = await (supabase as any)
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("❌ [CATEGORIES] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ [CATEGORIES] Fetched ${data?.length || 0} categories`);
    return { success: true, data: data || [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch single category by ID
 */
export async function getCategoryById(id: string): Promise<{
  success: boolean;
  data?: Category;
  error?: string;
}> {
  try {
    console.log("📋 [CATEGORIES] Fetching category:", id);

    const { data, error } = await (supabase as any)
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ [CATEGORIES] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [CATEGORIES] Category fetched:", data?.name);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<{
  success: boolean;
  data?: Category;
  error?: string;
}> {
  try {
    console.log("➕ [CATEGORIES] Creating category:", input.name);

    // Validate input
    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Category name is required" };
    }

    const { data, error } = await (supabase as any)
      .from("categories")
      .insert([
        {
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ [CATEGORIES] Create error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [CATEGORIES] Category created:", data?.name);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  input: Partial<CreateCategoryInput>,
): Promise<{
  success: boolean;
  data?: Category;
  error?: string;
}> {
  try {
    console.log("✏️  [CATEGORIES] Updating category:", id);

    const { data, error } = await (supabase as any)
      .from("categories")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ [CATEGORIES] Update error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [CATEGORIES] Category updated:", data?.name);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("🗑️  [CATEGORIES] Deleting category:", id);

    const { error } = await (supabase as any)
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ [CATEGORIES] Delete error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ [CATEGORIES] Category deleted:", id);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  updates: Array<{ id: string; display_order: number }>,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("🔄 [CATEGORIES] Reordering categories...");

    for (const update of updates) {
      const { error } = await (supabase as any)
        .from("categories")
        .update({
          display_order: update.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (error) {
        console.error("❌ [CATEGORIES] Reorder error:", error.message);
        return { success: false, error: error.message };
      }
    }

    console.log("✅ [CATEGORIES] Categories reordered");
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [CATEGORIES] Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
