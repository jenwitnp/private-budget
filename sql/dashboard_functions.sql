-- ===================================
-- Dashboard Analytics Functions
-- ===================================

-- Function 1: Get total paid amount by district
-- Returns all districts with their total paid amounts (net_amount)
CREATE OR REPLACE FUNCTION get_district_totals()
RETURNS TABLE (
  district_id bigint,
  district_name character varying,
  total_amount numeric,
  paid_count bigint,
  transaction_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as district_id,
    d.name as district_name,
    COALESCE(SUM(t.net_amount), 0) as total_amount,
    COUNT(CASE WHEN t.status = 'paid' THEN 1 END) as paid_count,
    COUNT(t.id) as transaction_count
  FROM districts d
  LEFT JOIN transactions t ON d.id = t.districts_id AND t.status = 'paid'
  GROUP BY d.id, d.name
  ORDER BY total_amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: Get total paid amount by sub_district
-- Returns all sub_districts with their total paid amounts (net_amount)
CREATE OR REPLACE FUNCTION get_sub_district_totals()
RETURNS TABLE (
  sub_district_id bigint,
  sub_district_name character varying,
  district_name character varying,
  total_amount numeric,
  paid_count bigint,
  transaction_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.id as sub_district_id,
    sd.name as sub_district_name,
    d.name as district_name,
    COALESCE(SUM(t.net_amount), 0) as total_amount,
    COUNT(CASE WHEN t.status = 'paid' THEN 1 END) as paid_count,
    COUNT(t.id) as transaction_count
  FROM sub_districts sd
  LEFT JOIN districts d ON sd.district_id = d.id
  LEFT JOIN transactions t ON sd.id = t.sub_districts_id AND t.status = 'paid'
  GROUP BY sd.id, sd.name, d.name
  ORDER BY total_amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 3: Get total paid amount by category
-- Returns all categories with their total paid amounts (net_amount)
CREATE OR REPLACE FUNCTION get_category_totals()
RETURNS TABLE (
  category_id uuid,
  category_name character varying,
  total_amount numeric,
  paid_count bigint,
  transaction_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as category_id,
    c.name as category_name,
    COALESCE(SUM(t.net_amount), 0) as total_amount,
    COUNT(CASE WHEN t.status = 'paid' THEN 1 END) as paid_count,
    COUNT(t.id) as transaction_count
  FROM categories c
  LEFT JOIN transactions t ON c.id = t.category_id AND t.status = 'paid'
  GROUP BY c.id, c.name
  ORDER BY total_amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 4: Get aggregated dashboard summary
-- Returns overall statistics for the dashboard
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
  total_paid_amount numeric,
  total_transactions bigint,
  total_paid_transactions bigint,
  total_pending_transactions bigint,
  total_districts bigint,
  total_categories bigint,
  average_transaction_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.net_amount ELSE 0 END), 0) as total_paid_amount,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(DISTINCT CASE WHEN t.status = 'paid' THEN t.id END) as total_paid_transactions,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as total_pending_transactions,
    COUNT(DISTINCT t.districts_id) as total_districts,
    COUNT(DISTINCT t.category_id) as total_categories,
    COALESCE(AVG(CASE WHEN t.status = 'paid' THEN t.net_amount END), 0) as average_transaction_amount
  FROM transactions t;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_status_net_amount ON transactions(status, net_amount) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_transactions_district_status ON transactions(districts_id, status) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_transactions_sub_district_status ON transactions(sub_districts_id, status) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_transactions_category_status ON transactions(category_id, status) WHERE status = 'paid';
