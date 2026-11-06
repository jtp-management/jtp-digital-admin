PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  article_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  corresponding_author TEXT,
  email TEXT,
  affiliation TEXT,
  volume TEXT,
  issue TEXT,
  publication_year TEXT,
  received_date TEXT,
  accepted_date TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id),
  issue_date TEXT NOT NULL,
  due_date TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  paid_date TEXT,
  payer_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loa_documents (
  id TEXT PRIMARY KEY,
  loa_number TEXT UNIQUE NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id),
  issue_date TEXT NOT NULL,
  statement_text TEXT,
  signatory_name TEXT,
  signatory_title TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS journal_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  journal_name TEXT NOT NULL DEFAULT 'Jurnal Teknologi Pendidikan',
  publisher TEXT DEFAULT '',
  address TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  editor_name TEXT DEFAULT '',
  editor_title TEXT DEFAULT 'Editor in Chief',
  signature_data_url TEXT DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO journal_settings (id, journal_name)
VALUES (1, 'Jurnal Teknologi Pendidikan');

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
