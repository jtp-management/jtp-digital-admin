# Pembaruan JTP Digital Administration

Paket ini adalah pembaruan inkremental untuk proyek Cloudflare Pages yang sudah berjalan.

## File yang diganti
- `src/worker.mjs`
- `public/app.js`

Jangan menghapus atau mengganti database D1, binding `DB`, secret `ADMIN_API_KEY`, `wrangler.toml`, folder `functions/`, maupun file lain yang sudah ada.

## Perubahan
1. Nomor LoA baru menggunakan format `NNN/LOA/JTP-UNDIKMA/BULAN-ROMAWI/TAHUN`.
2. Untuk tahun 2026, urutan dilanjutkan dari nomor manual 501, sehingga LoA baru berikutnya menjadi 502.
3. Mulai tahun 2027, urutan dimulai dari 001 dan naik otomatis.
4. Bulan Romawi mengikuti bulan tanggal penerbitan LoA.
5. Template LoA menampilkan label `Edisi Penerbitan` dengan Volume, Nomor, Bulan, dan Tahun artikel.
6. Tanggal pada daftar dan PDF ditampilkan dalam format DD/MM/YYYY. Nilai tanggal tetap disimpan dalam format ISO di database.
7. Template cetak menampilkan QR Code jika `verification_code` tersedia. Jika belum tersedia, template menampilkan peringatan agar kekosongan kode tidak terlewat.

## Cara memasang
1. Buka repository GitHub proyek JTP Digital Administration.
2. Buka `src/worker.mjs`, pilih Edit, lalu ganti seluruh isinya dengan file dari paket ini.
3. Buka `public/app.js`, pilih Edit, lalu ganti seluruh isinya dengan file dari paket ini.
4. Commit perubahan ke branch yang digunakan Cloudflare Pages.
5. Tunggu deployment Cloudflare Pages selesai.
6. Buka ulang dashboard, masuk menu LoA, lalu uji dengan membuat satu LoA percobaan hanya jika memang siap diterbitkan.

## Catatan penting tentang penomoran
- Kode menetapkan baseline 501 untuk tahun 2026. Nomor berikutnya adalah 502.
- Untuk tahun selain 2026, nomor dimulai dari 001 berdasarkan tahun pada tanggal penerbitan LoA.
- Nomor LoA yang sudah ada tidak diubah.
- Jangan menerbitkan LoA uji coba jika tidak ingin nomor urut terpakai.
- Untuk mencegah nomor ganda bila beberapa admin menerbitkan LoA secara bersamaan, sebaiknya hanya satu admin menerbitkan LoA pada satu waktu. Implementasi ini belum menggunakan tabel sequence/transaksi khusus.

## QR Code untuk LoA lama
Kode ini membuat QR Code untuk LoA baru. LoA lama yang `verification_code`-nya masih NULL perlu diberi kode terlebih dahulu. Jalankan satu kali di Cloudflare D1 Console jika belum pernah dilakukan:

```sql
UPDATE loa_documents
SET verification_code =
    lower(hex(randomblob(4))) || '-' ||
    lower(hex(randomblob(2))) || '-' ||
    lower(hex(randomblob(2))) || '-' ||
    lower(hex(randomblob(2))) || '-' ||
    lower(hex(randomblob(6)))
WHERE verification_code IS NULL OR verification_code = '';
```

Perintah tersebut hanya mengisi kolom kode verifikasi yang kosong. Tidak menghapus atau mengubah isi LoA. Setelah itu refresh dashboard dan cetak ulang PDF LoA.

## Catatan format tanggal
Form input menggunakan kontrol tanggal browser (`input type=date`) dan menyimpan nilai ISO `YYYY-MM-DD`. Tampilan tabel/PDF diformat `DD/MM/YYYY`. Tampilan kontrol kalender dapat mengikuti pengaturan bahasa/browser.
