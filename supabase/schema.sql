-- ============================================================
-- Przedszkole Pickup – pełny schemat bazy (Supabase / Postgres)
-- Uruchom w: Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles – konta (rodzice i rodzina)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'family' check (role in ('parent', 'family')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- availability – tygodniowe okna czasowe członków rodziny
-- week_start: poniedziałek tygodnia, day_of_week: 0 = pon … 6 = niedz
-- ------------------------------------------------------------
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  can_dropoff boolean not null default false,
  can_pickup boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- ------------------------------------------------------------
-- child_schedule – plan dziecka na konkretną datę (wpisują rodzice)
-- ------------------------------------------------------------
create table public.child_schedule (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- ------------------------------------------------------------
-- assignments – wyznaczenie osoby do dropoff/pickup (zatwierdza rodzic)
-- ------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  child_schedule_id uuid not null references public.child_schedule (id) on delete cascade,
  assigned_user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('dropoff', 'pickup')),
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (child_schedule_id, type)
);

-- ------------------------------------------------------------
-- push_subscriptions – subskrypcje Web Push
-- ------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indeksy
-- ------------------------------------------------------------
create index availability_user_week_idx on public.availability (user_id, week_start);
create index availability_day_idx on public.availability (day_of_week, start_time, end_time);
create index child_schedule_date_idx on public.child_schedule (date);
create index assignments_schedule_idx on public.assignments (child_schedule_id);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ------------------------------------------------------------
-- Automatyczne tworzenie profilu po rejestracji (magic link)
-- role domyślnie 'family'; rodzica ustawia się przez
-- raw_user_meta_data->>'role' albo ręcznie w tabeli profiles.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'family')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.availability enable row level security;
alter table public.child_schedule enable row level security;
alter table public.assignments enable row level security;
alter table public.push_subscriptions enable row level security;

-- ------------------------------------------------------------
-- profiles: wszyscy zalogowani czytają, każdy edytuje swój
-- ------------------------------------------------------------
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------
-- availability: wszyscy zalogowani czytają, każdy zarządza swoim
-- ------------------------------------------------------------
create policy "availability_select_authenticated"
  on public.availability for select
  to authenticated
  using (true);

create policy "availability_insert_own"
  on public.availability for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "availability_update_own"
  on public.availability for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "availability_delete_own"
  on public.availability for delete
  to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- child_schedule: wszyscy zalogowani czytają, tylko parent pisze
-- ------------------------------------------------------------
create policy "child_schedule_select_authenticated"
  on public.child_schedule for select
  to authenticated
  using (true);

create policy "child_schedule_insert_parent"
  on public.child_schedule for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  );

create policy "child_schedule_update_parent"
  on public.child_schedule for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  );

create policy "child_schedule_delete_parent"
  on public.child_schedule for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  );

-- ------------------------------------------------------------
-- assignments: wszyscy zalogowani czytają, tylko parent pisze
-- ------------------------------------------------------------
create policy "assignments_select_authenticated"
  on public.assignments for select
  to authenticated
  using (true);

create policy "assignments_insert_parent"
  on public.assignments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  );

create policy "assignments_update_parent"
  on public.assignments for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  );

create policy "assignments_delete_parent"
  on public.assignments for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'parent'
    )
  );

-- ------------------------------------------------------------
-- push_subscriptions: każdy zarządza tylko swoimi subskrypcjami
-- ------------------------------------------------------------
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());
