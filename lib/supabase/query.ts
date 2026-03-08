import { supabase } from "../supabaseClient";

/**
 * Filter configuration type
 */
interface Filter {
  column: string;
  operator: "eq" | "neq" | "in" | "gt" | "gte" | "lt" | "lte";
  value: any;
}

/**
 * Search configuration type
 */
export interface SearchConfig {
  column: string;
  query: string;
}

/**
 * Query options type
 */
export interface QueryOptions {
  select?: string;
  filters?: Filter[] | Record<string, any>;
  notEquals?: Record<string, any>;
  sort?: [string, "asc" | "desc"];
  page?: number | null;
  pageSize?: number | null;
  limit?: number | null;
  total?: Record<string, any>;
  single?: boolean;
  search?: SearchConfig[];
  lte?: Record<string, any>;
  gte?: Record<string, any>;
}

/**
 * Query result type
 */
interface QueryResult<T = any> {
  success: boolean;
  data?: T | T[] | null;
  count?: number;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * Debug info type
 */
interface DebugInfo {
  table: string;
  select?: string;
  filters?: any;
  notEquals?: any;
  search?: SearchConfig[];
  lte?: Record<string, any>;
  gte?: Record<string, any>;
  sort?: [string, "asc" | "desc"];
  pagination?: { page: number; pageSize: number };
  limit?: number;
}

/**
 * Flexible utility function for querying Supabase tables
 * @param table The table name to query
 * @param options Query options including filters, pagination, sorting
 * @returns Result object with success status and data
 */
export async function fetchData<T = any>(
  table: string,
  options: QueryOptions = {},
): Promise<QueryResult<T>> {
  // Remove empty values from options
  const cleanOptions = Object.fromEntries(
    Object.entries(options).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() !== "") &&
        (!Array.isArray(value) || value.length > 0) &&
        (!(typeof value === "object" && !Array.isArray(value)) ||
          Object.keys(value).length > 0),
    ),
  ) as QueryOptions;

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
    let query: any = supabase.from(table as any) as any;

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
        Object.keys(total).length > 0 ? total : undefined,
      );
    }

    // Apply filters
    if (filters && Array.isArray(filters)) {
      filters.forEach((filter: Filter) => {
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
      search.forEach(({ column, query: q }: SearchConfig) => {
        query = query.ilike(column, `%${q}%`);
      });
    }

    // Apply lte (less than or equal) for multiple columns
    if (lte && typeof lte === "object") {
      Object.entries(lte).forEach(([column, value]) => {
        console.log(`  🔽 LTE filter: ${column} <= ${value}`);
        query = query.lte(column, value);
      });
    }

    // Apply gte (greater than or equal) for multiple columns
    if (gte && typeof gte === "object") {
      Object.entries(gte).forEach(([column, value]) => {
        console.log(`  🔼 GTE filter: ${column} >= ${value}`);
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
    let data: any;
    let error: any;
    let count: number | null;

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
        data: undefined,
        message: error.message,
      } as QueryResult<T>;
    }

    // Return successful result
    return {
      success: true,
      data: data,
      count: count ?? 0,
    } as QueryResult<T>;
  } catch (error: any) {
    console.error(
      `Unexpected error fetching data from ${table}:`,
      error.message,
    );
    return {
      success: false,
      data: undefined,
      message: error.message,
    } as QueryResult<T>;
  }
}

/**
 * Save data to a Supabase table
 * @param table The table name to save to
 * @param data The data to insert
 * @returns Result object with success status and inserted data
 */
export async function saveData<T = any>(
  table: string,
  data: T | T[],
): Promise<QueryResult<T>> {
  try {
    // Insert the data into the specified table
    const { data: result, error } = await (supabase.from(table as any) as any)
      .insert(data)
      .select();

    if (error) {
      console.error(`Error saving data to ${table}:`, error);
      return {
        success: false,
        data: undefined,
        error: error.message,
        details: error.details,
      } as QueryResult<T>;
    }

    return {
      success: true,
      data: Array.isArray(result) && result.length > 0 ? result[0] : null,
    } as QueryResult<T>;
  } catch (error: any) {
    console.error(`Exception saving data to ${table}:`, error);
    return {
      success: false,
      data: undefined,
      error: error.message,
    } as QueryResult<T>;
  }
}

/**
 * Get debug information about a query for testing/debugging purposes
 * @param table The table name to query
 * @param options Query options including filters, pagination, sorting
 * @returns An object representing the query structure
 */
export function getQueryDebugInfo(
  table: string,
  options: QueryOptions = {},
): DebugInfo {
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
  const queryInfo: DebugInfo = {
    table,
    select,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    notEquals: Object.keys(notEquals).length > 0 ? notEquals : undefined,
    search: search?.length ? search : undefined,
    lte: Object.keys(lte).length > 0 ? lte : undefined,
    gte: Object.keys(gte).length > 0 ? gte : undefined,
    sort: sort || undefined,
    pagination:
      page !== null && pageSize !== null ? { page, pageSize } : undefined,
    limit: limit !== null ? limit : undefined,
  };

  return queryInfo;
}

/**
 * Update data in a Supabase table
 * @param table The table name to update
 * @param data The data to update
 * @param filters Filters to specify which rows to update
 * @returns Result object with success status and updated data
 */
export async function updateData<T = any>(
  table: string,
  data: Partial<T>,
  filters: Record<string, any>,
): Promise<QueryResult<T>> {
  if (!filters || Object.keys(filters).length === 0) {
    console.error(`Error updating data in ${table}: No filters provided.`);
    return {
      success: false,
      data: undefined,
      error: "Update operation requires at least one filter.",
    } as QueryResult<T>;
  }

  try {
    let query: any = (supabase.from(table as any) as any).update(data);

    // Apply all filters from the filters object
    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      console.error(`Error updating data in ${table}:`, error);
      return {
        success: false,
        data: undefined,
        error: error.message,
        details: error.details,
      } as QueryResult<T>;
    }

    return {
      success: true,
      data:
        Array.isArray(result) && result.length > 0 ? result[0] : (null as any),
    } as QueryResult<T>;
  } catch (error: any) {
    console.error(`Exception updating data in ${table}:`, error);
    return {
      success: false,
      data: undefined,
      error: error.message,
    } as QueryResult<T>;
  }
}

/**
 * Delete data from a Supabase table based on filters
 * @param table The table name to delete from
 * @param filters Filters to specify which rows to delete
 * @returns Result object with success status and count of deleted rows
 */
export async function deleteData<T = any>(
  table: string,
  filters: Record<string, any> = {},
): Promise<QueryResult<T>> {
  if (!filters || Object.keys(filters).length === 0) {
    console.error(`Error deleting data from ${table}: No filters provided.`);
    return {
      success: false,
      data: undefined,
      error: "Delete operation requires at least one filter for safety.",
    } as QueryResult<T>;
  }

  try {
    let query: any = (supabase.from(table as any) as any).delete();

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
        data: undefined,
        error: error.message,
        details: error.details,
      } as QueryResult<T>;
    }

    console.log(`Successfully deleted ${count || 0} rows from ${table}`);

    return {
      success: true,
      data: (data || []) as T[],
      count: count || 0,
    } as QueryResult<T>;
  } catch (error: any) {
    console.error(`Exception deleting data from ${table}:`, error);
    return {
      success: false,
      data: undefined,
      error: error.message,
    } as QueryResult<T>;
  }
}
