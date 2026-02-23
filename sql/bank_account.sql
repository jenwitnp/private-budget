create table public.bank_accounts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  account_number character varying(50) not null,
  account_name character varying(255) null,
  account_type character varying null,
  bank character varying not null,
  bank_name character varying(100) null,
  branch_name character varying(100) null,
  account_holder_name character varying(255) null,
  account_holder_id character varying(20) null,
  is_primary boolean null default false,
  is_active boolean null default true,
  verified boolean null default false,
  verified_at timestamp with time zone null,
  account_balance numeric(15, 2) null default 0.00,
  last_sync_at timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by uuid null,
  deleted_at timestamp with time zone null,
  constraint bank_accounts_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_bank_accounts_user_id on public.bank_accounts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_bank_accounts_is_primary on public.bank_accounts using btree (user_id, is_primary) TABLESPACE pg_default;

create index IF not exists idx_bank_accounts_account_number on public.bank_accounts using btree (account_number) TABLESPACE pg_default;

create index IF not exists idx_bank_accounts_created_at on public.bank_accounts using btree (created_at desc) TABLESPACE pg_default;

create unique INDEX IF not exists idx_bank_accounts_primary on public.bank_accounts using btree (user_id) TABLESPACE pg_default
where
  (is_primary = true);

create trigger trigger_bank_accounts_updated_at BEFORE
update on bank_accounts for EACH row
execute FUNCTION update_bank_accounts_timestamp ();