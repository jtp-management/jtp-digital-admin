# Aktivasi Email Invoice dan LoA via Gmail

Fitur ini menambahkan tombol **Email PDF** pada daftar Invoice dan LoA. PDF dibuat di browser dan dikirim sebagai lampiran melalui Gmail API. QRIS pada invoice tidak disertakan secara default; saat mengirim invoice admin mendapat pilihan konfirmasi untuk menyertakannya.

## 1. Google Cloud
1. Buat/pilih project di Google Cloud Console.
2. Aktifkan **Gmail API**.
3. Konfigurasikan OAuth consent screen (External/Internal sesuai akun).
4. Buat OAuth Client ID tipe Web application. Tambahkan `https://developers.google.com/oauthplayground` sebagai Authorized redirect URI jika memakai OAuth 2.0 Playground.
5. Di OAuth Playground, aktifkan pengaturan untuk memakai OAuth credentials sendiri, masukkan Client ID/Secret, pilih scope `https://www.googleapis.com/auth/gmail.send`, authorize akun Gmail jurnal, lalu tukarkan authorization code untuk memperoleh **refresh token**. Jaga refresh token sebagai rahasia.

## 2. Cloudflare Worker secrets
Pada project Worker/Pages yang menjalankan `src/worker.mjs`, tambahkan secrets berikut melalui Settings → Variables and Secrets:
- `GMAIL_CLIENT_ID` = OAuth Client ID
- `GMAIL_CLIENT_SECRET` = OAuth Client Secret
- `GMAIL_REFRESH_TOKEN` = refresh token hasil OAuth
- `GMAIL_SENDER` = alamat Gmail jurnal, contoh `Jurnal Teknologi Pendidikan <alamat@gmail.com>`

Jangan menaruh nilai rahasia di source code atau GitHub. Pastikan Gmail yang diotorisasi sama dengan alamat pada `GMAIL_SENDER`.

## 3. Deploy dan uji
1. Upload seluruh isi folder project ke repository GitHub (jangan mengubah binding D1 yang sudah berjalan).
2. Deploy ulang Cloudflare Pages/Workers.
3. Pastikan data artikel memiliki alamat email penulis.
4. Buka Invoice atau LoA, tekan **Email PDF**.
5. Untuk invoice, pilih OK jika QRIS ingin disertakan; Cancel untuk PDF tanpa QRIS.
6. Periksa inbox penerima dan folder Sent pada Gmail jurnal.

## Catatan
- Pengiriman tidak berjalan sampai empat Gmail secrets di atas dikonfigurasi.
- Gmail API mengirim lampiran PDF yang dirender oleh browser admin; koneksi internet diperlukan untuk memuat html2pdf.js dari CDN.
- Batas ukuran PDF pada endpoint sekitar 9 MB.
- Email otomatis lama berbasis Resend pada saat membuat invoice tetap terpisah; tombol Email PDF menggunakan Gmail.
