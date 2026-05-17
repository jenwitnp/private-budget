DROP FUNCTION IF EXISTS public.search_members(text);

-- Search members by name (single word: first OR last, two words: first AND last)
-- SECURITY DEFINER runs with owner privileges — bypasses RLS and anon-key table grants.
-- Called via: supabase.rpc('search_members', { q: '...' })

CREATE OR REPLACE FUNCTION public.search_members(q text)
RETURNS TABLE(
  id              uuid,
  first_name      text,
  last_name       text,
  level           text,
  district        text,
  subdistrict     text,
  village_no      smallint,
  house_no        text,
  district_id     bigint,
  sub_district_id bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
BEGIN
  parts := regexp_split_to_array(trim(q), '\s+');

  IF array_length(parts, 1) >= 2 THEN
    RETURN QUERY
      SELECT m.id,
             m.first_name,
             m.last_name,
             m.level::text,
             m.district,
             m.subdistrict,
             m.village_no,
             m.house_no,
             m.district_id,
             m.sub_district_id
        FROM members m
       WHERE NOT m.is_archived
         AND m.first_name ILIKE '%' || parts[1] || '%'
         AND m.last_name  ILIKE '%' || parts[2] || '%'
       ORDER BY m.level, m.first_name
       LIMIT 10;
  ELSE
    RETURN QUERY
      SELECT m.id,
             m.first_name,
             m.last_name,
             m.level::text,
             m.district,
             m.subdistrict,
             m.village_no,
             m.house_no,
             m.district_id,
             m.sub_district_id
        FROM members m
       WHERE NOT m.is_archived
         AND (m.first_name ILIKE '%' || q || '%'
              OR m.last_name ILIKE '%' || q || '%')
       ORDER BY m.level, m.first_name
       LIMIT 10;
  END IF;
END;
$$;

-- Allow the anon and authenticated roles to call this function
GRANT EXECUTE ON FUNCTION public.search_members(text) TO anon, authenticated;
