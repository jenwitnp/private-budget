
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."account_type" AS ENUM (
    'savings',
    'current',
    'fixed_deposit',
    'money_market',
    'other'
);


ALTER TYPE "public"."account_type" OWNER TO "postgres";


CREATE TYPE "public"."bank_name" AS ENUM (
    '002',
    '004',
    '006',
    '011',
    '014',
    '021',
    '022',
    '025',
    '034',
    '035',
    '040',
    '042',
    '044',
    '045',
    '047',
    '048',
    '050',
    '051',
    '052',
    '053',
    '054',
    '055',
    '056',
    '057',
    '058',
    '070',
    '073',
    '074',
    '075',
    '076',
    '077',
    '078',
    '079',
    '080',
    '081',
    '082',
    '083',
    '999'
);


ALTER TYPE "public"."bank_name" OWNER TO "postgres";


CREATE TYPE "public"."complaint_status" AS ENUM (
    'pending',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."complaint_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'success',
    'failed',
    'cancelled',
    'rejected',
    'approved',
    'paid'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'admin',
    'owner'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'active',
    'inactive',
    'suspended',
    'deleted'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_totals"() RETURNS TABLE("category_id" "uuid", "category_name" character varying, "total_amount" numeric, "paid_count" bigint, "transaction_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_category_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary"() RETURNS TABLE("total_paid_amount" numeric, "total_transactions" bigint, "total_paid_transactions" bigint, "total_pending_transactions" bigint, "total_districts" bigint, "total_categories" bigint, "average_transaction_amount" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_dashboard_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_district_totals"() RETURNS TABLE("district_id" bigint, "district_name" character varying, "total_amount" numeric, "paid_count" bigint, "transaction_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_district_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sub_district_totals"() RETURNS TABLE("sub_district_id" bigint, "sub_district_name" character varying, "district_name" character varying, "total_amount" numeric, "paid_count" bigint, "transaction_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_sub_district_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_transaction_stats"("p_user_role" "text" DEFAULT 'user'::"text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_search" "text" DEFAULT ''::"text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_district_id" bigint DEFAULT NULL::bigint, "p_sub_district_id" bigint DEFAULT NULL::bigint, "p_date_start" timestamp without time zone DEFAULT NULL::timestamp without time zone, "p_date_end" timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS TABLE("pending" integer, "approved" integer, "rejected" integer, "paid" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_transaction_stats"("p_user_role" "text", "p_user_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_district_id" bigint, "p_sub_district_id" bigint, "p_date_start" timestamp without time zone, "p_date_end" timestamp without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bank_accounts_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bank_accounts_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_complaints_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_complaints_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_schedule_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_schedule_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transaction_result"("p_audit_id" "uuid", "p_schedule_id" bigint, "p_transaction_id" "uuid", "p_status" character varying, "p_response_payload" "jsonb", "p_error_details" "jsonb", "p_duration_ms" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.transaction_audit_logs
  set 
    schedule_id = p_schedule_id,
    transaction_id = p_transaction_id,
    status = p_status,
    response_payload = p_response_payload,
    error_details = p_error_details,
    duration_ms = p_duration_ms,
    completed_at = CURRENT_TIMESTAMP
  where id = p_audit_id;
end;
$$;


ALTER FUNCTION "public"."update_transaction_result"("p_audit_id" "uuid", "p_schedule_id" bigint, "p_transaction_id" "uuid", "p_status" character varying, "p_response_payload" "jsonb", "p_error_details" "jsonb", "p_duration_ms" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transactions_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_transactions_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_users_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_users_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "action" character varying(100),
    "resource_type" character varying(100),
    "resource_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."admin_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_logs" IS 'Administrative action logs';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(255),
    "entity_type" character varying(100),
    "entity_id" "uuid",
    "changes" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'General audit logging';



CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_number" character varying(50) NOT NULL,
    "account_name" character varying(255),
    "account_type" character varying,
    "bank" character varying NOT NULL,
    "bank_name" character varying(100),
    "branch_name" character varying(100),
    "account_holder_name" character varying(255),
    "account_holder_id" character varying(20),
    "is_primary" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "account_balance" numeric(15,2) DEFAULT 0.00,
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" "uuid",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "color" character varying(7),
    "icon" character varying(50),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "display_order" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "categories_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaint_replies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "complaint_id" "uuid" NOT NULL,
    "from_user_id" "uuid",
    "from_line" boolean DEFAULT false,
    "reply_text" "text" NOT NULL,
    "attachment_url" character varying(500),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."complaint_replies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaints" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "line_user_id" character varying(255) NOT NULL,
    "user_id" "uuid",
    "complaint_text" "text" NOT NULL,
    "category" character varying(100),
    "status" "public"."complaint_status" DEFAULT 'pending'::"public"."complaint_status" NOT NULL,
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "attachment_url" character varying(500),
    "notes" "text",
    "replied_by" "uuid",
    "replied_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "line_user_id_not_empty" CHECK ((("line_user_id")::"text" <> ''::"text"))
);


ALTER TABLE "public"."complaints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_number" character varying(50) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bank_account_id" "uuid",
    "amount" numeric(15,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'THB'::character varying,
    "description" "text",
    "notes" "text",
    "status" "public"."transaction_status" DEFAULT 'pending'::"public"."transaction_status",
    "status_changed_at" timestamp with time zone,
    "status_changed_by" "uuid",
    "recipient_name" character varying(255),
    "recipient_account_number" character varying(50),
    "recipient_bank" character varying(100),
    "transaction_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "error_code" character varying(50),
    "error_message" "text",
    "fee_amount" numeric(15,2) DEFAULT 0.00,
    "net_amount" numeric(15,2),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "districts_id" bigint,
    "sub_districts_id" bigint,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejected_by" "uuid",
    "rejected_at" timestamp with time zone,
    "item_name" character varying,
    "paid_by" "uuid",
    "paid_at" timestamp with time zone,
    "category_id" "uuid",
    "payment_method" character varying(50) DEFAULT 'transfer'::character varying,
    "thumbnail" character varying,
    "transaction_type" smallint DEFAULT '1'::smallint,
    CONSTRAINT "transactions_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['cash'::character varying, 'transfer'::character varying, NULL::character varying])::"text"[])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Transaction records including withdrawals and transfers';



COMMENT ON COLUMN "public"."transactions"."payment_method" IS 'Payment method used for this transaction: cash or transfer';



CREATE OR REPLACE VIEW "public"."daily_transaction_summary" AS
 SELECT "date"("transaction_date") AS "day",
    "user_id",
    "count"(*) AS "transaction_count",
    ("sum"(
        CASE
            WHEN ("status" = 'success'::"public"."transaction_status") THEN "amount"
            ELSE (0)::numeric
        END))::numeric(15,2) AS "successful_amount",
    ("avg"(
        CASE
            WHEN ("status" = 'success'::"public"."transaction_status") THEN "amount"
            ELSE NULL::numeric
        END))::numeric(15,2) AS "avg_transaction_amount"
   FROM "public"."transactions" "t"
  GROUP BY ("date"("transaction_date")), "user_id";


ALTER VIEW "public"."daily_transaction_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."districts" (
    "id" bigint NOT NULL,
    "name" character varying(255) NOT NULL,
    "province" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."districts" OWNER TO "postgres";


COMMENT ON TABLE "public"."districts" IS 'อำเภอ (Districts in Thailand)';



COMMENT ON COLUMN "public"."districts"."province" IS 'จังหวัด (Province)';



CREATE SEQUENCE IF NOT EXISTS "public"."districts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."districts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."districts_id_seq" OWNED BY "public"."districts"."id";



CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "url" character varying NOT NULL,
    "cloud_url" character varying,
    "filename" character varying NOT NULL,
    "file_size" bigint,
    "mime_type" character varying(50) DEFAULT 'image/jpeg'::character varying,
    "width" integer,
    "height" integer,
    "storage_path" character varying,
    "thumbnail_url" character varying,
    "uploaded_by" "uuid" NOT NULL,
    "upload_status" character varying(20) DEFAULT 'completed'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "metadata" "jsonb",
    "schedule_id" bigint,
    CONSTRAINT "images_mime_type_check" CHECK ((("mime_type")::"text" ~~ 'image/%'::"text")),
    CONSTRAINT "images_upload_status_check" CHECK ((("upload_status")::"text" = ANY (ARRAY['pending'::"text", 'uploading'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."images" OWNER TO "postgres";


COMMENT ON TABLE "public"."images" IS 'Stores transaction-related images (receipts, proofs, documents) uploaded to Google Cloud Storage';



COMMENT ON COLUMN "public"."images"."id" IS 'Unique identifier for image record';



COMMENT ON COLUMN "public"."images"."transaction_id" IS 'Foreign key reference to transactions table';



COMMENT ON COLUMN "public"."images"."url" IS 'Local or temporary URL (deprecated - use cloud_url)';



COMMENT ON COLUMN "public"."images"."cloud_url" IS 'Google Cloud Storage public URL or media link';



COMMENT ON COLUMN "public"."images"."filename" IS 'Original filename of uploaded image';



COMMENT ON COLUMN "public"."images"."file_size" IS 'File size in bytes';



COMMENT ON COLUMN "public"."images"."mime_type" IS 'MIME type (e.g., image/jpeg, image/png)';



COMMENT ON COLUMN "public"."images"."width" IS 'Image width in pixels';



COMMENT ON COLUMN "public"."images"."height" IS 'Image height in pixels';



COMMENT ON COLUMN "public"."images"."storage_path" IS 'Path in Google Cloud Storage bucket (e.g., transactions/receipts/...)';



COMMENT ON COLUMN "public"."images"."thumbnail_url" IS 'URL to thumbnail version of image';



COMMENT ON COLUMN "public"."images"."uploaded_by" IS 'User ID who uploaded the image';



COMMENT ON COLUMN "public"."images"."upload_status" IS 'Status of image upload (pending, uploading, completed, failed)';



COMMENT ON COLUMN "public"."images"."metadata" IS 'Additional metadata stored as JSON (e.g., exif data, upload options)';



CREATE OR REPLACE VIEW "public"."monthly_transaction_summary" AS
 SELECT ("date_trunc"('month'::"text", "transaction_date"))::"date" AS "month",
    "user_id",
    "count"(*) AS "transaction_count",
    ("sum"(
        CASE
            WHEN ("status" = 'success'::"public"."transaction_status") THEN "amount"
            ELSE (0)::numeric
        END))::numeric(15,2) AS "successful_amount",
    ("sum"(
        CASE
            WHEN ("status" = 'pending'::"public"."transaction_status") THEN "amount"
            ELSE (0)::numeric
        END))::numeric(15,2) AS "pending_amount",
    ("sum"(
        CASE
            WHEN ("status" = ANY (ARRAY['failed'::"public"."transaction_status", 'cancelled'::"public"."transaction_status"])) THEN "amount"
            ELSE (0)::numeric
        END))::numeric(15,2) AS "failed_amount"
   FROM "public"."transactions" "t"
  GROUP BY ("date_trunc"('month'::"text", "transaction_date")), "user_id";


ALTER VIEW "public"."monthly_transaction_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(255),
    "message" "text",
    "type" character varying(50),
    "related_transaction_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "sent_via" character varying(50),
    "sent_at" timestamp with time zone,
    "delivery_status" character varying(50),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Notification records for users';



CREATE TABLE IF NOT EXISTS "public"."schedule" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "time_start" time without time zone,
    "time_end" time without time zone,
    "address" "text",
    "district_id" bigint,
    "sub_district_id" bigint,
    "note" "text",
    "status" character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "title" character varying,
    "key_word" character varying,
    "transaction_id" "uuid",
    CONSTRAINT "check_time_range" CHECK ((("time_start" IS NULL) OR ("time_end" IS NULL) OR ("time_start" < "time_end"))),
    CONSTRAINT "schedule_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."schedule" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."schedule_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."schedule_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schedule_id_seq" OWNED BY "public"."schedule"."id";



CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" character varying(255),
    "access_token" "text",
    "refresh_token" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "device_name" character varying(255),
    "is_active" boolean DEFAULT true,
    "last_activity" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."sessions" IS 'User session management';



CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "scope" character varying(50),
    "user_id" "uuid",
    "setting_key" character varying(255) NOT NULL,
    "setting_value" "text",
    "description" "text",
    "value_type" character varying(50),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sub_districts" (
    "id" bigint NOT NULL,
    "district_id" bigint NOT NULL,
    "name" character varying(255) NOT NULL,
    "villages_count" integer DEFAULT 0 NOT NULL,
    "examples" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."sub_districts" OWNER TO "postgres";


COMMENT ON TABLE "public"."sub_districts" IS 'ตำบล (Sub-districts in Thailand)';



COMMENT ON COLUMN "public"."sub_districts"."villages_count" IS 'จำนวนหมู่บ้าน (Number of villages)';



COMMENT ON COLUMN "public"."sub_districts"."examples" IS 'ตัวอย่างหมู่บ้าน (Example villages)';



CREATE SEQUENCE IF NOT EXISTS "public"."sub_districts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sub_districts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sub_districts_id_seq" OWNED BY "public"."sub_districts"."id";



CREATE TABLE IF NOT EXISTS "public"."transaction_audit" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "old_status" "public"."transaction_status",
    "new_status" "public"."transaction_status",
    "changed_by" "uuid",
    "change_reason" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."transaction_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."transaction_audit" IS 'Audit trail for transaction status changes';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "username" character varying(100) NOT NULL,
    "email" character varying(255),
    "password_hash" character varying(255),
    "first_name" character varying(100),
    "last_name" character varying(100),
    "phone_number" character varying(20),
    "avatar_url" "text",
    "date_of_birth" "date",
    "id_card_number" character varying(20),
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role",
    "status" "public"."user_status" DEFAULT 'active'::"public"."user_status",
    "balance" numeric(15,2) DEFAULT 0.00,
    "two_factor_enabled" boolean DEFAULT false,
    "two_factor_secret" character varying(255),
    "last_login_at" timestamp with time zone,
    "last_login_ip" "inet",
    "failed_login_attempts" integer DEFAULT 0,
    "locked_until" timestamp with time zone,
    "notification_email" boolean DEFAULT true,
    "notification_sms" boolean DEFAULT false,
    "language" character varying(10) DEFAULT 'th'::character varying,
    "currency" character varying(3) DEFAULT 'THB'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."transactions_detail" AS
 SELECT "t"."id",
    "t"."transaction_number",
    "t"."amount",
    "t"."currency",
    "t"."status",
    "t"."item_name",
    "t"."description",
    "t"."notes",
    "t"."transaction_date",
    "t"."created_at",
    "t"."updated_at",
    "u"."id" AS "user_id",
    "u"."username" AS "user_username",
    "u"."first_name" AS "user_first_name",
    "u"."last_name" AS "user_last_name",
    "concat"("u"."first_name", ' ', "u"."last_name") AS "user_full_name",
    "u"."email" AS "user_email",
    "u"."phone_number" AS "user_phone",
    "u"."id_card_number" AS "user_id_card",
    "u"."role" AS "user_role",
    "ba"."id" AS "bank_account_id",
    "ba"."account_number",
    "ba"."account_name",
    "ba"."bank",
    "ba"."bank_name",
    "ba"."branch_name",
    "ba"."account_holder_name",
    "ba"."account_holder_id" AS "account_holder_id_card",
    "ba"."is_primary" AS "bank_account_is_primary",
    "ba"."is_active" AS "bank_account_is_active",
    "ba"."verified" AS "bank_account_verified",
    "ba"."account_balance",
    "d"."id" AS "district_id",
    "d"."name" AS "district_name",
    "d"."province",
    "sd"."id" AS "sub_district_id",
    "sd"."name" AS "sub_district_name",
    "sd"."villages_count",
    "approval_user"."id" AS "approved_by_id",
    "concat"("approval_user"."first_name", ' ', "approval_user"."last_name") AS "approved_by_name",
    "approval_user"."username" AS "approved_by_username",
    "t"."approved_at",
    "rejection_user"."id" AS "rejected_by_id",
    "concat"("rejection_user"."first_name", ' ', "rejection_user"."last_name") AS "rejected_by_name",
    "rejection_user"."username" AS "rejected_by_username",
    "t"."rejected_at",
    "payment_user"."id" AS "paid_by_id",
    "concat"("payment_user"."first_name", ' ', "payment_user"."last_name") AS "paid_by_name",
    "payment_user"."username" AS "paid_by_username",
    "t"."paid_at",
    "created_by_user"."id" AS "created_by_id",
    "concat"("created_by_user"."first_name", ' ', "created_by_user"."last_name") AS "created_by_name",
    "t"."fee_amount",
    "t"."net_amount",
    "t"."error_code",
    "t"."error_message",
    "t"."ip_address",
    "t"."user_agent"
   FROM (((((((("public"."transactions" "t"
     LEFT JOIN "public"."users" "u" ON (("t"."user_id" = "u"."id")))
     LEFT JOIN "public"."bank_accounts" "ba" ON (("t"."bank_account_id" = "ba"."id")))
     LEFT JOIN "public"."districts" "d" ON (("t"."districts_id" = "d"."id")))
     LEFT JOIN "public"."sub_districts" "sd" ON (("t"."sub_districts_id" = "sd"."id")))
     LEFT JOIN "public"."users" "approval_user" ON (("t"."approved_by" = "approval_user"."id")))
     LEFT JOIN "public"."users" "rejection_user" ON (("t"."rejected_by" = "rejection_user"."id")))
     LEFT JOIN "public"."users" "payment_user" ON (("t"."paid_by" = "payment_user"."id")))
     LEFT JOIN "public"."users" "created_by_user" ON (("t"."created_by" = "created_by_user"."id")));


ALTER VIEW "public"."transactions_detail" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."transactions_detail_with_categories" AS
 SELECT "t"."id",
    "t"."transaction_number",
    "t"."amount",
    "t"."currency",
    "t"."status",
    "t"."item_name",
    "t"."description",
    "t"."notes",
    "t"."payment_method",
    "t"."transaction_date",
    "t"."created_at",
    "t"."updated_at",
    "u"."id" AS "user_id",
    "u"."username" AS "user_username",
    "u"."first_name" AS "user_first_name",
    "u"."last_name" AS "user_last_name",
    "concat"("u"."first_name", ' ', "u"."last_name") AS "user_full_name",
    "u"."email" AS "user_email",
    "u"."phone_number" AS "user_phone",
    "u"."id_card_number" AS "user_id_card",
    "u"."role" AS "user_role",
    "ba"."id" AS "bank_account_id",
    "ba"."account_number",
    "ba"."account_name",
    "ba"."bank",
    "ba"."bank_name",
    "ba"."branch_name",
    "ba"."account_holder_name",
    "ba"."account_holder_id" AS "account_holder_id_card",
    "ba"."is_primary" AS "bank_account_is_primary",
    "ba"."is_active" AS "bank_account_is_active",
    "ba"."verified" AS "bank_account_verified",
    "ba"."account_balance",
    "d"."id" AS "district_id",
    "d"."name" AS "district_name",
    "d"."province",
    "sd"."id" AS "sub_district_id",
    "sd"."name" AS "sub_district_name",
    "sd"."villages_count",
    "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "c"."description" AS "category_description",
    "c"."color" AS "category_color",
    "c"."icon" AS "category_icon",
    "approval_user"."id" AS "approved_by_id",
    "concat"("approval_user"."first_name", ' ', "approval_user"."last_name") AS "approved_by_name",
    "approval_user"."username" AS "approved_by_username",
    "t"."approved_at",
    "rejection_user"."id" AS "rejected_by_id",
    "concat"("rejection_user"."first_name", ' ', "rejection_user"."last_name") AS "rejected_by_name",
    "rejection_user"."username" AS "rejected_by_username",
    "t"."rejected_at",
    "payment_user"."id" AS "paid_by_id",
    "concat"("payment_user"."first_name", ' ', "payment_user"."last_name") AS "paid_by_name",
    "payment_user"."username" AS "paid_by_username",
    "t"."paid_at",
    "created_by_user"."id" AS "created_by_id",
    "concat"("created_by_user"."first_name", ' ', "created_by_user"."last_name") AS "created_by_name",
    "t"."fee_amount",
    "t"."net_amount",
    "t"."thumbnail",
    "t"."error_code",
    "t"."error_message",
    "t"."ip_address",
    "t"."user_agent"
   FROM ((((((((("public"."transactions" "t"
     LEFT JOIN "public"."users" "u" ON (("t"."user_id" = "u"."id")))
     LEFT JOIN "public"."bank_accounts" "ba" ON (("t"."bank_account_id" = "ba"."id")))
     LEFT JOIN "public"."districts" "d" ON (("t"."districts_id" = "d"."id")))
     LEFT JOIN "public"."sub_districts" "sd" ON (("t"."sub_districts_id" = "sd"."id")))
     LEFT JOIN "public"."categories" "c" ON (("t"."category_id" = "c"."id")))
     LEFT JOIN "public"."users" "approval_user" ON (("t"."approved_by" = "approval_user"."id")))
     LEFT JOIN "public"."users" "rejection_user" ON (("t"."rejected_by" = "rejection_user"."id")))
     LEFT JOIN "public"."users" "payment_user" ON (("t"."paid_by" = "payment_user"."id")))
     LEFT JOIN "public"."users" "created_by_user" ON (("t"."created_by" = "created_by_user"."id")));


ALTER VIEW "public"."transactions_detail_with_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "title" character varying(100),
    "department" character varying(100),
    "company_name" character varying(255),
    "street_address" character varying(255),
    "city" character varying(100),
    "province" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100) DEFAULT 'Thailand'::character varying,
    "alternate_email" character varying(255),
    "alternate_phone" character varying(20),
    "facebook_url" "text",
    "twitter_url" "text",
    "linkedin_url" "text",
    "preferred_contact_method" character varying(50),
    "timezone" character varying(50) DEFAULT 'Asia/Bangkok'::character varying,
    "phone_verified" boolean DEFAULT false,
    "phone_verified_at" timestamp with time zone,
    "government_id_number" character varying(50),
    "government_id_type" character varying(50),
    "government_id_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'Extended user profile information';



CREATE TABLE IF NOT EXISTS "public"."verification_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" character varying(10) NOT NULL,
    "code_type" character varying(50),
    "purpose" character varying(100),
    "is_used" boolean DEFAULT false,
    "used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."verification_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawal_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "daily_limit" numeric(15,2),
    "monthly_limit" numeric(15,2),
    "per_transaction_limit" numeric(15,2),
    "daily_used" numeric(15,2) DEFAULT 0.00,
    "monthly_used" numeric(15,2) DEFAULT 0.00,
    "daily_reset_date" "date",
    "monthly_reset_date" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."withdrawal_limits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."districts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."districts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."schedule" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schedule_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sub_districts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sub_districts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaint_replies"
    ADD CONSTRAINT "complaint_replies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_scope_user_id_setting_key_key" UNIQUE ("scope", "user_id", "setting_key");



ALTER TABLE ONLY "public"."sub_districts"
    ADD CONSTRAINT "sub_districts_district_id_name_key" UNIQUE ("district_id", "name");



ALTER TABLE ONLY "public"."sub_districts"
    ADD CONSTRAINT "sub_districts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_audit"
    ADD CONSTRAINT "transaction_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_transaction_number_key" UNIQUE ("transaction_number");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."verification_codes"
    ADD CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawal_limits"
    ADD CONSTRAINT "withdrawal_limits_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_logs_admin_user_id" ON "public"."admin_logs" USING "btree" ("admin_user_id");



CREATE INDEX "idx_admin_logs_created_at" ON "public"."admin_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_logs_resource" ON "public"."admin_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_bank_accounts_account_number" ON "public"."bank_accounts" USING "btree" ("account_number");



CREATE INDEX "idx_bank_accounts_created_at" ON "public"."bank_accounts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bank_accounts_is_primary" ON "public"."bank_accounts" USING "btree" ("user_id", "is_primary");



CREATE UNIQUE INDEX "idx_bank_accounts_primary" ON "public"."bank_accounts" USING "btree" ("user_id") WHERE ("is_primary" = true);



CREATE INDEX "idx_bank_accounts_user_id" ON "public"."bank_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_categories_display_order" ON "public"."categories" USING "btree" ("display_order");



CREATE INDEX "idx_categories_status" ON "public"."categories" USING "btree" ("status");



CREATE INDEX "idx_complaint_replies_complaint_id" ON "public"."complaint_replies" USING "btree" ("complaint_id");



CREATE INDEX "idx_complaint_replies_created_at" ON "public"."complaint_replies" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_complaints_category" ON "public"."complaints" USING "btree" ("category");



CREATE INDEX "idx_complaints_created_at" ON "public"."complaints" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_complaints_line_user_id" ON "public"."complaints" USING "btree" ("line_user_id");



CREATE INDEX "idx_complaints_status" ON "public"."complaints" USING "btree" ("status");



CREATE INDEX "idx_complaints_user_id" ON "public"."complaints" USING "btree" ("user_id");



CREATE INDEX "idx_districts_province" ON "public"."districts" USING "btree" ("province");



CREATE INDEX "idx_images_created_at" ON "public"."images" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_images_schedule_only" ON "public"."images" USING "btree" ("schedule_id") WHERE (("schedule_id" IS NOT NULL) AND ("transaction_id" IS NULL));



CREATE INDEX "idx_images_schedule_transaction" ON "public"."images" USING "btree" ("schedule_id", "transaction_id") WHERE ("transaction_id" IS NOT NULL);



CREATE INDEX "idx_images_transaction_created" ON "public"."images" USING "btree" ("transaction_id", "created_at" DESC);



CREATE INDEX "idx_images_transaction_id" ON "public"."images" USING "btree" ("transaction_id");



CREATE INDEX "idx_images_upload_status" ON "public"."images" USING "btree" ("upload_status");



CREATE INDEX "idx_images_uploaded_by" ON "public"."images" USING "btree" ("uploaded_by");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("user_id", "is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_schedule_district_id" ON "public"."schedule" USING "btree" ("district_id");



CREATE INDEX "idx_schedule_scheduled_date" ON "public"."schedule" USING "btree" ("scheduled_date");



CREATE INDEX "idx_schedule_status" ON "public"."schedule" USING "btree" ("status");



CREATE INDEX "idx_schedule_sub_district_id" ON "public"."schedule" USING "btree" ("sub_district_id");



CREATE INDEX "idx_schedule_user_date" ON "public"."schedule" USING "btree" ("user_id", "scheduled_date");



CREATE INDEX "idx_schedule_user_id" ON "public"."schedule" USING "btree" ("user_id");



CREATE INDEX "idx_sessions_expires_at" ON "public"."sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_sessions_is_active" ON "public"."sessions" USING "btree" ("is_active");



CREATE INDEX "idx_sessions_session_token" ON "public"."sessions" USING "btree" ("session_token");



CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");



CREATE INDEX "idx_settings_scope_key" ON "public"."settings" USING "btree" ("scope", "setting_key");



CREATE INDEX "idx_settings_user_id" ON "public"."settings" USING "btree" ("user_id");



CREATE INDEX "idx_sub_districts_district_id" ON "public"."sub_districts" USING "btree" ("district_id");



CREATE INDEX "idx_sub_districts_name" ON "public"."sub_districts" USING "btree" ("name");



CREATE INDEX "idx_transaction_audit_created_at" ON "public"."transaction_audit" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_transaction_audit_transaction_id" ON "public"."transaction_audit" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_bank_account_id" ON "public"."transactions" USING "btree" ("bank_account_id");



CREATE INDEX "idx_transactions_category_id" ON "public"."transactions" USING "btree" ("category_id");



CREATE INDEX "idx_transactions_category_status" ON "public"."transactions" USING "btree" ("category_id", "status") WHERE ("status" = 'paid'::"public"."transaction_status");



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_transactions_detail_date" ON "public"."transactions" USING "btree" ("transaction_date" DESC);



CREATE INDEX "idx_transactions_detail_status" ON "public"."transactions" USING "btree" ("status");



CREATE INDEX "idx_transactions_detail_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_district_status" ON "public"."transactions" USING "btree" ("districts_id", "status") WHERE ("status" = 'paid'::"public"."transaction_status");



CREATE INDEX "idx_transactions_payment_method" ON "public"."transactions" USING "btree" ("payment_method");



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("status");



CREATE INDEX "idx_transactions_status_net_amount" ON "public"."transactions" USING "btree" ("status", "net_amount") WHERE ("status" = 'paid'::"public"."transaction_status");



CREATE INDEX "idx_transactions_sub_district_status" ON "public"."transactions" USING "btree" ("sub_districts_id", "status") WHERE ("status" = 'paid'::"public"."transaction_status");



CREATE INDEX "idx_transactions_transaction_date" ON "public"."transactions" USING "btree" ("transaction_date" DESC);



CREATE INDEX "idx_transactions_transaction_number" ON "public"."transactions" USING "btree" ("transaction_number");



CREATE INDEX "idx_transactions_user_date" ON "public"."transactions" USING "btree" ("user_id", "transaction_date" DESC);



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_id_card" ON "public"."users" USING "btree" ("id_card_number");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_status" ON "public"."users" USING "btree" ("status");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE INDEX "idx_verification_codes_expires_at" ON "public"."verification_codes" USING "btree" ("expires_at");



CREATE INDEX "idx_verification_codes_user_id" ON "public"."verification_codes" USING "btree" ("user_id");



CREATE INDEX "idx_withdrawal_limits_user_id" ON "public"."withdrawal_limits" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "schedule_updated_at_trigger" BEFORE UPDATE ON "public"."schedule" FOR EACH ROW EXECUTE FUNCTION "public"."update_schedule_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_bank_accounts_updated_at" BEFORE UPDATE ON "public"."bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_bank_accounts_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_complaints_updated_at" BEFORE UPDATE ON "public"."complaints" FOR EACH ROW EXECUTE FUNCTION "public"."update_complaints_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_transactions_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_transactions_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_users_timestamp"();



ALTER TABLE ONLY "public"."complaint_replies"
    ADD CONSTRAINT "complaint_replies_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "public"."complaints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."complaint_replies"
    ADD CONSTRAINT "complaint_replies_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_replied_by_fkey" FOREIGN KEY ("replied_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_transaction_id_fkey" FOREIGN KEY ("related_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_sub_district_id_fkey" FOREIGN KEY ("sub_district_id") REFERENCES "public"."sub_districts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id");



ALTER TABLE ONLY "public"."schedule"
    ADD CONSTRAINT "schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sub_districts"
    ADD CONSTRAINT "sub_districts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_audit"
    ADD CONSTRAINT "transaction_audit_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_districts_id_fkey" FOREIGN KEY ("districts_id") REFERENCES "public"."districts"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_sub_districts_id_fkey" FOREIGN KEY ("sub_districts_id") REFERENCES "public"."sub_districts"("id");



CREATE POLICY "Users can create transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_category_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_district_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_district_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_district_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sub_district_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_sub_district_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sub_district_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_transaction_stats"("p_user_role" "text", "p_user_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_district_id" bigint, "p_sub_district_id" bigint, "p_date_start" timestamp without time zone, "p_date_end" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_transaction_stats"("p_user_role" "text", "p_user_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_district_id" bigint, "p_sub_district_id" bigint, "p_date_start" timestamp without time zone, "p_date_end" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_transaction_stats"("p_user_role" "text", "p_user_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_district_id" bigint, "p_sub_district_id" bigint, "p_date_start" timestamp without time zone, "p_date_end" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bank_accounts_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bank_accounts_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bank_accounts_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_complaints_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_complaints_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_complaints_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_schedule_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_schedule_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_schedule_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transaction_result"("p_audit_id" "uuid", "p_schedule_id" bigint, "p_transaction_id" "uuid", "p_status" character varying, "p_response_payload" "jsonb", "p_error_details" "jsonb", "p_duration_ms" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_transaction_result"("p_audit_id" "uuid", "p_schedule_id" bigint, "p_transaction_id" "uuid", "p_status" character varying, "p_response_payload" "jsonb", "p_error_details" "jsonb", "p_duration_ms" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transaction_result"("p_audit_id" "uuid", "p_schedule_id" bigint, "p_transaction_id" "uuid", "p_status" character varying, "p_response_payload" "jsonb", "p_error_details" "jsonb", "p_duration_ms" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transactions_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transactions_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transactions_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_users_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_users_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_users_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."complaint_replies" TO "anon";
GRANT ALL ON TABLE "public"."complaint_replies" TO "authenticated";
GRANT ALL ON TABLE "public"."complaint_replies" TO "service_role";



GRANT ALL ON TABLE "public"."complaints" TO "anon";
GRANT ALL ON TABLE "public"."complaints" TO "authenticated";
GRANT ALL ON TABLE "public"."complaints" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_transaction_summary" TO "anon";
GRANT ALL ON TABLE "public"."daily_transaction_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_transaction_summary" TO "service_role";



GRANT ALL ON TABLE "public"."districts" TO "anon";
GRANT ALL ON TABLE "public"."districts" TO "authenticated";
GRANT ALL ON TABLE "public"."districts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."districts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."districts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."districts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_transaction_summary" TO "anon";
GRANT ALL ON TABLE "public"."monthly_transaction_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_transaction_summary" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."schedule" TO "anon";
GRANT ALL ON TABLE "public"."schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schedule_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedule_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedule_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."sub_districts" TO "anon";
GRANT ALL ON TABLE "public"."sub_districts" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_districts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sub_districts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sub_districts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sub_districts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_audit" TO "anon";
GRANT ALL ON TABLE "public"."transaction_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_audit" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_detail" TO "anon";
GRANT ALL ON TABLE "public"."transactions_detail" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_detail" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_detail_with_categories" TO "anon";
GRANT ALL ON TABLE "public"."transactions_detail_with_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_detail_with_categories" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."verification_codes" TO "anon";
GRANT ALL ON TABLE "public"."verification_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_codes" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawal_limits" TO "anon";
GRANT ALL ON TABLE "public"."withdrawal_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawal_limits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";





























RESET ALL;
