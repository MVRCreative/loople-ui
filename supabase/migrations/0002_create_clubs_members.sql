-- Clubs and Members for multi-tenant support
-- Based on a subdomain-per-tenant model similar to Vercel Platforms Starter Kit

-- Ensure uuid generation is available
create extension if not exists pgcrypto;

-- Clubs
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Maintain updated_at
drop trigger if exists trg_clubs_set_updated_at on public.clubs;
create trigger trg_clubs_set_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

-- Members: link users to clubs with a role
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (club_id, user_id)
);

-- Maintain updated_at
drop trigger if exists trg_members_set_updated_at on public.members;
create trigger trg_members_set_updated_at
before update on public.members
for each row execute function public.set_updated_at();

-- Add FKs and indexes
-- Reference profiles(id) so we can join members -> profiles in Supabase
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_user_id_fkey'
  ) then
    alter table public.members
    add constraint members_user_id_fkey foreign key (user_id)
    references public.profiles(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_members_club_id on public.members (club_id);
create index if not exists idx_members_user_id on public.members (user_id);

-- Row Level Security
alter table public.clubs enable row level security;
alter table public.members enable row level security;

-- Policies
-- Authenticated users can read clubs they belong to
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'clubs' and policyname = 'Clubs readable to members'
  ) then
    create policy "Clubs readable to members"
      on public.clubs for select
      to authenticated
      using (exists (
        select 1 from public.members m
        where m.club_id = clubs.id and m.user_id = auth.uid()
      ));
  end if;
end $$;

-- Authenticated users can read members of clubs they belong to
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'members' and policyname = 'Members readable within same club'
  ) then
    create policy "Members readable within same club"
      on public.members for select
      to authenticated
      using (exists (
        select 1 from public.members m2
        where m2.club_id = members.club_id and m2.user_id = auth.uid()
      ));
  end if;
end $$;


