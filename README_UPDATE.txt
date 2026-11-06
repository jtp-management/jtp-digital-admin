JTP Digital Administration — update Logo/LoA v2

Upload/replace these paths in the EXISTING GitHub repository:
- public/app.js (replace)
- src/worker.mjs (replace)
- public/assets/logo-jtp.jpg (add)
- public/assets/stempel-jurnal.png (add)

Do NOT replace wrangler.toml, functions/api/[[path]].js, or any existing configuration.
The D1 schema extension was already run manually in D1 Console. Do NOT run SQL migrations again.

After pushing to branch main, wait for Cloudflare Pages deployment to finish.
Then open Settings Jurnal and save the journal identity and upload the separate signature image.
The provided logo and stamp are already bundled as fallback assets.
