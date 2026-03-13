create table public.schedule (
  id bigserial not null,
  user_id uuid not null,
  scheduled_date date not null,
  time_start time without time zone null,
  time_end time without time zone null,
  address text null,
  district_id bigint null,
  sub_district_id bigint null,
  note text null,
  status character varying(50) not null default 'active'::character varying,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  title character varying null,
  key_word character varying null,
  transaction_id uuid null,
  constraint schedule_pkey primary key (id),
  constraint schedule_transaction_id_fkey foreign KEY (transaction_id) references transactions (id),
  constraint schedule_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint schedule_district_id_fkey foreign KEY (district_id) references districts (id) on delete set null,
  constraint schedule_sub_district_id_fkey foreign KEY (sub_district_id) references sub_districts (id) on delete set null,
  constraint schedule_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'completed'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint check_time_range check (
    (
      (time_start is null)
      or (time_end is null)
      or (time_start < time_end)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_schedule_user_id on public.schedule using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_schedule_scheduled_date on public.schedule using btree (scheduled_date) TABLESPACE pg_default;

create index IF not exists idx_schedule_district_id on public.schedule using btree (district_id) TABLESPACE pg_default;

create index IF not exists idx_schedule_sub_district_id on public.schedule using btree (sub_district_id) TABLESPACE pg_default;

create index IF not exists idx_schedule_status on public.schedule using btree (status) TABLESPACE pg_default;

create index IF not exists idx_schedule_user_date on public.schedule using btree (user_id, scheduled_date) TABLESPACE pg_default;

create trigger schedule_updated_at_trigger BEFORE
update on schedule for EACH row
execute FUNCTION update_schedule_updated_at ();