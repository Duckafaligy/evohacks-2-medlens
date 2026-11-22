-- MedLens: per-user medicine cabinet + dose log. Row-level security: users only ever see their own rows.

create table public.cabinet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  generic text not null check (char_length(generic) between 1 and 120),
  name text not null check (char_length(name) between 1 and 160),
  strength text check (char_length(strength) <= 60),
  route text check (char_length(route) <= 40),
  slots text[] not null default '{}' check (slots <@ array['morning','noon','evening','bedtime']),
  with_food text not null default 'any' check (with_food in ('with','without','before','any')),
  pills_left integer check (pills_left >= 0 and pills_left <= 10000),
  per_day numeric(5,2) check (per_day >= 0 and per_day <= 48),
  recap jsonb not null default '{}'::jsonb,
  scanned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, generic, strength)
);

create table public.dose_log (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references public.cabinet_items(id) on delete cascade,
  day date not null,
  slot text not null check (slot in ('morning','noon','evening','bedtime')),
  taken_at timestamptz not null default now(),
  primary key (item_id, day, slot)
);

create index on public.cabinet_items (user_id);
create index on public.dose_log (user_id, day);

alter table public.cabinet_items enable row level security;
alter table public.dose_log enable row level security;

create policy "own cabinet" on public.cabinet_items
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own doses" on public.dose_log
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.cabinet_items c where c.id = item_id and c.user_id = (select auth.uid())));

revoke all on public.cabinet_items, public.dose_log from anon;
grant select, insert, update, delete on public.cabinet_items, public.dose_log to authenticated;
