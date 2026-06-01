create table public.cars (
  id uuid not null default gen_random_uuid (),
  name text not null,
  type text not null,
  price_per_day integer not null,
  image_url text null,
  fuel text not null,
  transmission text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  latitude double precision null,
  longitude double precision null,
  available_from date null,
  available_to date null,
  constraint cars_pkey primary key (id)
) TABLESPACE pg_default;