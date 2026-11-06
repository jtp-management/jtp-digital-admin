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
