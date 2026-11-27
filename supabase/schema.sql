create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  full_name text,
  author_bio text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);
create table public.genres (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique);
create table public.novels (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id), slug text not null unique,
  title text not null, synopsis text not null, cover_url text, status text not null default 'draft' check(status in ('draft','published','archived','suspended')),
  publication_status text not null default 'ongoing' check(publication_status in ('ongoing','completed','hiatus')),
  age_rating text not null default 'all' check(age_rating in ('all','teen','mature')), views_count bigint not null default 0,
  favorites_count bigint not null default 0, rating_average numeric(3,2) not null default 0, rating_count integer not null default 0,
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.novel_genres (novel_id uuid references public.novels(id) on delete cascade, genre_id uuid references public.genres(id), primary key(novel_id,genre_id));
create table public.chapters (
  id uuid primary key default gen_random_uuid(), novel_id uuid not null references public.novels(id) on delete cascade,
  author_id uuid not null references public.profiles(id), chapter_number integer not null, title text not null, content text not null default '',
  status text not null default 'draft' check(status in ('draft','published')), word_count integer not null default 0,
  published_at timestamptz, deleted_at timestamptz, created_at timestamptz not null default now(), unique(novel_id,chapter_number)
);
create table public.ratings (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), novel_id uuid not null references public.novels(id) on delete cascade, rating integer not null check(rating between 1 and 5), review_content text, created_at timestamptz not null default now(), unique(user_id,novel_id));
create table public.libraries (user_id uuid not null references public.profiles(id), novel_id uuid not null references public.novels(id) on delete cascade, category text not null check(category in ('want_to_read','reading','completed','dropped')), created_at timestamptz not null default now(), primary key(user_id,novel_id));
create table public.follows (follower_id uuid not null references public.profiles(id) on delete cascade, following_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key(follower_id,following_id), check(follower_id <> following_id));
create table public.reading_progress (user_id uuid not null references public.profiles(id) on delete cascade, novel_id uuid not null references public.novels(id) on delete cascade, chapter_id uuid not null references public.chapters(id) on delete cascade, scroll_position numeric not null default 0, last_read_at timestamptz not null default now(), primary key(user_id,novel_id));
create table public.comments (id uuid primary key default gen_random_uuid(), novel_id uuid not null references public.novels(id) on delete cascade, chapter_id uuid references public.chapters(id) on delete cascade, user_id uuid not null references public.profiles(id), parent_id uuid references public.comments(id), content text not null check(length(content) between 1 and 3000), deleted_at timestamptz, created_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id), target_type text not null check(target_type in ('novel','chapter','comment','user')), target_id uuid not null, reason text not null, status text not null default 'open', created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, actor_id uuid references public.profiles(id), novel_id uuid references public.novels(id) on delete cascade, chapter_id uuid references public.chapters(id) on delete cascade, kind text not null, read_at timestamptz, created_at timestamptz not null default now());

insert into public.genres(name,slug) values ('Fantasi','fantasi'),('Romantis','romantis'),('Aksi','aksi'),('Petualangan','petualangan'),('Misteri','misteri'),('Horor','horor'),('Fiksi Ilmiah','fiksi-ilmiah'),('Drama','drama'),('Komedi','komedi'),('Sejarah','sejarah') on conflict do nothing;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare base_name text; chosen_name text;
begin
  base_name := coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1));
  base_name := regexp_replace(base_name, '[^A-Za-z0-9_]', '', 'g');
  if length(base_name) < 3 then base_name := 'user_' || substr(new.id::text,1,8); end if;
  chosen_name := left(base_name,30);
  if exists(select 1 from public.profiles where lower(username)=lower(chosen_name)) then
    chosen_name := left(base_name,24) || '_' || substr(new.id::text,1,5);
  end if;
  insert into public.profiles(id,username,full_name,avatar_url)
  values(
    new.id,
    chosen_name,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name','')),
    coalesce(nullif(new.raw_user_meta_data->>'avatar_url',''), nullif(new.raw_user_meta_data->>'picture',''))
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.update_rating_stats() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid := coalesce(new.novel_id,old.novel_id);
begin update public.novels set rating_count=(select count(*) from public.ratings where novel_id=target), rating_average=coalesce((select round(avg(rating)::numeric,2) from public.ratings where novel_id=target),0) where id=target; return coalesce(new,old); end $$;
create trigger ratings_stats after insert or update or delete on public.ratings for each row execute procedure public.update_rating_stats();
revoke all on function public.update_rating_stats() from public, anon, authenticated;
create or replace function public.update_favorite_stats() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid := coalesce(new.novel_id,old.novel_id);
begin update public.novels set favorites_count=(select count(*) from public.libraries where novel_id=target) where id=target; return coalesce(new,old); end $$;
create trigger library_stats after insert or delete on public.libraries for each row execute procedure public.update_favorite_stats();
revoke all on function public.update_favorite_stats() from public, anon, authenticated;

create or replace function public.notify_followers_new_chapter() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
    insert into public.notifications(user_id,actor_id,novel_id,chapter_id,kind)
    select f.follower_id,new.author_id,new.novel_id,new.id,'new_chapter' from public.follows f
    where f.following_id=new.author_id and f.follower_id<>new.author_id;
  end if;
  return new;
end $$;
create trigger chapter_notifications after insert or update of status on public.chapters for each row execute procedure public.notify_followers_new_chapter();
revoke all on function public.notify_followers_new_chapter() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.genres enable row level security;
alter table public.novels enable row level security;
alter table public.novel_genres enable row level security;
alter table public.chapters enable row level security;
alter table public.ratings enable row level security;
alter table public.libraries enable row level security;
alter table public.follows enable row level security;
alter table public.reading_progress enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);
create policy "Genres are public" on public.genres for select using (true);
create policy "Published novels or own novels are visible" on public.novels for select using ((status='published' and deleted_at is null) or author_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Authors create novels" on public.novels for insert with check (author_id=auth.uid());
create policy "Authors update novels" on public.novels for update using (author_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check (author_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Novel genres visible with novel" on public.novel_genres for select using (exists(select 1 from public.novels n where n.id=novel_id and ((n.status='published' and n.deleted_at is null) or n.author_id=auth.uid())));
create policy "Authors manage novel genres" on public.novel_genres for all using (exists(select 1 from public.novels n where n.id=novel_id and n.author_id=auth.uid())) with check (exists(select 1 from public.novels n where n.id=novel_id and n.author_id=auth.uid()));
create policy "Published chapters or own chapters are visible" on public.chapters for select using ((status='published' and deleted_at is null and exists(select 1 from public.novels n where n.id=novel_id and n.status='published' and n.deleted_at is null)) or author_id=auth.uid());
create policy "Authors create chapters" on public.chapters for insert with check (author_id=auth.uid() and exists(select 1 from public.novels n where n.id=novel_id and n.author_id=auth.uid()));
create policy "Authors update chapters" on public.chapters for update using (author_id=auth.uid()) with check (author_id=auth.uid() and exists(select 1 from public.novels n where n.id=novel_id and n.author_id=auth.uid()));
create policy "Ratings are public" on public.ratings for select using (true);
create policy "Users write own ratings" on public.ratings for insert with check (user_id=auth.uid() and not exists(select 1 from public.novels where id=novel_id and author_id=auth.uid()));
create policy "Users update own ratings" on public.ratings for update using (user_id=auth.uid()) with check (user_id=auth.uid() and not exists(select 1 from public.novels where id=novel_id and author_id=auth.uid()));
create policy "Users delete own ratings" on public.ratings for delete using (user_id=auth.uid());
create policy "Users manage own library" on public.libraries for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Follows visible to participants" on public.follows for select using (follower_id=auth.uid() or following_id=auth.uid());
create policy "Users manage own follows" on public.follows for all using (follower_id=auth.uid()) with check (follower_id=auth.uid());
create policy "Users read own progress" on public.reading_progress for select using (user_id=auth.uid());
create policy "Users insert own progress" on public.reading_progress for insert with check (user_id=auth.uid());
create policy "Users update own progress" on public.reading_progress for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Published comments are public" on public.comments for select using (deleted_at is null and exists(select 1 from public.novels n where n.id=novel_id and n.status='published' and n.deleted_at is null));
create policy "Authenticated users comment" on public.comments for insert with check (user_id=auth.uid() and exists(select 1 from public.novels n where n.id=novel_id and n.status='published' and n.deleted_at is null) and (chapter_id is null or exists(select 1 from public.chapters c where c.id=chapter_id and c.status='published' and c.deleted_at is null)));
create policy "Users delete own comments" on public.comments for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Users create reports" on public.reports for insert with check (reporter_id=auth.uid());
create policy "Admins read reports" on public.reports for select using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admins update reports" on public.reports for update using (exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Users read own notifications" on public.notifications for select using (user_id=auth.uid());
create policy "Users update own notifications" on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('covers','covers',true,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Cover images are public" on storage.objects for select using(bucket_id='covers');
create policy "Users upload their own covers" on storage.objects for insert to authenticated with check(bucket_id='covers' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users update their own covers" on storage.objects for update to authenticated using(bucket_id='covers' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='covers' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users delete their own covers" on storage.objects for delete to authenticated using(bucket_id='covers' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Author avatars are public" on storage.objects for select using(bucket_id='avatars');
create policy "Users upload their own avatar" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users update their own avatar" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users delete their own avatar" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

-- Kolom profil yang boleh diubah pengguna. role, username, dan id tidak dapat diubah lewat API publik.
revoke update on public.profiles from authenticated;
grant update(full_name, author_bio, avatar_url) on public.profiles to authenticated;
-- Angka statistik hanya diubah oleh trigger/database, bukan client browser.
revoke update on public.novels from authenticated;
grant update(title, synopsis, cover_url, status, publication_status, age_rating, deleted_at, updated_at) on public.novels to authenticated;
revoke update on public.chapters from authenticated;
grant update(title, content, status, word_count, published_at, deleted_at) on public.chapters to authenticated;
revoke update on public.ratings from authenticated;
grant update(rating, review_content) on public.ratings to authenticated;
revoke update on public.reports from authenticated;
grant update(status) on public.reports to authenticated;
