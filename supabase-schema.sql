-- Run this in your Supabase SQL Editor

-- Posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null default '',
  content_text text not null default '',
  visibility text not null default 'private' check (visibility in ('public', 'quiet', 'private')),
  slug text unique not null,
  image_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photos table (standalone + from posts)
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  post_id uuid references posts(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table posts enable row level security;
alter table photos enable row level security;

-- Public read access for public/quiet posts
create policy "Public can read public posts" on posts
  for select using (visibility in ('public', 'quiet'));

-- Service role (server-side) has full access via anon key in API routes
-- (We handle auth in Next.js, not Supabase RLS, since it's single-user)
create policy "Anon full access posts" on posts
  for all using (true) with check (true);

create policy "Anon full access photos" on photos
  for all using (true) with check (true);

-- Storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict do nothing;

create policy "Public read images" on storage.objects
  for select using (bucket_id = 'images');

create policy "Auth upload images" on storage.objects
  for insert with check (bucket_id = 'images');

create policy "Auth delete images" on storage.objects
  for delete using (bucket_id = 'images');
