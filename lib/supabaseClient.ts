import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create supabase client - will be lazily initialized when first accessed at runtime
// Using process.env directly instead of throwing at module load allows Vercel builds to succeed
export const supabase = (
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : ({
        // Placeholder client for build time when env vars aren't available
        // This will only be used during types checking, not at runtime
        rpc: () => Promise.reject(new Error("Supabase not configured")),
        from: () => ({
          select: () => Promise.reject(new Error("Supabase not configured")),
          insert: () => Promise.reject(new Error("Supabase not configured")),
          update: () => Promise.reject(new Error("Supabase not configured")),
          delete: () => Promise.reject(new Error("Supabase not configured")),
        }),
      } as any)
) as ReturnType<typeof createClient>;

// Server-side client with service role key
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY - required for admin operations",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Export client type for usage
export type SupabaseClient = ReturnType<typeof createClient>;
