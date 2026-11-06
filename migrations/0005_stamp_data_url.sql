-- Jalankan hanya jika kolom stamp_data_url belum ada.
ALTER TABLE journal_settings ADD COLUMN stamp_data_url TEXT DEFAULT '';
