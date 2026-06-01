create table public.users_table (
  id serial not null,
  auth_uid uuid not null,
  full_name text not null,
  email text not null,
  role text null default 'client'::text,
  created_at timestamp with time zone not null default now(),
  phone text null,
  avatar_url text null,
  constraint users_table_pkey primary key (id),
  constraint users_table_auth_uid_key unique (auth_uid),
  constraint users_table_email_key unique (email),
  constraint users_table_role_check check (
    (role = any (array['client'::text, 'admin'::text]))
  )
) TABLESPACE pg_default;