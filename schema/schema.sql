-- ============================================================
-- Smart Lost & Found Assistant — FINAL Supabase Schema
-- Run this ONCE in Supabase SQL Editor before deploying
-- Best-of-both: schema.sql (RLS + trigger + extra indexes)
--               + schema2.sql (original spec reference)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists vector;      -- pgvector (optional semantic search stretch goal)
create extension if not exists pg_trgm;     -- trigram fuzzy matching (core matching engine)

-- ─── Profiles ────────────────────────────────────────────────
-- Extends Supabase auth.users; one row per registered user
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  fcm_token  text,          -- FCM web push token, updated whenever permission is (re)granted
  created_at timestamptz default now()
);

-- Auto-create a profile row the moment a user signs up (email or Google OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: each user can only see and edit their own profile
alter table profiles enable row level security;
create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- ─── Items ───────────────────────────────────────────────────
-- Both "lost" and "found" reports in one table, discriminated by `type`
create table if not exists items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  type       text not null check (type in ('lost', 'found')),
  status     text not null default 'open'
             check (status in ('open', 'matched', 'claimed', 'closed')),

  -- Shared fields (both lost & found)
  category   text,          -- e.g. wallet, phone, bottle, id_card, bag
  color      text,
  brand      text,
  material   text,
  description text,         -- free text, mainly used for lost reports
  location   text,
  occurred_at timestamptz,

  -- Found-item only
  image_url        text,    -- Cloudinary URL
  ai_labels        jsonb,   -- structured Groq vision output (category, color, brand, …)
  ai_description   text,    -- Groq short description sentence
  ai_confidence    text,    -- 'high' | 'medium' | 'low'

  -- Lost-item only (AI extraction output)
  extracted_keywords  text[],
  extracted_category  text,
  extracted_color     text,
  extracted_brand     text,

  -- Optional semantic layer (stretch goal)
  embedding  vector(384),   -- MiniLM embedding for cosine similarity search

  created_at timestamptz default now()
);

-- Indexes — performance for the most common query patterns
create index if not exists idx_items_type_status
  on items (type, status);                              -- "all open found items" filter

create index if not exists idx_items_category_trgm
  on items using gin (category gin_trgm_ops);           -- fuzzy category match

create index if not exists idx_items_color_trgm
  on items using gin (color gin_trgm_ops);              -- fuzzy color match

create index if not exists idx_items_description_trgm
  on items using gin (description gin_trgm_ops);        -- fuzzy description search

create index if not exists idx_items_user
  on items (user_id);                                   -- "my items" query

create index if not exists idx_items_created
  on items (created_at desc);                           -- dashboard / latest-first ordering

-- RLS: open items are publicly readable; only the owner can write
alter table items enable row level security;
create policy "Anyone can view open items"
  on items for select
  using (status = 'open' or auth.uid() = user_id);     -- own closed items still visible to owner

create policy "Authenticated users can insert items"
  on items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on items for update
  using (auth.uid() = user_id);

-- ─── Matches ─────────────────────────────────────────────────
-- Candidate pairings between one lost item and one found item
create table if not exists matches (
  id               uuid primary key default gen_random_uuid(),
  lost_item_id     uuid references items(id) on delete cascade,
  found_item_id    uuid references items(id) on delete cascade,
  confidence_score numeric not null,   -- 0–100 from lib/matching.ts
  status           text not null default 'suggested'
                   check (status in ('suggested', 'confirmed', 'rejected')),
  notified         boolean default false,  -- true after FCM push has fired
  created_at       timestamptz default now(),
  unique (lost_item_id, found_item_id)     -- prevent duplicate match rows
);

create index if not exists idx_matches_lost
  on matches (lost_item_id);

create index if not exists idx_matches_found
  on matches (found_item_id);

create index if not exists idx_matches_score
  on matches (confidence_score desc);     -- top-N match queries

-- RLS: only users involved in a match can see it
alter table matches enable row level security;
create policy "Users can view matches for their items"
  on matches for select using (
    exists (
      select 1 from items
      where items.id in (matches.lost_item_id, matches.found_item_id)
        and items.user_id = auth.uid()
    )
  );
-- Server-side match engine uses the service role — full access
create policy "Service role can manage all matches"
  on matches for all
  using (auth.role() = 'service_role');

-- ─── Realtime ────────────────────────────────────────────────
-- Frontend subscribes to these so new matches appear without polling
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table items;
