-- Jalankan di Supabase SQL Editor untuk mengunci database yang sudah berisi data.
-- Aman dijalankan ulang: hanya mengatur ulang hak update dan policy bernama.

-- Database lama mungkin belum punya kolom foto penulis; menambahkan kolom kosong
-- ini tidak menghapus atau mengubah data profil yang sudah ada.
alter table public.profiles add column if not exists avatar_url text;

-- Profil otomatis untuk pendaftar Google/email; simpan nama dan foto Google bila tersedia.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
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
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Mencegah akun menaikkan role sendiri, serta mencegah pemalsuan statistik novel.
revoke update on public.profiles from authenticated;
grant update(full_name, author_bio, avatar_url) on public.profiles to authenticated;
revoke update on public.novels from authenticated;
grant update(title, synopsis, cover_url, status, publication_status, age_rating, deleted_at, updated_at) on public.novels to authenticated;
revoke update on public.chapters from authenticated;
grant update(title, content, status, word_count, published_at, deleted_at) on public.chapters to authenticated;
revoke update on public.ratings from authenticated;
grant update(rating, review_content) on public.ratings to authenticated;
revoke update on public.reports from authenticated;
grant update(status) on public.reports to authenticated;

do $$ begin
  if exists(select 1 from pg_policies where schemaname='public' and tablename='chapters' and policyname='Authors update chapters') then
    alter policy "Authors update chapters" on public.chapters
      using (author_id=auth.uid())
      with check (author_id=auth.uid() and exists(select 1 from public.novels n where n.id=novel_id and n.author_id=auth.uid()));
  else
    create policy "Authors update chapters" on public.chapters for update
      using (author_id=auth.uid())
      with check (author_id=auth.uid() and exists(select 1 from public.novels n where n.id=novel_id and n.author_id=auth.uid()));
  end if;

  if exists(select 1 from pg_policies where schemaname='public' and tablename='ratings' and policyname='Users update own ratings') then
    alter policy "Users update own ratings" on public.ratings
      using (user_id=auth.uid())
      with check (user_id=auth.uid() and not exists(select 1 from public.novels where id=novel_id and author_id=auth.uid()));
  else
    create policy "Users update own ratings" on public.ratings for update
      using (user_id=auth.uid())
      with check (user_id=auth.uid() and not exists(select 1 from public.novels where id=novel_id and author_id=auth.uid()));
  end if;

  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Author avatars are public') then
    alter policy "Author avatars are public" on storage.objects using(bucket_id='avatars');
  else
    create policy "Author avatars are public" on storage.objects for select using(bucket_id='avatars');
  end if;

  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users upload their own avatar') then
    alter policy "Users upload their own avatar" on storage.objects to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  else
    create policy "Users upload their own avatar" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;

  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users update their own avatar') then
    alter policy "Users update their own avatar" on storage.objects to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  else
    create policy "Users update their own avatar" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;

  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users delete their own avatar') then
    alter policy "Users delete their own avatar" on storage.objects to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  else
    create policy "Users delete their own avatar" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;
end $$;

-- Avatar bucket publik untuk dibaca; unggah/timpa/hapus hanya pada folder UUID pemilik.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

update storage.buckets
set public=true, file_size_limit=2097152, allowed_mime_types=array['image/jpeg','image/png','image/webp']
where id='avatars';
