/**
 * 🚗 Cars Business Logic
 *
 * This module contains all business logic for car operations.
 * Can be used by both API routes and Server Actions.
 *
 * @module services/server/core/cars
 */

import supabase from "@/app/services/supabase";
import { fetchData } from "@/app/services/supabase/query";
import {
  processRangeFields,
  getCurrentDateThailand,
  getCurrentDateThailandAlt,
  isPromotionActiveInThailand,
  fixCarImageUrls as fixCarImages,
  applyPromotionPricingToAll,
  calculatePromotionPricing,
} from "../utils";
import { getWebInfo } from "./reference";

// ====================================
// 🛠️ RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ====================================

// Re-export utils functions so existing code doesn't break
export { processRangeFields, getCurrentDateThailand };

// Alias for compatibility
export function isPromotionActive(
  promotionStart,
  promotionEnd,
  promotionStatus,
) {
  return isPromotionActiveInThailand(
    promotionStart,
    promotionEnd,
    promotionStatus,
  );
}

export function formatImageUrl(imagePath, baseUrl = null) {
  const baseImageUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_CKC_URL ||
    process.env.CKC_URL ||
    "https://www.ckc2car.com";

  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanPath = imagePath.startsWith("/")
    ? imagePath.substring(1)
    : imagePath;

  return `${baseImageUrl}/${cleanPath}`;
}

// Wrapper for fixCarImageUrls with enhanced image handling
export function fixCarImageUrls(car, baseUrl = null) {
  const fixedCar = fixCarImages(car, baseUrl);

  // Additional processing for images array (server-specific)
  if (fixedCar.images) {
    try {
      let images =
        typeof fixedCar.images === "string"
          ? JSON.parse(fixedCar.images)
          : fixedCar.images;

      if (Array.isArray(images)) {
        images = images.map((img) => {
          if (typeof img === "string") {
            return formatImageUrl(img, baseUrl);
          } else if (typeof img === "object" && img.url) {
            return {
              ...img,
              url: formatImageUrl(img.url, baseUrl),
            };
          }
          return img;
        });
        fixedCar.images = JSON.stringify(images);
      }
    } catch (error) {
      console.error("Failed to parse images array:", error);
      // Keep original if parsing fails
    }
  }

  return fixedCar;
}

// ====================================
// 🎯 MAIN BUSINESS LOGIC FUNCTIONS
// ====================================

/**
 * Get cars with filters, pagination, and search
 *
 * ⚠️ NOTE: This function expects PRE-PROCESSED parameters!
 * Use buildCarsQuery() from utils/queryBuilder to prepare parameters.
 *
 * @param {Object} options - Query options (pre-processed)
 * @param {Object} options.filters - Filter conditions (already normalized)
 * @param {Array|Object} options.search - Search query (already parsed)
 * @param {Object} options.lte - Less than or equal conditions
 * @param {Object} options.gte - Greater than or equal conditions
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Results per page (default: 12)
 * @param {string} options.sortBy - Sort field (database column name, e.g., 'created', 'price')
 * @param {string} options.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @param {boolean} options.applyPromotions - Apply promotion pricing calculations (default: true)
 *
 * @returns {Promise<Object>} { success, data, count, page, limit }
 */
export async function getCars({
  filters = {},
  search = null,
  lte = undefined,
  gte = undefined,
  page = 1,
  limit = 12,
  sortBy = "created",
  sortOrder = "desc",
  applyPromotions = true,
  forceRefresh = false,
} = {}) {
  try {
    // Build query options - NO TRANSFORMATIONS, just pass through
    const queryOptions = {
      select: `
        id,
        no_car,
        title,
        detail,
        price,
        down_price,
        ins_price,
        years_car,
        car_status,
        status,
        sold,
        confirm,
        licen_car,
        used_mile,
        color,
        fuel_type,
        gear,
        buy_province,
        thumbnail,
        image,
        images,
        views,
        created,
        updated,
        brand_name,
        car_type_title,
        branch,
        branch_name,
        model_name,
        featured,
        public_url,
        promotion_id,
        promotion_discount,
        promotion_price_total,
        promotion_start,
        promotion_end,
        promotion_gift,
        promotion_title,
        promotion_detail,
        promotion_offers,
        promotion_type,
        promotion_free_description,
        promotion_special_ins,
        promotion_status,
        has_active_promotion,
        promotion_discount_percentage,
        promotion_expired,
        promotion_upcoming,
        youtube
      `,
      total: { count: "exact" },
      filters: filters,
      search: search,
      lte: lte,
      gte: gte,
      page: page,
      pageSize: limit,
      sort: [sortBy, sortOrder],
    };

    // Execute query
    const result = await fetchData("cars_with_promotions_view", queryOptions);

    if (!result.success) {
      return {
        success: false,
        error: result.message,
        data: [],
        count: 0,
      };
    }

    // Fix image URLs in all cars
    const baseImageUrl = process.env.CKC_URL || "https://www.ckc2car.com";
    const carsWithFixedImages = (result.data || []).map((car) =>
      fixCarImageUrls(car, baseImageUrl),
    );

    // Apply promotion pricing calculations if enabled
    let finalCars = carsWithFixedImages;
    if (applyPromotions) {
      // Fetch webInfo for monthly promotions
      const webInfoResult = await getWebInfo({ forceRefresh });
      const webInfo = webInfoResult.success ? webInfoResult.data : null;

      // Apply promotion pricing (regular + monthly promotions)
      finalCars = applyPromotionPricingToAll(carsWithFixedImages, webInfo);
    }

    return {
      success: true,
      data: finalCars,
      count: result.count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error("[Cars Service] Error fetching cars:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: [],
      count: 0,
    };
  }
}

/**
 * Get featured cars (homepage)
 *
 * @param {number} limit - Number of cars to fetch (default: 20)
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count }
 */
export async function getFeaturedCars(limit = 20, applyPromotions = true) {
  return getCars({
    filters: { featured: true },
    limit,
    sortBy: "created",
    sortOrder: "desc",
    applyPromotions,
  });
}

/**
 * Get low-price cars (homepage featured section)
 * Used by FeaturedCarsSection component
 *
 * @param {number} limit - Number of cars to fetch (default: 6)
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count }
 */
export async function getLowPriceCars(limit = 6, applyPromotions = true) {
  return getCars({
    filters: {}, // No filters, just sort by price
    limit,
    sortBy: "price",
    sortOrder: "asc", // Lowest price first
    page: 1,
    applyPromotions,
  });
}

/**
 * Get recommended cars (homepage recommended section)
 * Used by RecommendedCarsSection component
 * Returns newest cars (sorted by ID descending)
 *
 * @param {number} limit - Number of cars to fetch (default: 6)
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count }
 */
export async function getRecommendedCars(limit = 6, applyPromotions = true) {
  return getCars({
    filters: {}, // No filters, just sort by most views
    limit,
    sortBy: "views",
    sortOrder: "desc", // Most viewed cars first
    page: 1,
    applyPromotions,
  });
}

/**
 * Get a single car by ID with full details
 *
 * @param {number|string} carId - Car ID
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, error? }
 */
export async function getCarById(carId, applyPromotions = true) {
  try {
    const result = await fetchData("cars_with_promotions_view", {
      filters: [
        {
          column: "id",
          operator: "eq",
          value: parseInt(carId),
        },
      ],
      limit: 1,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.message,
        data: null,
      };
    }

    const car = result.data && result.data.length > 0 ? result.data[0] : null;

    if (!car) {
      return {
        success: false,
        error: "Car not found",
        data: null,
      };
    }

    // Fix image URLs
    const baseImageUrl = process.env.CKC_URL || "https://www.ckc2car.com";
    const carWithFixedImages = fixCarImageUrls(car, baseImageUrl);

    // Apply promotion pricing calculations if enabled
    let finalCar = carWithFixedImages;
    if (applyPromotions) {
      // Fetch webInfo for monthly promotions
      const webInfoResult = await getWebInfo();
      const webInfo = webInfoResult.success ? webInfoResult.data : null;

      // Apply promotion pricing (regular + monthly promotions)
      finalCar = calculatePromotionPricing(carWithFixedImages, webInfo);
    }

    // Parse images JSON if needed
    if (finalCar.images) {
      try {
        const images =
          typeof finalCar.images === "string"
            ? JSON.parse(finalCar.images)
            : finalCar.images;
        finalCar.images = images;
      } catch (error) {
        console.error("Failed to parse images:", error);
      }
    }

    return {
      success: true,
      data: finalCar,
    };
  } catch (error) {
    console.error("[Cars Service] Error fetching car by ID:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Get car by slug (extracts ID from slug and calls getCarById)
 * Used by analytics metadata enrichment
 *
 * @param {string} slug - Car slug (format: title-{id})
 * @param {boolean} applyPromotions - Whether to apply promotion pricing
 * @returns {Promise<Object>} { success, data, error? }
 */
export async function getCarBySlug(slug, applyPromotions = false) {
  if (!slug) {
    return { success: false, error: "Slug is required", data: null };
  }

  try {
    // Extract ID from slug (last part after hyphen)
    const parts = slug.split("-");
    const id = parts[parts.length - 1];

    if (!id || isNaN(id)) {
      return { success: false, error: "Invalid slug format", data: null };
    }

    return await getCarById(id, applyPromotions);
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get car by slug",
      data: null,
    };
  }
}

/**
 * Search cars by keyword
 *
 * @param {string} keyword - Search keyword
 * @param {number} limit - Results limit
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count }
 */
export async function searchCars(keyword, limit = 12, applyPromotions = true) {
  return getCars({
    search: [{ column: "key_word", query: keyword }],
    limit,
    applyPromotions,
  });
}

export async function searchCarsByNoCar(
  keyword,
  limit = 12,
  applyPromotions = false,
) {
  return getCars({
    search: [{ column: "no_car", query: keyword }],
    limit,
    applyPromotions,
  });
}

/**
 * Get cars by brand
 *
 * @param {string} brandName - Brand name
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count, page, limit }
 */
export async function getCarsByBrand(
  brandName,
  page = 1,
  limit = 12,
  applyPromotions = true,
) {
  return getCars({
    filters: { brand_name: brandName },
    page,
    limit,
    applyPromotions,
  });
}

/**
 * Get cars by type
 *
 * @param {string} carType - Car type title
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count, page, limit }
 */
export async function getCarsByType(
  carType,
  page = 1,
  limit = 12,
  applyPromotions = true,
) {
  return getCars({
    filters: { car_type_title: carType },
    page,
    limit,
    applyPromotions,
  });
}

/**
 * Get cars with active promotions
 *
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {boolean} applyPromotions - Apply promotion pricing (default: true)
 * @returns {Promise<Object>} { success, data, count, page, limit }
 */
export async function getCarsWithPromotions(
  page = 1,
  limit = 12,
  applyPromotions = true,
  forceRefresh = false,
) {
  return getCars({
    filters: {
      has_active_promotion: true,
    },
    gte: {
      promotion_discount: 1, // Only promotions with discount >= 1
    },
    page,
    limit,
    applyPromotions,
    forceRefresh,
  });
}

/**
 * 🖼️ Get car images from external CKC2CAR service
 *
 * @param {number} carId - Car ID
 * @returns {Promise<Array>} Array of image objects with full URLs
 */
export async function getCarImages(carId) {
  if (!carId) {
    console.log("[getCarImages] ⚠️ No carId provided");
    return [];
  }

  const baseUrl = process.env.NEXT_PUBLIC_CKC_URL || "https://www.ckc2car.com";
  const clientId = process.env.NEXT_PUBLIC_CKC_CLIENT_ID;

  console.log(
    `[getCarImages] 🔍 Fetching images for car ${carId} from ${baseUrl}`,
  );

  try {
    const response = await fetch(`${baseUrl}/api/car/images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Clientid: clientId,
      },
      body: JSON.stringify({ car_id: carId }),
      cache: "force-cache", // Cache images for ISR
      next: { revalidate: 300 }, // 5-minute cache
    });

    if (!response.ok) {
      console.error(
        `[getCarImages] ❌ HTTP ${response.status}: ${response.statusText}`,
      );
      return [];
    }

    const data = await response.json();
    console.log(`[getCarImages] 📦 Response:`, {
      status: data.status,
      hasData: !!data.data,
      isArray: Array.isArray(data.data),
      count: data.data?.length || 0,
      firstImage: data.data?.[0],
    });

    // ✅ Handle response format (matches useCarImages.js logic)
    let images = [];
    if (data.status === "ok" && data.data) {
      images = data.data;
      console.log(
        `[getCarImages] ✅ Using data.data - Found ${images.length} images`,
      );
    } else if (Array.isArray(data)) {
      images = data;
      console.log(
        `[getCarImages] ✅ Using data directly - Found ${images.length} images`,
      );
    } else {
      console.log(`[getCarImages] ⚠️ Unexpected response format:`, data);
      return [];
    }

    // ✅ Process images (matches useCarImages.js logic exactly)
    const processedImages = images
      .map((image, index) => {
        // The API returns images with an 'image' field containing the filename
        if (!image.image) {
          console.warn(
            "[getCarImages] Image object missing 'image' field:",
            image,
          );
          return null;
        }

        // Construct the full image URL (matches useCarImages.js)
        const imageUrl = `${baseUrl}/uploads/posts/thumbnail/${image.image}`;

        if (index === 0) {
          console.log(`[getCarImages] 📸 Sample image:`, {
            original: image.image,
            processed: imageUrl,
            orderNum: image.orderNum,
            front_show: image.front_show,
          });
        }

        return {
          ...image,
          imageUrl, // Full URL for display
          thumbUrl: imageUrl, // Thumbnail URL (same as imageUrl)
          src: imageUrl, // For compatibility with Image components
          orderNum: parseInt(image.orderNum) || 0,
          isFrontShow: image.front_show === "1",
          createdAt: image.created ? new Date(image.created) : null,
          joinedAt: image.joined,
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => a.orderNum - b.orderNum); // Sort by orderNum

    console.log(
      `[getCarImages] ✅ Processed ${processedImages.length} images, sorted by orderNum`,
    );
    return processedImages;
  } catch (error) {
    console.error(`[getCarImages] ❌ Error fetching images:`, error.message);
    console.error(`[getCarImages] ❌ Error details:`, {
      message: error.message,
      stack: error.stack,
    });
    return [];
  }
}

/**
 * Update car view statistics
 * Increments views (total), unique_views and updates last_viewed_at
 *
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} { success, error? }
 */
export async function updateCarViewCount(carId) {
  if (!carId) {
    return { success: false, error: "Car ID is required" };
  }

  try {
    // Use RPC to increment atomically
    const { error } = await supabase.rpc("increment_car_views", {
      car_id: carId,
    });

    if (error) {
      console.error(`[updateCarViewCount] Error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateCarViewCount] Exception:`, error);
    return { success: false, error: error.message };
  }
}
