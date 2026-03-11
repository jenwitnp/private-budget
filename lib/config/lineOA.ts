/**
 * LINE Official Account Configuration
 */

export const LINE_OA_CONFIG = {
  // LINE OA ID - Set via environment variable
  OA_ID: process.env.NEXT_PUBLIC_LINE_OA_ID || "",

  // Generate LINE OA message URL
  // @param oaId - Optional OA ID (defaults to env config)
  // @param userId - Optional LINE user ID to direct conversation to specific customer
  getMessageUrl: (oaId?: string, userId?: string): string => {
    const id = oaId || LINE_OA_CONFIG.OA_ID;
    if (!id) {
      console.warn("LINE_OA_ID is not configured");
      return "";
    }

    // Don't encode the OA ID - LINE expects it in plain format (e.g., @374yziyi)
    let url = `https://line.me/R/oaMessage/${id}/`;

    // Add userId query parameter if provided (encode query parameter)
    if (userId) {
      url += `?userId=${encodeURIComponent(userId)}`;
    }

    return url;
  },

  // Check if LINE OA is configured
  isConfigured: (): boolean => {
    return !!LINE_OA_CONFIG.OA_ID;
  },
};
