/**
 * Helper function to parse transaction filters from URL query parameters
 * Converts URL params into filter object
 */
export function parseTransactionFiltersFromQuery(
  query: Record<string, string | string[] | undefined>,
) {
  const filtersParam = query.filters as string;

  // Default filter object
  const defaultFilters = {
    searchTerm: "",
    statusFilter: "all" as const,
    dateStart: "",
    dateEnd: "",
    categoryId: "",
    districtId: "",
    subDistrictId: "",
  };

  // If no filters param, return defaults
  if (!filtersParam) {
    return defaultFilters;
  }

  try {
    // Parse JSON string from URL param
    const parsedFilters = JSON.parse(filtersParam);

    // Validate status is one of allowed values
    const allowedStatuses = ["all", "pending", "approved", "rejected", "paid"];
    const validStatus = allowedStatuses.includes(parsedFilters.statusFilter)
      ? parsedFilters.statusFilter
      : "all";

    return {
      searchTerm: parsedFilters.searchTerm || "",
      statusFilter: validStatus,
      dateStart: parsedFilters.dateStart || "",
      dateEnd: parsedFilters.dateEnd || "",
      categoryId: parsedFilters.categoryId || "",
      districtId: parsedFilters.districtId || "",
      subDistrictId: parsedFilters.subDistrictId || "",
    };
  } catch (error) {
    console.error("❌ Failed to parse filters from URL:", error);
    return defaultFilters;
  }
}

/**
 * Build API filters from UI filter state
 * Maps UI filters to database column names and operators
 * ⚠️ CRITICAL: Handles timezone offset for Thailand (UTC+7)
 * 
 * When user picks date in Thai timezone, we must convert to UTC bounds
 * since database stores timestamps in UTC.
 */
export function buildApiFilters(
  filters: {
    statusFilter: string;
    dateStart: string;
    dateEnd: string;
    categoryId: string;
    districtId: string;
    subDistrictId: string;
  },
  getDateColumnByStatus: (status: string) => string,
) {
  const dateColumn = getDateColumnByStatus(filters.statusFilter);
  const apiFilters: Record<string, any> = {};
  const gte: Record<string, any> = {};
  const lte: Record<string, any> = {};

  // 🕐 Convert Thai local date to UTC datetime bounds
  // Thailand is UTC+7, so local midnight is UTC-7 hours
  // Local 2026-02-27 00:00:00 = UTC 2026-02-26 17:00:00
  const getUTCStartOfDay = (localDateStr: string): string => {
    const [year, month, day] = localDateStr.split("-").map(Number);
    // Create local date at 00:00
    const localDate = new Date(year, month - 1, day, 0, 0, 0);
    // Subtract 7 hours to get UTC equivalent
    const utcDate = new Date(localDate.getTime() - 7 * 60 * 60 * 1000);
    return utcDate.toISOString().replace("Z", "");
  };

  const getUTCEndOfDay = (localDateStr: string): string => {
    const [year, month, day] = localDateStr.split("-").map(Number);
    // Create next day at 00:00 local time
    const nextDayLocal = new Date(year, month - 1, day + 1, 0, 0, 0);
    // Subtract 7 hours to get UTC equivalent
    const utcDate = new Date(nextDayLocal.getTime() - 7 * 60 * 60 * 1000);
    return utcDate.toISOString().replace("Z", "");
  };

  // Add status filter
  if (filters.statusFilter !== "all") {
    apiFilters.status = filters.statusFilter;
  }

  // Add date range filters with timezone conversion
  if (filters.dateStart && filters.dateEnd) {
    // Date range query with UTC conversion
    gte[dateColumn] = getUTCStartOfDay(filters.dateStart);
    lte[dateColumn] = getUTCEndOfDay(filters.dateEnd);
  } else if (filters.dateStart) {
    // Single date: capture entire Thai local day in UTC bounds
    gte[dateColumn] = getUTCStartOfDay(filters.dateStart);
    lte[dateColumn] = getUTCEndOfDay(filters.dateStart);
  } else if (filters.dateEnd) {
    // Only end date
    lte[dateColumn] = getUTCEndOfDay(filters.dateEnd);
  }

  // Add other filters
  if (filters.categoryId) {
    apiFilters.category_id = filters.categoryId;
  }
  if (filters.districtId) {
    apiFilters.districts_id = filters.districtId;
  }
  if (filters.subDistrictId) {
    apiFilters.sub_districts_id = filters.subDistrictId;
  }

  return { apiFilters, gte, lte };
}

/**
 * Helper function to build filters object for getTransactionsAction
 * Based on parsed filter values
 */
export function buildTransactionFilters(
  statusFilter: "all" | "pending" | "approved" | "rejected" | "paid",
) {
  return statusFilter !== "all" ? { status: statusFilter } : {};
}
