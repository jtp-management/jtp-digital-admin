JTP Digital Administration — Automatic QR Verification update

This is an incremental update for the existing Cloudflare Pages project.

Files to replace/add in the existing GitHub repository:
- Replace: public/app.js
- Replace: src/worker.mjs
- Add: migrations/0003_document_verification.sql

Database step:
1. Open Cloudflare D1 > jtp-journal-db > Console.
2. Run the contents of migrations/0003_document_verification.sql ONCE.
3. Do not rerun it; duplicate-column errors mean it has already been applied.

GitHub:
1. Commit the updated public/app.js and src/worker.mjs and add the migration file.
2. Wait for Cloudflare Pages deployment to finish.

Behavior:
- Every newly created invoice and LoA gets a cryptographically random UUID verification code.
- The printed document includes a QR code linking to /verify/<code>.
- The public verification page checks the code against D1 and displays document metadata.
- The public verification endpoint is read-only and does not require the admin API key.
- Existing documents created before this update have no verification code. They will not show a QR unless reissued or separately backfilled.

Important:
- Do not replace wrangler.toml, functions/api/[[path]].js, or existing D1 data.
- The QR image is generated in the print window using QRCode.js from cdnjs; internet access is required when printing.
- QR validation proves the record exists in the journal database. It does not itself constitute a certified digital signature.
