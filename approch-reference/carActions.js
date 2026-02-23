/**
 * 🚗 Car Server Actions
 *
 * Server Actions for car-related form submissions and user interactions.
 * These are called from Client Components using forms or direct calls.
 *
 * @module actions/carActions
 */

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCars, searchCars, searchCarsByNoCar } from "@/app/services/server";
import { buildCarsQuery } from "@/app/services/server/utils/queryBuilder";

/**
 * Calculate promotion statistics from cars data
 *
 * @param {Array} cars - Array of car objects with promotion data
 * @param {number} totalCount - Total count of promotions from database
 * @returns {Object} Statistics object
 */
function calculatePromotionStatsFromCars(cars, totalCount = 0) {
  // Total promotions from database count
  const totalPromotions = totalCount > 0 ? totalCount : cars.length;

  // Calculate total savings from current page
  const totalSavings = cars.reduce((sum, car) => {
    const discount = car.promotion_discount || 0;
    return sum + discount;
  }, 0);

  // Calculate average discount from current page
  const averageDiscount = cars.length > 0 ? totalSavings / cars.length : 0;

  // Count promotions ending soon (within 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const endingSoonCount = cars.filter((car) => {
    if (!car.promotion_end) return false;
    const endDate = new Date(car.promotion_end);
    return endDate <= sevenDaysFromNow && endDate >= now;
  }).length;

  return {
    totalPromotions,
    totalSavings: Math.round(totalSavings),
    averageDiscount: Math.round(averageDiscount),
    endingSoonCount,
  };
}

/**
 * Search cars (for search forms)
 *
 * @param {FormData} formData - Form data from search form
 * @returns {Promise<Object>} Search results
 */
export async function searchCarsAction(formData) {
  try {
    const keyword = formData.get("keyword");

    if (!keyword) {
      return {
        success: false,
        error: "Search keyword is required",
      };
    }

    const result = await searchCars(keyword, 20);

    return {
      success: result.success,
      data: result.data || [],
      count: result.count || 0,
      error: result.error,
    };
  } catch (error) {
    console.error("[Car Actions] Search error:", error);
    return {
      success: false,
      error: error.message || "Failed to search cars",
    };
  }
}

/**
 * Search cars by no_car (for search forms)
 *
 * @param {FormData} formData - Form data from search form
 * @returns {Promise<Object>} Search results
 */
export async function searchCarsByNoCarAction(formData) {
  try {
    const keyword = formData.get("keyword");

    console.log("[searchCarsByNoCarAction]", keyword);

    if (!keyword) {
      return {
        success: false,
        error: "Search no_car is required",
      };
    }

    const result = await searchCarsByNoCar(keyword, 20);

    return {
      success: result.success,
      data: result.data || [],
      count: result.count || 0,
      error: result.error,
    };
  } catch (error) {
    console.error("[Car Actions] Search error:", error);
    return {
      success: false,
      error: error.message || "Failed to search cars",
    };
  }
}

/**
 * Toggle favorite car (future feature)
 *
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} Result
 */
export async function toggleFavoriteAction(carId) {
  try {
    // TODO: Implement favorite functionality
    // For now, just revalidate
    revalidatePath("/cars");
    revalidatePath(`/cars/${carId}`);

    return {
      success: true,
      message: "Favorite toggled",
    };
  } catch (error) {
    console.error("[Car Actions] Toggle favorite error:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle favorite",
    };
  }
}

/**
 * Increment car view count (analytics)
 *
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} Result
 */
export async function incrementViewCountAction(carId) {
  try {
    // TODO: Implement view count increment in database
    // For now, just return success
    return {
      success: true,
      carId,
    };
  } catch (error) {
    console.error("[Car Actions] Increment view error:", error);
    return {
      success: false,
      error: error.message || "Failed to increment view count",
    };
  }
}

/**
 * Share car (future feature)
 *
 * @param {number} carId - Car ID
 * @param {string} platform - Social platform (facebook, line, etc.)
 * @returns {Promise<Object>} Result
 */
export async function shareCarAction(carId, platform) {
  try {
    // TODO: Track share analytics
    console.log(`[Car Actions] Car ${carId} shared on ${platform}`);

    return {
      success: true,
      carId,
      platform,
    };
  } catch (error) {
    console.error("[Car Actions] Share error:", error);
    return {
      success: false,
      error: error.message || "Failed to share car",
    };
  }
}

/**
 * Report car (future feature)
 *
 * @param {FormData} formData - Form data
 * @returns {Promise<Object>} Result
 */
export async function reportCarAction(formData) {
  try {
    const carId = formData.get("carId");
    const reason = formData.get("reason");
    const details = formData.get("details");

    if (!carId || !reason) {
      return {
        success: false,
        error: "Car ID and reason are required",
      };
    }

    // TODO: Save report to database
    console.log(`[Car Actions] Car ${carId} reported: ${reason}`);

    return {
      success: true,
      message: "Report submitted successfully",
    };
  } catch (error) {
    console.error("[Car Actions] Report error:", error);
    return {
      success: false,
      error: error.message || "Failed to submit report",
    };
  }
}

/**
 * Get cars page with filters and pagination
 *
 * @param {Object} options - Fetch options
 * @param {number} options.pageParam - Page number (1-based)
 * @param {string} options.search - Search query (JSON string)
 * @param {Object} options.filters - Filter object
 * @param {string} options.sortBy - Sort field ('newest', 'price', etc.)
 * @param {number} options.pageSize - Results per page
 * @returns {Promise<Object>} Normalized response with cars, totalCars, pagination info
 */
export async function getCarsPageAction({
  pageParam = 1,
  search = "",
  filters = {},
  sortBy = "newest",
  pageSize = 12,
}) {
  try {
    // 🔧 Use query builder to normalize all parameters
    const query = buildCarsQuery({
      pageParam,
      search,
      filters,
      sortBy,
      pageSize,
    });

    // Call getCars with pre-processed query
    const result = await getCars(query);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch cars");
    }

    // Transform to expected format
    const cars = result.data || [];
    const totalCars = result.count || 0;
    const currentPage = result.page || pageParam;
    const limit = result.limit || pageSize;
    const hasNextPage = currentPage * limit < totalCars;
    const nextCursor = hasNextPage ? currentPage + 1 : null;

    return {
      success: true,
      cars: cars,
      totalCars: totalCars,
      currentPage: currentPage,
      totalPages: Math.ceil(totalCars / limit),
      hasNextPage: hasNextPage,
      nextCursor: nextCursor,
    };
  } catch (error) {
    console.error("❌ [getCarsPageAction] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch cars",
      cars: [],
      totalCars: 0,
      currentPage: pageParam,
      totalPages: 0,
      hasNextPage: false,
      nextCursor: null,
    };
  }
}

/**
 * Get promotions page with filters and pagination
 * Uses getCarsWithPromotions() to fetch only cars with active promotions
 *
 * @param {Object} options - Fetch options
 * @param {number} options.pageParam - Page number (1-based)
 * @param {string} options.search - Search query (JSON string)
 * @param {Object} options.filters - Filter object
 * @param {string} options.sortBy - Sort field ('promotion_end', 'newest', 'price', etc.)
 * @param {number} options.pageSize - Results per page
 * @returns {Promise<Object>} Normalized response with cars, totalCars, pagination info
 */
export async function getPromotionsPageAction({
  pageParam = 1,
  search = "",
  filters = {},
  sortBy = "promotion_end",
  pageSize = 12,
}) {
  try {
    // Use already imported getCars - no need for dynamic import

    // Build query using the same builder as getCarsPageAction
    const query = buildCarsQuery({
      pageParam,
      search,
      filters,
      sortBy,
      pageSize,
    });

    // Add promotion-specific filters
    // has_active_promotion: true and promotion_discount >= 1 are already applied by the view
    const promotionFilters = {
      ...query.filters,
      has_active_promotion: true,
    };

    const promotionGte = {
      ...query.gte,
      promotion_discount: 1, // Only promotions with discount >= 1
    };

    // Call getCars with promotion filters
    const result = await getCars({
      ...query,
      filters: promotionFilters,
      gte: promotionGte,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch promotions");
    }

    // Transform to expected format
    const cars = result.data || [];
    const totalCars = result.count || 0;
    const currentPage = result.page || pageParam;
    const limit = result.limit || pageSize;
    const hasNextPage = currentPage * limit < totalCars;
    const nextCursor = hasNextPage ? currentPage + 1 : null;

    // Calculate promotion statistics from the current page data
    const promotionStats = calculatePromotionStatsFromCars(cars, totalCars);

    return {
      success: true,
      cars: cars,
      totalCars: totalCars,
      currentPage: currentPage,
      totalPages: Math.ceil(totalCars / limit),
      hasNextPage: hasNextPage,
      nextCursor: nextCursor,
      promotionStats: promotionStats,
    };
  } catch (error) {
    console.error("❌ [getPromotionsPageAction] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch promotions",
      cars: [],
      totalCars: 0,
      currentPage: pageParam,
      totalPages: 0,
      hasNextPage: false,
      nextCursor: null,
      promotionStats: {
        totalPromotions: 0,
        totalSavings: 0,
        averageDiscount: 0,
        endingSoonCount: 0,
      },
    };
  }
}
