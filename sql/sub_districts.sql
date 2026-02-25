create table public.sub_districts (
  id bigserial not null,
  district_id bigint not null,
  name character varying(255) not null,
  villages_count integer not null default 0,
  examples text[] null default '{}'::text[],
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint sub_districts_pkey primary key (id),
  constraint sub_districts_district_id_name_key unique (district_id, name),
  constraint sub_districts_district_id_fkey foreign KEY (district_id) references districts (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_sub_districts_district_id on public.sub_districts using btree (district_id) TABLESPACE pg_default;

create index IF not exists idx_sub_districts_name on public.sub_districts using btree (name) TABLESPACE pg_default;