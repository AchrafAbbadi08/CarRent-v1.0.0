create table public.reviews (
  id uuid not null default gen_random_uuid (),
  car_id uuid null,
  user_id uuid null,
  rating integer null,
  comment text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint reviews_pkey primary key (id),
  constraint reviews_car_id_fkey foreign KEY (car_id) references cars (id) on delete CASCADE,
  constraint reviews_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint reviews_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;