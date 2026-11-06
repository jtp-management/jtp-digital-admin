# JTP Digital Administration System

MVP administrasi Jurnal Teknologi Pendidikan:
- Data artikel dan penulis
- Pencatatan pembayaran/invoice
- Penerbitan Letter of Acceptance (LoA)
- Upload tanda tangan editor (disimpan sebagai data URL di D1; gunakan file PNG kecil)
- Cetak/simpan dokumen sebagai PDF melalui dialog Print browser
- Berbagi melalui WhatsApp secara manual menggunakan tautan dokumen

## Arsitektur
Cloudflare Pages + Pages Functions + D1. Tidak membutuhkan localhost untuk deployment.

## 1. Buat D1
Buat database D1 bernama `jtp-journal-db` di Cloudflare Dashboard.
Salin Database ID.

Jalankan `migrations/0001_init.sql` pada D1 Console (Production).

## 2. Hubungkan GitHub dan Pages
Upload seluruh isi ZIP ke repository GitHub (root repository).
Buat Cloudflare Pages project dari repository tersebut:
- Framework preset: None
- Build command: kosong
- Build output directory: `public`

Tambahkan Pages Functions D1 binding:
- Variable name: `DB`
- Database: `jtp-journal-db`

## 3. Secret admin
Di Cloudflare Pages > Settings > Variables and Secrets, tambahkan:
- `ADMIN_API_KEY` (Secret): buat string acak panjang, minimal 32 karakter.

Jangan masukkan secret ke GitHub atau frontend.
Setelah menambahkan binding/secret, redeploy project.

## 4. Penggunaan
Buka domain Pages.
Masukkan ADMIN_API_KEY pada layar login.
Buat artikel, kemudian buat invoice atau LoA.
Dokumen ditampilkan dalam halaman cetak. Pilih "Save as PDF" pada dialog browser.
Tombol WhatsApp menyiapkan pesan dan tautan dokumen. Untuk membagikan PDF, unduh PDF lalu lampirkan secara manual di WhatsApp.

## Catatan penting
- Ini starter MVP, bukan sistem akuntansi tersertifikasi atau tanda tangan elektronik tersertifikasi.
- Tanda tangan berupa gambar PNG adalah tanda tangan elektronik sederhana. Pastikan ada otorisasi tertulis dari pemilik tanda tangan.
- LoA sebaiknya diterbitkan hanya setelah keputusan editorial final.
- Nomor dokumen dibuat otomatis, tetapi formatnya dapat disesuaikan.
- Semua API admin dilindungi `ADMIN_API_KEY`. Gunakan HTTPS (Cloudflare Pages otomatis).
- Untuk penggunaan institusional/produksi, disarankan menambah role user, audit log lebih rinci, backup terjadwal, R2 untuk file tanda tangan, dan layanan email transactional.


## Update 2: Identitas JTP, bulan terbit, stempel, dan kop LoA
File aset tersedia di `public/assets/logo-jtp.jpg` dan `public/assets/stempel-jurnal.png`.
Setelah update source code di GitHub, jalankan SQL tambahan `migrations/0002_journal_branding.sql` SATU KALI pada database D1 yang sama. Jangan jalankan ulang `0001_init.sql`.
Migration ini menambah metadata jurnal (nama lengkap, ISSN, akreditasi, nomor SK, logo, stempel, kota) dan `publication_month` pada artikel.
Setelah migration berhasil, deploy ulang Pages. Buka Pengaturan Jurnal dan isi identitas, unggah tanda tangan editor (maks. 300 KB), serta periksa logo/stempel.
Catatan: logo jurnal yang diberikan berupa JPG dengan latar putih; stempel berupa PNG transparan. Logo indeksasi pada contoh LoA belum diberikan sebagai file terpisah, sehingga versi ini menampilkan nama indeksasi dalam bentuk teks, bukan logo grafis.
