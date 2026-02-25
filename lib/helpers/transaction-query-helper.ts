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

  // Add status filter
  if (filters.statusFilter !== "all") {
    apiFilters.status = filters.statusFilter;
  }

  // Add date range filters using dynamic column
  // Logic:
  // - Both dates provided: use range (GTE and LTE)
  // - Only start date: use equality (exact date match)
  // - Only end date: use LTE (up to that date)
  if (filters.dateStart && filters.dateEnd) {
    // Range query
    gte[dateColumn] = filters.dateStart;
    lte[dateColumn] = filters.dateEnd;
  } else if (filters.dateStart) {
    // Only start date: exact date match
    apiFilters[dateColumn] = filters.dateStart;
  } else if (filters.dateEnd) {
    // Only end date: up to that date
    lte[dateColumn] = filters.dateEnd;
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
