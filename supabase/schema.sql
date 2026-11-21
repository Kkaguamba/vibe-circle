-- VibeCircle initial schema.
-- Run in a fresh Supabase project. Review policies before production launch.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  invite_code text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('link', 'video', 'image', 'text')),
  caption text not null default '',
  source_url text,
  media_path text,
  category text not null default 'Life'
    check (category in ('Comedy', 'Wisdom', 'Motivation', 'Entertainment', 'Relationships', 'Life')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (content_type = 'link' and source_url is not null)
    or (content_type in ('video', 'image') and media_path is not null)
    or content_type = 'text'
  )
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'laugh', 'love', 'insightful')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('reaction', 'comment', 'invitation', 'community_post')),
  post_id uuid references public.posts(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists posts_community_created_idx on public.posts(community_id, created_at desc);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

-- Helper functions avoid recursive membership-policy evaluation.
create or replace function public.is_community_member(target_community uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = target_community and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_community_manager(target_community uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = target_community
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'moderator')
  );
$$;

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.invitations enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles visible to authenticated users"
on public.profiles for select to authenticated using (true);
create policy "Users insert own profile"
on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Users update own profile"
on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can view communities"
on public.communities for select to authenticated
using (not is_private or public.is_community_member(id) or owner_id = auth.uid());
create policy "Authenticated users create communities"
on public.communities for insert to authenticated with check (owner_id = auth.uid());
create policy "Managers update communities"
on public.communities for update to authenticated
using (public.is_community_manager(id)) with check (public.is_community_manager(id));
create policy "Owners delete communities"
on public.communities for delete to authenticated using (owner_id = auth.uid());

create policy "Members view membership list"
on public.community_members for select to authenticated
using (public.is_community_member(community_id) or user_id = auth.uid());
create policy "Managers add community members"
on public.community_members for insert to authenticated
with check (public.is_community_manager(community_id));
create policy "Managers or users remove membership"
on public.community_members for delete to authenticated
using (user_id = auth.uid() or public.is_community_manager(community_id));
create policy "Managers update member roles"
on public.community_members for update to authenticated
using (public.is_community_manager(community_id))
with check (public.is_community_manager(community_id));

create policy "Members view invitations"
on public.invitations for select to authenticated
using (public.is_community_member(community_id) or created_by = auth.uid());
create policy "Managers create invitations"
on public.invitations for insert to authenticated
with check (created_by = auth.uid() and public.is_community_manager(community_id));
create policy "Managers delete invitations"
on public.invitations for delete to authenticated
using (public.is_community_manager(community_id));

create policy "Community members view posts"
on public.posts for select to authenticated using (public.is_community_member(community_id));
create policy "Members create own posts"
on public.posts for insert to authenticated
with check (user_id = auth.uid() and public.is_community_member(community_id));
create policy "Authors or managers update posts"
on public.posts for update to authenticated
using (user_id = auth.uid() or public.is_community_manager(community_id))
with check (user_id = auth.uid() or public.is_community_manager(community_id));
create policy "Authors or managers delete posts"
on public.posts for delete to authenticated
using (user_id = auth.uid() or public.is_community_manager(community_id));

create policy "Members view comments on accessible posts"
on public.comments for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and public.is_community_member(p.community_id)));
create policy "Members create comments"
on public.comments for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.posts p where p.id = post_id and public.is_community_member(p.community_id)
));
create policy "Authors delete own comments"
on public.comments for delete to authenticated using (user_id = auth.uid());

create policy "Members view reactions on accessible posts"
on public.reactions for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and public.is_community_member(p.community_id)));
create policy "Members react"
on public.reactions for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.posts p where p.id = post_id and public.is_community_member(p.community_id)
));
create policy "Users change own reaction"
on public.reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users remove own reaction"
on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy "Users view own bookmarks"
on public.bookmarks for select to authenticated using (user_id = auth.uid());
create policy "Users create own bookmarks"
on public.bookmarks for insert to authenticated with check (user_id = auth.uid());
create policy "Users delete own bookmarks"
on public.bookmarks for delete to authenticated using (user_id = auth.uid());

create policy "Users view own notifications"
on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users update own notifications"
on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Create a profile row automatically after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- New community owners are added as owner members.
create or replace function public.add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members (community_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_community_created on public.communities;
create trigger on_community_created
after insert on public.communities
for each row execute procedure public.add_community_owner();


-- Invitation acceptance is performed through this RPC so clients cannot
-- directly add themselves to arbitrary private communities.
create or replace function public.accept_community_invitation(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_row public.invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invitation';
  end if;

  select * into invitation_row
  from public.invitations
  where invite_code = code
    and (expires_at is null or expires_at > now())
    and (max_uses is null or use_count < max_uses)
  for update;

  if not found then
    raise exception 'This invitation is invalid, expired, or has reached its usage limit';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (invitation_row.community_id, auth.uid(), 'member')
  on conflict (community_id, user_id) do nothing;

  update public.invitations
  set use_count = use_count + 1
  where id = invitation_row.id;

  return invitation_row.community_id;
end;
$$;

revoke all on function public.accept_community_invitation(text) from public;
grant execute on function public.accept_community_invitation(text) to authenticated;
