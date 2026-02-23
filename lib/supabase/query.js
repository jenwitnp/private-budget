import supabase from "../supabase";

/**
 * Flexible utility function for querying Supabase tables
 * @param {string} table The table name to query
 * @param {object} options Query options including filters, pagination, sorting
 * @returns {object} Result object with success status and data
 */
export async function fetchData(table, options = {}) {
  // Remove empty values from options
  const cleanOptions = Object.fromEntries(
    Object.entries(options).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() !== "") &&
        (!Array.isArray(value) || value.length > 0) &&
        (!(typeof value === "object" && !Array.isArray(value)) ||
          Object.keys(value).length > 0)
    )
  );

  const {
    select = "*",
    filters = {},
    notEquals = {},
    sort = null,
    page = null,
    pageSize = null,
    limit = null,
    total = {},
    single = false,
    search = null,
    lte = {},
    gte = {},
  } = cleanOptions;

  try {
    let query = supabase.from(table);

    // Apply select - handle single differently
    if (single) {
      // For single queries, don't use count
      query = query.select(select);
    } else if (select !== "*") {
      query = query.select(select, total);
    } else {
      // ✅ SAFE FIX: Use total parameter if provided, even when select === "*"
      // This only affects queries that explicitly pass total: { count: "exact" }
      // Backward compatible - if no total passed, works as before
      query = query.select(
        "*",
        Object.keys(total).length > 0 ? total : undefined
      );
    }

    // Apply filters
    if (filters && Array.isArray(filters)) {
      filters.forEach((filter) => {
        const { column, operator, value } = filter;

        switch (operator) {
          case "eq":
            query = query.eq(column, value);
            break;
          case "neq":
            query = query.neq(column, value);
            break;
          case "in":
            query = query.in(column, value);
            break;
          case "gt":
            query = query.gt(column, value);
            break;
          case "gte":
            query = query.gte(column, value);
            break;
          case "lt":
            query = query.lt(column, value);
            break;
          case "lte":
            query = query.lte(column, value);
            break;
          default:
            console.warn(`Unknown filter operator: ${operator}`);
        }
      });
    } else if (
      filters &&
      typeof filters === "object" &&
      !Array.isArray(filters)
    ) {
      // Handle legacy filter format for backward compatibility
      Object.entries(filters).forEach(([column, value]) => {
        query = query.eq(column, value);
      });
    }

    // Improved search: support multiple columns with AND logic
    if (Array.isArray(search) && search.length > 0) {
      // Apply each search condition with AND logic (all must match)
      search.forEach(({ column, query: q }) => {
        query = query.ilike(column, `%${q}%`);
      });
    }

    // Apply lte (less than or equal) for multiple columns
    if (lte && typeof lte === "object") {
      Object.entries(lte).forEach(([column, value]) => {
        query = query.lte(column, value);
      });
    }

    // Apply gte (greater than or equal) for multiple columns
    if (gte && typeof gte === "object") {
      Object.entries(gte).forEach(([column, value]) => {
        query = query.gte(column, value);
      });
    }

    // Apply sorting
    if (sort) {
      const [column, order] = sort;
      query = query.order(column, { ascending: order === "asc" });
    }

    // Apply pagination
    if (page !== null && pageSize !== null) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    // Apply limit
    if (limit !== null) {
      query = query.limit(limit);
    }

    // Execute query
    let data, error, count;

    if (single) {
      // For single queries, use maybeSingle() which returns null if no rows found
      // and doesn't error on multiple rows (just returns first)
      const result = await query.maybeSingle();
      data = result.data;
      error = result.error;
      count = data ? 1 : 0;
    } else {
      const result = await query;
      data = result.data;
      error = result.error;
      count = result.count;
    }

    // Handle errors
    if (error) {
      console.error(`Error fetching data from ${table}:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }

    // Return successful result
    return {
      success: true,
      data: data,
      count: count ?? 0,
    };
  } catch (error) {
    console.error(
      `Unexpected error fetching data from ${table}:`,
      error.message
    );
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function saveData(table, data) {
  try {
    // Insert the data into the specified table
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      console.error(`Error saving data to ${table}:`, error);
      return {
        success: false,
        error: error.message,
        details: error.details,
      };
    }

    return {
      success: true,
      data: result[0], // Return the first inserted row
    };
  } catch (error) {
    console.error(`Exception saving data to ${table}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get debug information about a query for testing/debugging purposes
 * @param {string} table The table name to query
 * @param {object} options Query options including filters, pagination, sorting
 * @returns {object} An object representing the query structure
 */
export function getQueryDebugInfo(table, options = {}) {
  const {
    select = "*",
    filters = {},
    notEquals = {},
    sort = null,
    page = null,
    pageSize = null,
    limit = null,
    search = null,
    lte = {},
    gte = {},
  } = options;

  // Build a representation of the query for debugging
  const queryInfo = {
    table,
    select,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    notEquals: Object.keys(notEquals).length > 0 ? notEquals : undefined,
    search: search?.length ? search : undefined,
    lte: Object.keys(lte).length > 0 ? lte : undefined,
    gte: Object.keys(gte).length > 0 ? gte : undefined,
    sort,
    pagination:
      page !== null && pageSize !== null ? { page, pageSize } : undefined,
    limit: limit !== null ? limit : undefined,
  };

  return queryInfo;
}

export async function updateData(table, data, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    console.error(`Error updating data in ${table}: No filters provided.`);
    return {
      success: false,
      error: "Update operation requires at least one filter.",
    };
  }

  try {
    let query = supabase.from(table).update(data);

    // Apply all filters from the filters object
    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      console.error(`Error updating data in ${table}:`, error);
      return {
        success: false,
        error: error.message,
        details: error.details,
      };
    }

    return {
      success: true,
      // Supabase returns an array of updated rows. We often want the first one.
      data: result && result.length > 0 ? result[0] : null,
    };
  } catch (error) {
    console.error(`Exception updating data in ${table}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete data from a Supabase table based on filters
 * @param {string} table The table name to delete from
 * @param {object} filters Filters to specify which rows to delete
 * @returns {object} Result object with success status and count of deleted rows
 */
export async function deleteData(table, filters = {}) {
  if (!filters || Object.keys(filters).length === 0) {
    console.error(`Error deleting data from ${table}: No filters provided.`);
    return {
      success: false,
      error: "Delete operation requires at least one filter for safety.",
    };
  }

  try {
    let query = supabase.from(table).delete();

    // Apply filters
    Object.entries(filters).forEach(([column, value]) => {
      if (typeof value === "object" && value !== null) {
        // Handle comparison operators like lt, gt, gte, lte
        Object.entries(value).forEach(([operator, operatorValue]) => {
          switch (operator) {
            case "lt":
              query = query.lt(column, operatorValue);
              break;
            case "lte":
              query = query.lte(column, operatorValue);
              break;
            case "gt":
              query = query.gt(column, operatorValue);
              break;
            case "gte":
              query = query.gte(column, operatorValue);
              break;
            case "eq":
              query = query.eq(column, operatorValue);
              break;
            case "neq":
              query = query.neq(column, operatorValue);
              break;
            case "in":
              query = query.in(column, operatorValue);
              break;
            default:
              // Default to equality
              query = query.eq(column, operatorValue);
          }
        });
      } else if (Array.isArray(value)) {
        // Handle array values with 'in' operator
        query = query.in(column, value);
      } else {
        // Handle simple equality
        query = query.eq(column, value);
      }
    });

    const { data, error, count } = await query;

    if (error) {
      console.error(`Error deleting data from ${table}:`, error);
      return {
        success: false,
        error: error.message,
        details: error.details,
      };
    }

    console.log(`Successfully deleted ${count || 0} rows from ${table}`);

    return {
      success: true,
      count: count || 0,
      data: data || [],
    };
  } catch (error) {
    console.error(`Exception deleting data from ${table}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}
