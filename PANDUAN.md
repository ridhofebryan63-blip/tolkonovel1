# Panduan TolkoNovel: dari nol sampai online

Web ini memakai **Next.js** (tampilan) dan **Supabase** (database, login, penyimpanan gambar). Hosting memakai **Vercel**. Ketiganya punya paket gratis yang cukup untuk memulai.

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

### Pengaturan konfirmasi email (pilih salah satu)

Secara bawaan, orang yang mendaftar harus mengklik link di email dulu. Supabase gratis membatasi jumlah email per jam, jadi untuk percobaan lebih mudah dimatikan:

- Menu **Authentication → Sign In / Providers → Email**, matikan **Confirm email**, lalu **Save**.
- Untuk web publik sungguhan, sebaiknya aktifkan lagi dan pasang SMTP sendiri (Authentication → SMTP Settings), misalnya lewat Resend atau Brevo.

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

Admin bisa melihat laporan dan menangguhkan novel. Setelah mendaftar, buka Supabase **SQL Editor** dan jalankan (ganti `namamu` dengan nama pengguna kamu):

```sql
update public.profiles set role = 'admin' where username = 'namamu';
```

Menu **Profil → Panel admin** akan muncul.

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
| Daftar akun berhasil tapi tidak bisa masuk | Email belum dikonfirmasi. Cek email, atau matikan *Confirm email* (Bagian B). |
| *email rate limit exceeded* | Batas email Supabase gratis terlampaui. Matikan *Confirm email* atau pasang SMTP sendiri. |
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
