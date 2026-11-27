-- Jalankan sekali di Supabase SQL Editor setelah akun Anda mendaftar dan mengonfirmasi email.
-- Ganti nama_pengguna_di_sini dengan username persis seperti yang dipilih saat daftar.
update public.profiles
set role = 'admin'
where username = 'ridho';

-- Pastikan hasilnya tepat satu baris. Jika 0 rows, cek username dan apakah profil sudah dibuat.
select username, role from public.profiles where username = 'ridho';
