-- Novel contoh untuk profil yang sudah terdaftar.
-- Ganti nama_pengguna_di_sini dengan username akun penulis Anda.
do $$
declare
  author uuid;
  novel uuid;
  genre uuid;
begin
  select id into author from public.profiles where username = 'ridho';
  if author is null then
    raise exception 'Akun penulis belum ditemukan. Daftar dahulu dan ganti username di script ini.';
  end if;

  insert into public.genres(name, slug) values ('Fantasi', 'fantasi')
    on conflict (slug) do update set name = excluded.name returning id into genre;

  insert into public.novels(author_id, slug, title, synopsis, status, publication_status, age_rating)
  values (
    author,
    'peta-yang-mengingat-hujan',
    'Peta yang Mengingat Hujan',
    'Di kota pelabuhan yang lupa cara turun hujan, Nara menemukan peta tua yang berubah setiap kali seseorang berbohong. Saat peta itu mulai menggambar jalan menuju rumahnya sendiri, ia harus memilih kebenaran mana yang sanggup ia bawa pulang.',
    'published', 'ongoing', 'all'
  )
  on conflict (slug) do update set synopsis = excluded.synopsis returning id into novel;

  insert into public.novel_genres(novel_id, genre_id) values (novel, genre) on conflict do nothing;

  insert into public.chapters(author_id, novel_id, chapter_number, title, status, published_at, word_count, content)
  values (
    author, novel, 1, 'Bab 1: Toko Peta di Ujung Dermaga', 'published', now(), 271,
    $chapter$Sudah empat puluh hari tidak hujan di Teluk Awan.

Di kota lain, orang mungkin akan menyebutnya musim kemarau. Di Teluk Awan, orang-orang menyebutnya pertanda. Mereka menutup jendela sebelum senja, menggantung lonceng tembaga di pintu, dan tidak pernah menyebut nama laut setelah matahari tenggelam.

Nara tidak percaya pada pertanda. Ia percaya pada hal-hal yang bisa diukur: panjang tali, berat kertas, dan jumlah koin di dalam kaleng biskuit ibunya. Karena itu, ketika seorang lelaki tua meletakkan peta basah di meja toko, Nara lebih dulu mencari sumber airnya.

Tidak ada. Meja itu kering. Lengan lelaki itu kering. Bahkan udara di toko terasa berdebu.

“Peta ini menunjukkan jalan pulang,” kata lelaki itu.

Nara mengangkat alis. “Semua peta menunjukkan jalan.”

“Yang ini menunjukkan jalan yang kau sembunyikan.”

Lelaki itu mendorong peta ke arahnya. Garis-garis tinta bergerak pelan seperti akar mencari tanah. Di tengah kertas, sebuah jalan baru muncul dari dermaga, membelah pasar ikan, lalu berhenti di depan rumah Nara.

Nara menahan napas. Ia belum pernah menggambar rumahnya di peta mana pun.

“Apa yang harus kubayar?” tanyanya.

Lelaki tua itu tersenyum tipis. “Satu kebenaran yang belum pernah kau ucapkan.”

Di luar, lonceng-lonceng tembaga mulai berbunyi. Langit yang kosong selama empat puluh hari mendadak berbau tanah basah.

Nara tahu satu kebenaran yang selalu ia hindari. Ia hanya tidak tahu apakah peta itu akan membawanya pulang, atau menunjukkan alasan ia harus pergi.$chapter$
  ) on conflict (novel_id, chapter_number) do nothing;
end $$;
