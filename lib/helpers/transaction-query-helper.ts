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

  // 🕐 Convert Thai local date to ISO string with timezone offset (+07:00)
  // Send timezone-aware ISO string directly to database
  // Example: "2026-03-08T00:00:00+07:00" tells DB this is Thai local time
  const getThaiDateStart = (localDateStr: string): string => {
    // Format: "2026-03-08T00:00:00+07:00"
    return `${localDateStr}T00:00:00+07:00`;
  };

  const getThaiDateEnd = (localDateStr: string): string => {
    // Format: "2026-03-08T23:59:59+07:00"
    return `${localDateStr}T23:59:59+07:00`;
  };

  // Add status filter
  if (filters.statusFilter !== "all") {
    apiFilters.status = filters.statusFilter;
  }

  // Add date range filters with timezone-aware ISO strings
  if (filters.dateStart && filters.dateEnd) {
    // Date range query with timezone offset
    gte[dateColumn] = getThaiDateStart(filters.dateStart);
    lte[dateColumn] = getThaiDateEnd(filters.dateEnd);
  } else if (filters.dateStart) {
    // Single date: capture entire Thai local day
    gte[dateColumn] = getThaiDateStart(filters.dateStart);
    lte[dateColumn] = getThaiDateEnd(filters.dateStart);
  } else if (filters.dateEnd) {
    // Only end date
    lte[dateColumn] = getThaiDateEnd(filters.dateEnd);
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
