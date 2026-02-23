-- Drop existing table and indexes if they exist
DROP TABLE IF EXISTS public.users CASCADE;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_id_card;

create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  username character varying(100) not null unique,
  email character varying(255) null,
  password_hash character varying(255) null,
  first_name character varying(100) null,
  last_name character varying(100) null,
  phone_number character varying(20) null,
  avatar_url text null,
  date_of_birth date null,
  id_card_number character varying(20) null,
  role public.user_role null default 'user'::user_role,
  status public.user_status null default 'active'::user_status,
  balance numeric(15, 2) null default 0.00,
  two_factor_enabled boolean null default false,
  two_factor_secret character varying(255) null,
  last_login_at timestamp with time zone null,
  last_login_ip inet null,
  failed_login_attempts integer null default 0,
  locked_until timestamp with time zone null,
  notification_email boolean null default true,
  notification_sms boolean null default false,
  language character varying(10) null default 'th'::character varying,
  currency character varying(3) null default 'THB'::character varying,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by uuid null,
  updated_by uuid null,
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_users_username on public.users using btree (username) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_status on public.users using btree (status) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

create index IF not exists idx_users_created_at on public.users using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_users_id_card on public.users using btree (id_card_number) TABLESPACE pg_default;

create trigger trigger_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_users_timestamp ();