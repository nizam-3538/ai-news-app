Simple Answers (project-specific)

1) System Architecture
- Client (browser) with static frontend in `frontend/`.
- Server (Node + Express) in `backend/server.js` and serverless wrapper `backend/api/index.js`.
- Database: MongoDB (Atlas) configured via `backend/.env` (MONGODB_URI).
- External: News APIs and AI providers are called from `backend/lib/`.

2) Module Design (who does what)
- `server.js` — app setup, middleware, route mounting.
- `api/index.js` — serverless entry for Vercel; ensures DB connection and forwards requests to the Express app.
- `routes/news.js` — fetches and aggregates news.
- `routes/analyze.js` — calls AI providers for analysis.
- `routes/auth.js`, `routes/favorites.js`, `routes/password-reset.js` — handle auth, favorites, and reset flows.
- `lib/` — helper functions (AI calls, fetch wrappers, sentiment helper).

3) Data Flow Diagram (DFD)
- See `design/dfd.svg` (Level 1). It shows: User → Frontend → Backend → Database and External APIs (news & AI).

4) Sequence Diagram
- See `design/sequence-analyze.svg` for the Analyze Article flow: Frontend → /analyze → Backend → AI Provider → Backend → Frontend.

5) Database Design (simple)
- Collections: `users` (email, passwordHash, createdAt), `favorites` (userId, title, url, addedAt), optional `passwordResets`.
- Index `users.email` for uniqueness; index `favorites.userId` for quick lookups.

6) Interface Design (simple)
- Frontend pages: `index.html` (news list), `forgot-password.html`, login pages, favorites page.
- Key APIs: GET `/news`, POST `/auth/login`, POST `/analyze`, POST `/favorites`, POST `/password-reset/forgot-password`.

Files added:
- `design/dfd.svg`
- `design/sequence-analyze.svg`

You can open those SVGs in the `design/` folder to include visuals with your submission.

