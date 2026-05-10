-- 달새김 초기 스키마

-- profiles (Supabase Auth의 users와 연동)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  provider text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "본인 프로필 조회" on public.profiles for select using (auth.uid() = id);
create policy "본인 프로필 수정" on public.profiles for update using (auth.uid() = id);
create policy "프로필 생성" on public.profiles for insert with check (auth.uid() = id);

-- anniversaries
create table if not exists public.anniversaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  date_type text not null check (date_type in ('lunar', 'solar')),
  month integer not null check (month between 1 and 12),
  day integer not null check (day between 1 and 31),
  category text not null default 'other' check (category in ('birthday', 'memorial', 'anniversary', 'holiday', 'other')),
  repeat_type text not null default 'yearly' check (repeat_type in ('yearly', 'monthly', 'once')),
  start_year integer,
  is_shared boolean default false,
  is_leap_month boolean default false,
  created_at timestamptz default now()
);

alter table public.anniversaries enable row level security;
create policy "본인 기념일 조회" on public.anniversaries for select using (auth.uid() = user_id);
create policy "본인 기념일 생성" on public.anniversaries for insert with check (auth.uid() = user_id);
create policy "본인 기념일 수정" on public.anniversaries for update using (auth.uid() = user_id);
create policy "본인 기념일 삭제" on public.anniversaries for delete using (auth.uid() = user_id);

-- family_groups
create table if not exists public.family_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

alter table public.family_groups enable row level security;

-- family_members
create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.family_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

alter table public.family_members enable row level security;

-- 가족 그룹 RLS: 그룹 멤버만 조회 가능
create policy "그룹 멤버 조회" on public.family_groups for select using (
  id in (select group_id from public.family_members where user_id = auth.uid())
  or owner_id = auth.uid()
);
create policy "그룹 생성" on public.family_groups for insert with check (auth.uid() = owner_id);
create policy "그룹 수정 (소유자)" on public.family_groups for update using (auth.uid() = owner_id);
create policy "그룹 삭제 (소유자)" on public.family_groups for delete using (auth.uid() = owner_id);

create policy "멤버 조회" on public.family_members for select using (
  group_id in (select group_id from public.family_members where user_id = auth.uid())
);
create policy "멤버 추가" on public.family_members for insert with check (auth.uid() = user_id);
create policy "멤버 탈퇴" on public.family_members for delete using (auth.uid() = user_id);

-- memos
create table if not exists public.memos (
  id uuid default gen_random_uuid() primary key,
  anniversary_id uuid references public.anniversaries(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year integer not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.memos enable row level security;
create policy "본인 메모 조회" on public.memos for select using (auth.uid() = user_id);
create policy "본인 메모 생성" on public.memos for insert with check (auth.uid() = user_id);
create policy "본인 메모 수정" on public.memos for update using (auth.uid() = user_id);
create policy "본인 메모 삭제" on public.memos for delete using (auth.uid() = user_id);

-- notification_settings
create table if not exists public.notification_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  channel_type text not null check (channel_type in ('kakao', 'telegram', 'google_calendar')),
  is_enabled boolean default false,
  config jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, channel_type)
);

alter table public.notification_settings enable row level security;
create policy "본인 알림설정 조회" on public.notification_settings for select using (auth.uid() = user_id);
create policy "본인 알림설정 생성" on public.notification_settings for insert with check (auth.uid() = user_id);
create policy "본인 알림설정 수정" on public.notification_settings for update using (auth.uid() = user_id);

-- 신규 가입 시 프로필 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'provider'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
