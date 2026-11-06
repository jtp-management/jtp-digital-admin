-- JTP branding and publication metadata extension
ALTER TABLE journal_settings ADD COLUMN journal_full_name TEXT DEFAULT 'Jurnal Penelitian dan Pengembangan Pembelajaran';
ALTER TABLE journal_settings ADD COLUMN eissn TEXT DEFAULT '2656-1417';
ALTER TABLE journal_settings ADD COLUMN pissn TEXT DEFAULT '2503-0602';
ALTER TABLE journal_settings ADD COLUMN accreditation TEXT DEFAULT 'SINTA 3';
ALTER TABLE journal_settings ADD COLUMN accreditation_decree TEXT DEFAULT '10/C/C3/DT.05.00/2025';
ALTER TABLE journal_settings ADD COLUMN logo_data_url TEXT DEFAULT '';
ALTER TABLE journal_settings ADD COLUMN stamp_data_url TEXT DEFAULT '';
ALTER TABLE articles ADD COLUMN publication_month TEXT DEFAULT '';
ALTER TABLE journal_settings ADD COLUMN city TEXT DEFAULT 'Mataram';
