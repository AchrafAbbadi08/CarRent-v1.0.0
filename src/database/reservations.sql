create table public.reservations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  car_id uuid not null,
  pickup_city text not null,
  rental_days integer not null default 1,
  total_price integer not null,
  status text not null default 'confirmed'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  start_date date null default CURRENT_DATE,
  end_date date null default (CURRENT_DATE + '1 day'::interval),
  user_push_token text null,
  constraint reservations_pkey primary key (id),
  constraint reservations_car_id_fkey foreign KEY (car_id) references cars (id) on delete RESTRICT,
  constraint reservations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;