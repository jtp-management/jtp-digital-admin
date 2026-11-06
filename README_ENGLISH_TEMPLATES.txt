JTP DIGITAL ADMINISTRATION – ENGLISH DOCUMENT TEMPLATES UPDATE

Files to replace in the existing GitHub repository:
1. public/app.js       -> replace the existing public/app.js
2. src/worker.mjs      -> replace the existing src/worker.mjs

Changes in this update:
- All generated journal document templates use English wording: Invoice, Letter of Acceptance, payment information, signature block, indexing note, and document verification page.
- Invoice email notification and WhatsApp share text use English.
- LoA form labels and default acceptance statement use English.
- Dates shown on generated documents use DD-MM-YYYY (for example: Mataram, 29-10-2026).
- LoA number format: NNN/LOA/JTP-UNDIKMA/ROMAN-MONTH/YYYY.
- 2026 numbering continues after the highest numeric prefix already recorded for 2026 (for example, after 501 the next is 502).
- Each new calendar year starts at 001. The Roman month follows the LoA issue date.
- The publication edition (Volume, Issue, Month, Year) remains sourced from the article metadata.
- New LoAs receive a verification code; the QR code and public verification route are retained.

Important installation notes:
- Replace only the two files listed above.
- Do NOT delete or recreate the D1 database.
- Do NOT replace wrangler.toml or change the DB binding.
- No database migration is required for this update.
- Existing Invoice and LoA records are retained. Existing LoA numbers are not renamed.
- Before issuing a real LoA, confirm the manually issued 501 record exists in loa_documents with an issue_date in 2026. If it is not in the database, the automatic sequence cannot detect it.

After replacing the files, commit the changes to GitHub and wait for Cloudflare Pages deployment to complete. Then print a test Invoice and LoA and check the English wording, date format, payment details, and QR verification.
