# Cleaned Project File Structure (production-focused)

This file lists the production-relevant files and folders in the ai-news-app repository. It excludes test files (files starting with `test-` and the `tests/` folders), temporary files, and backup artifacts (for example `.mb` files).

Top-level
- package.json
- vercel.json
- README.md
- DEPLOYMENT_GUIDE.md
- QUICK_SETUP.md
- FIX_SUMMARY.md
- BUILD-CHECK.js (optional)
- docs/ (documentation markdown files)

backend/
- package.json
- server.js
- .env (local only — do NOT commit to VCS; secrets belong in platform settings)
- vercel.json (optional backend specific config)
- api/
  - index.js            # Serverless wrapper for Vercel
  - test.js             # Small ESM test handler (optional)
- lib/                  # Shared runtime libraries (AI helpers, utils)
  - ai.js
  - utils.js
  - ...
- models/               # Mongoose models
  - user.js
  - article.js
  - ...
- routes/               # Express routes used at runtime
  - news.js
  - analyze.js
  - auth.js
  - favorites.js
  - password-reset.js
  - ...
- scripts/ (operational helpers)
  - check-env-vars.js
  - check-health.js
  - interactive-setup.js
  - ...

frontend/
- index.html
- script.js / app.js     # main frontend bundle / logic
- auth.js
- favorites.js
- chat.js (if used in production)
- forgot-password.html   # updated to dynamic API_BASE_URL
- style.css and other CSS
- images/ assets/ icons/
- other production pages (news.html, image-test.html)

config/
- eslint.config.js
- (optional) Dockerfile

deployment/ (optional helpers)
- render.yaml (if present)
- cloud-run/ (Docker / deployment configs)

notes/
- API_KEY_CHECKLIST.md
- GETTING_API_KEYS.md
- DEPLOYMENT_GUIDE.md

What was excluded
- All `test-*.js` files in `backend/` and `frontend/` (unit/integration/test harnesses)
- `backend/tests/` folder and other test script directories
- Demo / integration / verification pages used only for local testing (e.g., `integration-test.html`, `complete-test.html`, `final-verification.html`) — keep them in the repo but they are not listed here
- Temporary or backup files (e.g., *.mb or other local artifacts)

Notes & next steps
- If you want, I can write a `.vercelignore` or `.gitignore` to automatically exclude test and temp files from deployments and commits.
- I can also generate a precise, file-by-file tree (filtered) if you'd like the exact file list that remains after exclusion.

Generated on: 2025-10-08
