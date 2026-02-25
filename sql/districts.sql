create table public.districts (
  id bigserial not null,
  name character varying(255) not null,
  province character varying(255) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint districts_pkey primary key (id),
  constraint districts_name_key unique (name)
) TABLESPACE pg_default;

create index IF not exists idx_districts_province on public.districts using btree (province) TABLESPACE pg_default;