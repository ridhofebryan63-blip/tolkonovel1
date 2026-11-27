# Panduan TolkoNovel: dari nol sampai online

Web ini memakai **Next.js** (tampilan) dan **Supabase** (database, login, penyimpanan gambar). Hosting memakai **Vercel**. Ketiganya punya paket gratis yang cukup untuk memulai.

Versi Next.js sudah diperbarui ke 16.4.6. Gunakan Node.js LTS versi 20.9 atau lebih baru.

Waktu yang dibutuhkan: sekitar 30–45 menit.

---

## Bagian A. Siapkan alat di komputer

1. Pasang **Node.js versi LTS** dari https://nodejs.org (pilih tombol LTS, klik Next sampai selesai).
2. Pasang **Git** dari https://git-scm.com/downloads.
3. Buat akun gratis di:
   - https://supabase.com
   - https://github.com
   - https://vercel.com (daftar dengan akun GitHub)
4. Ekstrak file `tolkonovel.zip` ke satu folder, misalnya `Documents/tolkonovel`.

Cek Node sudah terpasang: buka Terminal (Windows: PowerShell), ketik `node -v`. Harus muncul angka versi, misalnya `v20.x.x`.

---

## Bagian B. Siapkan database di Supabase

1. Buka https://supabase.com/dashboard, klik **New project**.
2. Isi nama proyek (`tolkonovel`), buat **Database Password** (simpan di tempat aman), pilih region **Southeast Asia (Singapore)**, klik **Create new project**. Tunggu 1–2 menit sampai siap.
3. Di menu kiri pilih **SQL Editor**, klik **New query**.
4. Buka file `supabase/schema.sql` dari folder proyek dengan Notepad, **salin semua isinya**, tempel ke SQL Editor, lalu klik **Run**.
   Hasil yang benar: muncul tulisan *Success. No rows returned*. Jika ada error merah, jangan dijalankan ulang sebagian. Hubungi saya dengan menyertakan teks errornya.
5. Ambil kunci akses: menu **Project Settings → API** (atau **API Keys**). Salin dua nilai:
   - **Project URL** (bentuknya `https://abcdefgh.supabase.co`)
   - **anon / public key** (teks panjang yang diawali `eyJ...` atau `sb_publishable_...`)
   Jangan memakai `service_role` key di web ini. Kunci itu rahasia.

### Pendaftaran email tanpa email OTP

Form menyediakan daftar/masuk dengan email dan kata sandi serta tombol Google. Jika tidak ingin mengatur SMTP/domain, buka **Authentication → Sign In / Providers → Email** dan matikan **Confirm email**, lalu **Save**. Pendaftaran email akan langsung masuk tanpa mengirim email. Konsekuensinya, alamat email akun tersebut tidak diverifikasi; pengguna yang memiliki akses ke Google sebaiknya memakai tombol Google.

Google perlu dikonfigurasi sekali:

1. Di Supabase **Authentication → Providers → Google**, aktifkan Google dan salin callback URL yang ditampilkan.
2. Di Google Cloud Console buat OAuth Client ID tipe **Web application**. Tambahkan origin lokal `http://localhost:3000` dan origin produksi situsmu. Pada **Authorized redirect URIs**, tempel callback URL dari Supabase.
3. Salin Client ID dan Client Secret Google ke pengaturan provider Google di Supabase, lalu simpan.
4. Di Supabase **Authentication → URL Configuration**, tambahkan Redirect URLs `http://localhost:3000/auth/callback` dan `https://ALAMAT-SITUS-KAMU/auth/callback`.
5. Jalankan ulang `supabase/security_hardening.sql` agar trigger profil menyimpan nama dan foto dari Google.

Jangan masukkan Google Client Secret atau Supabase `service_role` key ke source code atau variabel `NEXT_PUBLIC_*`.

---

## Bagian C. Jalankan di komputer sendiri

Buka Terminal di folder proyek (Windows: klik kanan folder, **Open in Terminal**).

```bash
npm install
```

Salin file pengaturan:

- Mac/Linux: `cp .env.example .env.local`
- Windows PowerShell: `copy .env.example .env.local`

Buka `.env.local` dengan Notepad, isi dua nilai dari Bagian B langkah 5:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Jalankan:

```bash
npm run dev
```

Buka http://localhost:3000. Coba daftar akun, lalu klik **Tulis → Novel baru**.

Untuk menghentikan: tekan `Ctrl + C` di Terminal.

### Menjadikan diri sendiri admin

Daftar dahulu di `/login` dengan email yang bisa kamu akses, konfirmasi email bila diminta, lalu masuk. Buka Supabase **SQL Editor**, salin `supabase/make_admin.sql`, ganti `nama_pengguna_di_sini` dengan username akunmu, lalu klik **Run**. Jangan bagikan kata sandi admin atau simpan di kode. Menu **Profil → Panel admin** akan muncul setelah masuk ulang.

Jika database sudah dibuat sebelum pembaruan keamanan, jalankan `supabase/security_hardening.sql` terlebih dahulu. Script ini membatasi kolom yang dapat diubah lewat browser dan mengunci foto profil.

### Foto penulis dan novel contoh

Di **Profil**, unggah foto penulis JPG, PNG, atau WebP hingga 2 MB; foto tampil pada halaman penulis. Setelah punya akun, kamu bisa memasang novel contoh melalui SQL Editor dengan `supabase/sample_novel.sql` (ganti username placeholder). Sesudah itu novel dan bab contoh tampil publik.

### Mengisi genre tambahan

Genre awal sudah ada (Fantasi, Romantis, Aksi, dst.). Untuk menambah, jalankan di SQL Editor:

```sql
insert into public.genres (name, slug) values ('Thriller', 'thriller');
```

---

## Bagian D. Online-kan lewat GitHub dan Vercel

### D1. Unggah kode ke GitHub

1. Di https://github.com klik **New repository**, beri nama `tolkonovel`, pilih **Private**, klik **Create repository**.
2. Di Terminal pada folder proyek:

```bash
git init
git add .
git commit -m "TolkoNovel pertama"
git branch -M main
git remote add origin https://github.com/USERNAME_KAMU/tolkonovel.git
git push -u origin main
```

(Ganti `USERNAME_KAMU`. Jika diminta login, ikuti jendela yang muncul.) File `.env.local` **tidak ikut terunggah**, itu memang disengaja.

### D2. Pasang di Vercel

1. Buka https://vercel.com/new, pilih repository `tolkonovel`, klik **Import**.
2. Buka bagian **Environment Variables**, tambahkan dua variabel yang sama seperti `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Klik **Deploy**. Tunggu 1–2 menit. Kamu akan mendapat alamat seperti `https://tolkonovel.vercel.app`.

Catatan: paket Vercel Hobby gratis ditujukan untuk proyek personal/non-komersial. Jika TolkoNovel menjadi layanan komersial, cek ketentuan paket sebelum menggunakannya.

### D3. Beri tahu Supabase alamat webmu (wajib)

Menu Supabase **Authentication → URL Configuration**:

- **Site URL**: `https://tolkonovel.vercel.app` (alamat dari Vercel)
- **Redirect URLs**: tambahkan `https://tolkonovel.vercel.app/**`

Tanpa ini, link di email konfirmasi akan mengarah ke alamat yang salah.

### D4. Pakai domain sendiri (opsional)

1. Beli domain (Niagahoster, Rumahweb, Namecheap, dsb.).
2. Di Vercel: proyek → **Settings → Domains → Add**, ketik domainmu, lalu ikuti petunjuk DNS yang ditampilkan (biasanya menambah satu record A atau CNAME di panel domain).
3. Ubah **Site URL** di Supabase (D3) ke domain barumu.

### Memperbarui web di kemudian hari

Setiap kali kode diubah:

```bash
git add .
git commit -m "ubah sesuatu"
git push
```

Vercel otomatis memasang versi terbarunya.

---

## Bagian E. Cara pakai web (ringkas untuk pengguna)

**Pembaca:** Cari novel di Beranda → ketuk novel → **Mulai baca**. Tombol **Aa** mengatur ukuran huruf dan warna (terang, sepia, gelap). Posisi baca tersimpan otomatis bila sudah masuk akun. Simpan novel ke **Rak**, beri bintang dan ulasan, tulis komentar.

**Penulis:** Menu **Tulis → Novel baru** → isi judul, sinopsis, genre, sampul → ubah **Penerbitan** menjadi *Terbit* → **Simpan** → **Bab baru** → tulis → **Terbitkan**. Pembaca yang menyimpan novelmu akan mendapat notifikasi bab baru.

---

## Bagian F. Masalah yang sering muncul

| Gejala | Penyebab dan solusi |
|---|---|
| Muncul tulisan kuning *Supabase belum diatur* | `.env.local` belum diisi, atau (di Vercel) variabel belum ditambahkan. Setelah mengubah variabel di Vercel, klik **Redeploy**. |
| Pendaftaran email tetap meminta konfirmasi | Matikan *Confirm email* di Supabase (Bagian B); pendaftaran email tanpa verifikasi tidak mengirim email. |
| Novel terbit tapi tidak muncul di Beranda | Status novel masih *Draf*. Ubah ke *Terbit* di pengaturan novel. |
| Bab tidak bisa dibaca orang lain | Bab masih *Draf*, atau novelnya belum *Terbit*. |
| Gagal unggah sampul | Gambar lebih dari 2 MB atau bukan JPG/PNG/WebP. |
| *permission denied* atau *row-level security* | `schema.sql` belum dijalankan penuh. Jalankan ulang di proyek Supabase yang baru dan kosong. |
| Jumlah dilihat tidak bertambah | Hanya pembaca yang sudah masuk akun yang dihitung (sesuai desain). |

---

## Bagian G. Yang perlu kamu tahu (batasan)

- **Penutupan akun**: data profil dianonimkan dan akun tidak bisa dipakai lagi, tetapi baris pengguna di Supabase **Authentication → Users** tidak ikut terhapus. Hapus manual di sana bila ingin email itu bisa mendaftar ulang. Sesi login lama pada perangkat lain bisa bertahan sampai kedaluwarsa, tapi semua akses data sudah ditolak oleh database.
- **Jumlah dilihat** dihitung per pembaca yang masuk akun, secara sederhana (tanpa tabel log 30 menit seperti di dokumen desain).
- **Tidak ada**: login Google, jadwal rilis bab otomatis, like komentar, pembayaran/koin, dan unggah foto profil. Semuanya bisa ditambahkan nanti.
- Batas paket gratis Supabase: 500 MB database dan 1 GB penyimpanan gambar. Proyek gratis yang tidak dipakai 7 hari bisa dijeda otomatis (tinggal diaktifkan lagi dari dashboard).
- **Cadangan**: sebelum web dipakai banyak orang, pertimbangkan paket berbayar Supabase untuk backup harian.
