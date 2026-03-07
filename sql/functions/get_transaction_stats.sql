/**
 * RPC Function: get_transaction_stats
 * 
 * Efficiently aggregates transaction statistics in a single database query
 * with built-in permission checking.
 * Returns counts for all statuses in one response
 * 
 * Permission Logic:
 * - 'owner' and 'admin' roles: See all transactions
 * - 'user' role: See only their own transactions (filtered by user_id)
 * 
 * Parameters:
 * - p_user_role: User role ('user', 'owner', 'admin') for permission checking
 * - p_user_id: Current user's ID (UUID, for permission-based filtering)
 * - p_search: Search term for transaction_number, description, notes
 * - p_category_id: Filter by category (UUID)
 * - p_district_id: Filter by district (BIGINT)
 * - p_sub_district_id: Filter by sub-district (BIGINT)
 * - p_date_start: Filter transactions from this date (TIMESTAMP)
 * - p_date_end: Filter transactions up to this date (TIMESTAMP)
 * 
 * Schema References (from transactions_detail_with_categories view):
 * - user_id: UUID (transaction creator, used for permission checking)
 * - category_id: UUID
 * - district_id: BIGINT (singular, not plural)
 * - sub_district_id: BIGINT (singular, not plural)
 */

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_transaction_stats(text, uuid, text, uuid, bigint, bigint, timestamp, timestamp);
DROP FUNCTION IF EXISTS public.get_transaction_stats(text, uuid, text, uuid, bigint, bigint, timestamp, timestamp);
-- Also drop old incorrect signatures with int types
DROP FUNCTION IF EXISTS get_transaction_stats(text, uuid, text, int, int, int, timestamp, timestamp);
DROP FUNCTION IF EXISTS public.get_transaction_stats(text, uuid, text, int, int, int, timestamp, timestamp);

create or replace function get_transaction_stats(
  p_user_role text default 'user',
  p_user_id uuid default null,
  p_search text default '',
  p_category_id uuid default null,
  p_district_id bigint default null,
  p_sub_district_id bigint default null,
  p_date_start timestamp default null,
  p_date_end timestamp default null
) returns table (
  pending int,
  approved int,
  rejected int,
  paid int
) as $$
begin
  return query
  select
    count(*) filter (where status = 'pending')::int as pending,
    count(*) filter (where status = 'approved')::int as approved,
    count(*) filter (where status = 'rejected')::int as rejected,
    count(*) filter (where status = 'paid')::int as paid
  from transactions_detail_with_categories
  where 
    -- Search filter (search across transaction_number, description, notes)
    (p_search = '' or 
     transaction_number ilike '%' || p_search || '%' or 
     description ilike '%' || p_search || '%' or 
     notes ilike '%' || p_search || '%')
    -- Category filter (category_id is UUID)
    and (p_category_id is null or category_id = p_category_id)
    -- District filter (district_id is BIGINT, note: singular not plural)
    and (p_district_id is null or district_id = p_district_id)
    -- Sub-district filter (sub_district_id is BIGINT, note: singular not plural)
    and (p_sub_district_id is null or sub_district_id = p_sub_district_id)
    -- Date range filters (with timezone handling)
    and (p_date_start is null or created_at >= p_date_start)
    and (p_date_end is null or created_at <= p_date_end)
    -- Permission-based filter:
    -- 'user' role: can only see own transactions (user_id is UUID)
    -- 'owner' and 'admin': can see all transactions
    and (
      (p_user_role = 'owner' or p_user_role = 'admin') or
      (p_user_role = 'user' and user_id = p_user_id)
    );
end;
$$ language plpgsql stable;

-- Security note: This function enforces permission checking at the database level
-- The server-side application must validate the user's role from the session before calling this function
-- depending on your permission model
