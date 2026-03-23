-- ============================================================================
-- migration: add program-scoped posts support
-- purpose:
--   - allow posts to be scoped to a specific program via public.posts.program_id
--   - enforce club/program consistency at the database layer
--   - improve query performance for program feeds
-- affected objects:
--   - public.posts
--   - public.enforce_posts_program_club_match()
--   - public.trg_posts_program_club_match
-- ============================================================================

-- add nullable program reference so club feed posts can optionally belong to a program
alter table public.posts
  add column if not exists program_id bigint references public.programs (id) on delete set null;

-- index used by program feed queries (club + program + created_at sort)
create index if not exists idx_posts_program_id_created_at
on public.posts using btree (program_id, created_at desc);

-- this function keeps post.club_id aligned with program.club_id when program_id is set
create or replace function public.enforce_posts_program_club_match()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  program_club_id bigint;
begin
  if new.program_id is null then
    return new;
  end if;

  select programs.club_id
  into program_club_id
  from public.programs
  where programs.id = new.program_id;

  if program_club_id is null then
    raise exception 'program_id % does not exist', new.program_id;
  end if;

  if new.club_id is distinct from program_club_id then
    raise exception
      'posts.club_id (%) must match programs.club_id (%) for program_id %',
      new.club_id,
      program_club_id,
      new.program_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_posts_program_club_match on public.posts;
create trigger trg_posts_program_club_match
before insert or update on public.posts
for each row
execute function public.enforce_posts_program_club_match();
