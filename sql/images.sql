create table public.images (
  id uuid not null default extensions.uuid_generate_v4 (),
  transaction_id uuid not null,
  url character varying not null,
  cloud_url character varying null,
  filename character varying not null,
  file_size bigint null,
  mime_type character varying(50) null default 'image/jpeg'::character varying,
  width integer null,
  height integer null,
  storage_path character varying null,
  thumbnail_url character varying null,
  uploaded_by uuid not null,
  upload_status character varying(20) null default 'completed'::character varying,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  metadata jsonb null,
  constraint images_pkey primary key (id),
  constraint images_transaction_id_fkey foreign KEY (transaction_id) references transactions (id) on delete CASCADE,
  constraint images_uploaded_by_fkey foreign KEY (uploaded_by) references users (id),
  constraint images_mime_type_check check (((mime_type)::text ~~ 'image/%'::text)),
  constraint images_upload_status_check check (
    (
      (upload_status)::text = any (
        array[
          'pending'::text,
          'uploading'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_images_transaction_id on public.images using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_images_uploaded_by on public.images using btree (uploaded_by) TABLESPACE pg_default;

create index IF not exists idx_images_created_at on public.images using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_images_upload_status on public.images using btree (upload_status) TABLESPACE pg_default;

create index IF not exists idx_images_transaction_created on public.images using btree (transaction_id, created_at desc) TABLESPACE pg_default;

create trigger trigger_images_updated_at BEFORE
update on images for EACH row
execute FUNCTION update_transactions_timestamp ();