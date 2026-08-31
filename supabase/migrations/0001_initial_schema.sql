-- Lumio — Step 1 initial schema
-- Two tables: student_profiles and teacher_profiles.
-- Designed so future tables (subjects, lessons, questions, tests, mastery,
-- teacher memory, voice settings, subscriptions, parent accounts) can be
-- added later without reworking these.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh on every update.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- student_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.student_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  first_name  text not null,
  age         smallint check (age is null or (age >= 3 and age <= 19)),
  school_year text,
  country     text,
  curriculum  text,
  subjects    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists student_profiles_user_id_idx
  on public.student_profiles (user_id);

drop trigger if exists trg_student_profiles_updated_at on public.student_profiles;
create trigger trg_student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- teacher_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_profiles (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null unique references public.student_profiles (id) on delete cascade,
  teacher_name     text not null,
  voice_preference text not null default 'neutral'
                     check (voice_preference in ('female', 'male', 'neutral')),
  personality      text not null default 'encouraging',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists teacher_profiles_student_id_idx
  on public.teacher_profiles (student_id);

drop trigger if exists trg_teacher_profiles_updated_at on public.teacher_profiles;
create trigger trg_teacher_profiles_updated_at
  before update on public.teacher_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Students may only read/write their own rows. Nothing is world-readable.
-- ---------------------------------------------------------------------------
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;

-- student_profiles: owner is auth.uid() == user_id
drop policy if exists "student_select_own" on public.student_profiles;
create policy "student_select_own"
  on public.student_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "student_insert_own" on public.student_profiles;
create policy "student_insert_own"
  on public.student_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "student_update_own" on public.student_profiles;
create policy "student_update_own"
  on public.student_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "student_delete_own" on public.student_profiles;
create policy "student_delete_own"
  on public.student_profiles for delete
  using (auth.uid() = user_id);

-- teacher_profiles: owner is whoever owns the linked student_profile
drop policy if exists "teacher_select_own" on public.teacher_profiles;
create policy "teacher_select_own"
  on public.teacher_profiles for select
  using (
    exists (
      select 1 from public.student_profiles s
      where s.id = teacher_profiles.student_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "teacher_insert_own" on public.teacher_profiles;
create policy "teacher_insert_own"
  on public.teacher_profiles for insert
  with check (
    exists (
      select 1 from public.student_profiles s
      where s.id = teacher_profiles.student_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "teacher_update_own" on public.teacher_profiles;
create policy "teacher_update_own"
  on public.teacher_profiles for update
  using (
    exists (
      select 1 from public.student_profiles s
      where s.id = teacher_profiles.student_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.student_profiles s
      where s.id = teacher_profiles.student_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "teacher_delete_own" on public.teacher_profiles;
create policy "teacher_delete_own"
  on public.teacher_profiles for delete
  using (
    exists (
      select 1 from public.student_profiles s
      where s.id = teacher_profiles.student_id
        and s.user_id = auth.uid()
    )
  );
