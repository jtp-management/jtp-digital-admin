# JTP Digital Administration — Complete Payment & Notification Update

This package updates the existing JTP Digital Administration Cloudflare Pages project.
It includes:
- Article, invoice, LoA, journal settings and verification source
- Bank transfer payment details (account holder defaults to Ary Purmadi)
- Static QRIS image upload and display on invoice
- Automatic unique QR verification codes for new invoices and LoAs
- Public document verification page
- WhatsApp share message for invoice (manual send)
- Optional automatic invoice email using Resend
- Cloudflare Pages Function route for /verify/<code>

## IMPORTANT: Existing live project
This package is for the existing repository and existing D1 database. Do not delete or recreate the project/database.
Do not overwrite the existing `wrangler.toml` or change the Cloudflare Pages D1 binding (`DB`) or database ID.
Keep existing `ADMIN_API_KEY` secret.

## Files
Upload/replace all included folders/files into the ROOT of the existing GitHub repository:
- `public/`
- `src/`
- `functions/`
- `migrations/0004_payment_settings.sql`
- `README.md`

Do not replace the current `wrangler.toml`.

## Database migration (run ONCE)
1. Open Cloudflare Dashboard > D1 > `jtp-journal-db` > Console.
2. Run the complete contents of `migrations/0004_payment_settings.sql` once.
3. It adds `bank_name`, `bank_account_number`, `account_holder`, and `qris_data_url` to `journal_settings`.
4. Do not rerun this migration. If a duplicate-column error appears, inspect table_info first.

Previous migrations 0001, 0002 and 0003 should NOT be rerun; they were applied in the existing database.

## Configure bank and QRIS
After deployment:
1. Log in to the JTP admin site.
2. Open Pengaturan Jurnal.
3. Fill Bank name, bank account number, account holder (default: Ary Purmadi).
4. Upload the official QRIS image (PNG/JPG, maximum 300 KB).
5. Save settings.

The bank account number is intentionally left blank until the journal owner supplies the correct details. Do not publish a guessed account number.

QRIS in this release is STATIC: the author enters the invoice amount in their payment app. The admin checks the transaction in the bank/QRIS merchant dashboard and marks the invoice as paid. Automatic amount creation and automatic payment confirmation require a dynamic QRIS/payment gateway integration.

## Optional automatic email notification (Resend)
Email notification is sent automatically when an invoice is created only if all are configured:
- `RESEND_API_KEY` as a Cloudflare Pages Secret
- `EMAIL_FROM` as a Cloudflare Pages variable (sender must be verified in Resend)
- Corresponding author's email exists in article data

Add them under Cloudflare Pages > Settings > Variables and Secrets, then redeploy.
Without these settings, invoice creation still works and the admin can share the invoice through WhatsApp manually.

WhatsApp sharing opens a prefilled message. The admin sends it and attaches the invoice PDF manually. This release does not send WhatsApp messages automatically; automatic WhatsApp delivery requires WhatsApp Business Cloud API and approved template setup.

## Deployment
- Cloudflare Pages build command: empty
- Build output directory: `public`
- Root directory: repository root
- Existing D1 binding: variable name `DB`, database `jtp-journal-db`
- Existing secret: `ADMIN_API_KEY`

After GitHub commit, wait for Pages deployment status Success.
