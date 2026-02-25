create table public.transactions (
  id uuid not null default extensions.uuid_generate_v4 (),
  transaction_number character varying(50) not null,
  user_id uuid not null,
  bank_account_id uuid null,
  amount numeric(15, 2) not null,
  currency character varying(3) null default 'THB'::character varying,
  description text null,
  notes text null,
  status public.transaction_status null default 'pending'::transaction_status,
  status_changed_at timestamp with time zone null,
  status_changed_by uuid null,
  recipient_name character varying(255) null,
  recipient_account_number character varying(50) null,
  recipient_bank character varying(100) null,
  transaction_date timestamp with time zone null default CURRENT_TIMESTAMP,
  processed_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  failed_at timestamp with time zone null,
  error_code character varying(50) null,
  error_message text null,
  fee_amount numeric(15, 2) null default 0.00,
  net_amount numeric(15, 2) null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by uuid null,
  ip_address inet null,
  user_agent text null,
  districts_id bigint null,
  sub_districts_id bigint null,
  approved_by uuid null,
  approved_at timestamp with time zone null,
  rejected_by uuid null,
  rejected_at timestamp with time zone null,
  item_name character varying null,
  paid_by uuid null,
  paid_at timestamp with time zone null,
  category_id uuid null,
  payment_method character varying(50) null default 'transfer'::character varying,
  constraint transactions_pkey primary key (id),
  constraint transactions_transaction_number_key unique (transaction_number),
  constraint transactions_districts_id_fkey foreign KEY (districts_id) references districts (id),
  constraint transactions_paid_by_fkey foreign KEY (paid_by) references users (id),
  constraint transactions_category_id_fkey foreign KEY (category_id) references categories (id) on delete set null,
  constraint transactions_rejected_by_fkey foreign KEY (rejected_by) references users (id),
  constraint transactions_sub_districts_id_fkey foreign KEY (sub_districts_id) references sub_districts (id),
  constraint transactions_approved_by_fkey foreign KEY (approved_by) references users (id)
) TABLESPACE pg_default;

create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_bank_account_id on public.transactions using btree (bank_account_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_status on public.transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_transactions_transaction_date on public.transactions using btree (transaction_date desc) TABLESPACE pg_default;

create index IF not exists idx_transactions_transaction_number on public.transactions using btree (transaction_number) TABLESPACE pg_default;

create index IF not exists idx_transactions_created_at on public.transactions using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_transactions_user_date on public.transactions using btree (user_id, transaction_date desc) TABLESPACE pg_default;

create index IF not exists idx_transactions_detail_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_detail_status on public.transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_transactions_detail_date on public.transactions using btree (transaction_date desc) TABLESPACE pg_default;

create index IF not exists idx_transactions_category_id on public.transactions using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_payment_method on public.transactions using btree (payment_method) TABLESPACE pg_default;

create trigger trigger_transactions_updated_at BEFORE
update on transactions for EACH row
execute FUNCTION update_transactions_timestamp ();