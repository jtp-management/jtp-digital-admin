-- Payment instructions and QRIS image settings for JTP.
ALTER TABLE journal_settings ADD COLUMN bank_name TEXT DEFAULT '';
ALTER TABLE journal_settings ADD COLUMN bank_account_number TEXT DEFAULT '';
ALTER TABLE journal_settings ADD COLUMN account_holder TEXT DEFAULT 'Ary Purmadi';
ALTER TABLE journal_settings ADD COLUMN qris_data_url TEXT DEFAULT '';
