/**
 * LINE Official Account Configuration
 * Opens LINE OA Manager chat console for admin to chat with customers
 */

export const LINE_OA_CONFIG = {
  // LINE OA ID - Set via environment variable (e.g., @374yziyi)
  OA_ID: process.env.NEXT_PUBLIC_LINE_OA_ID || "",

  // Get OA ID without @ symbol (needed for manager.line.biz URL)
  getOAIdWithoutAt: (): string => {
    const id = LINE_OA_CONFIG.OA_ID;
    return id.startsWith("@") ? id.substring(1) : id;
  },

  // Generate LINE OA Manager chat URL for admin
  // Opens https://manager.line.biz for direct admin-to-customer chat
  // @param userId - LINE user ID to open chat with that customer
  // @param oaId - Optional OA ID (defaults to env config)
  getManagerChatUrl: (userId?: string, oaId?: string): string => {
    const id = oaId || LINE_OA_CONFIG.OA_ID;
    if (!id) {
      console.warn("LINE_OA_ID is not configured");
      return "";
    }

    if (!userId) {
      console.warn("userId is required to generate manager chat URL");
      return "";
    }

    // Remove @ from OA ID if present (manager.line.biz expects format without @)
    const oaIdWithoutAt = id.startsWith("@") ? id.substring(1) : id;

    // Format: https://manager.line.biz/account/{OA_ID}/chat/{USER_ID}
    return `https://chat.line.biz/U0f3adb2e43d9be367877e9146fe1b2da/chat/${userId}`;
  },

  // Check if LINE OA is configured
  isConfigured: (): boolean => {
    return !!LINE_OA_CONFIG.OA_ID;
  },
};
