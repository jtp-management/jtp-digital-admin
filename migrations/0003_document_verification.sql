-- Add one unique public verification code to every newly issued document.
ALTER TABLE invoices ADD COLUMN verification_code TEXT;
ALTER TABLE loa_documents ADD COLUMN verification_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_verification_code ON invoices(verification_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loa_verification_code ON loa_documents(verification_code);
