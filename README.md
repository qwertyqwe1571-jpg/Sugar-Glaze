# Sugar & Glaze

Node.js + Express storefront for ordering desserts with Supabase persistence, cookie sessions, admin product management, Cloudinary uploads, and email order verification.

## Requirements

- Node.js 20+
- npm
- Supabase project
- Cloudinary account for admin image uploads
- Brevo transactional email API key for Render Free deployments
- Gmail app password only for local SMTP fallback

## Local Setup

```powershell
npm install
Copy-Item .env.example .env
```

Fill `.env` with the real values. The server uses `SUPABASE_SERVICE_ROLE_KEY` only; it no longer falls back to `SUPABASE_ANON_KEY`. Keep `APP_URL` and `CORS_ORIGIN` equal to the local or deployed site origin.

Run locally:

```powershell
npm run dev
```

Open `http://localhost:3100` when `PORT=3100`.

## Database

Production schema:

1. Open Supabase SQL Editor.
2. Run `database/sugar_glaze_schema.sql`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` only on the server or Render environment.

The schema enables RLS on all application tables and grants application access through service-role policies. Browser code does not talk to Supabase directly.

Demo data:

- `database/sugar_glaze_full_setup.sql` is marked `DEMO ONLY`.
- Use it only for local or diploma demonstration databases.
- Do not run the demo setup on the production Render database.

## Scripts

```powershell
npm run dev
npm run build
npm start
npm test
```

`npm run build` compiles `public/style.scss` through `node ./node_modules/sass/sass.js`, so it does not depend on platform-specific npm shell shims.

## Render

Recommended service settings:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: copy the real values from `.env`, especially `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`, `CORS_ORIGIN`, Gmail, and Cloudinary variables.
- Set `NODE_ENV=production`.
- Optional for free Supabase projects: set `SUPABASE_MANAGEMENT_TOKEN` and `SUPABASE_PROJECT_REF` if you want the server to request project restore automatically when the project is paused and show per-service startup states in the storefront modal. Keep this token server-only.
- Recommended email setup on Render Free: set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME`. Render Free blocks outbound SMTP ports, so Gmail/Nodemailer is kept only as a local fallback. Keep `ORDER_NOTIFICATIONS_EMAIL=qwertyqwe1571@gmail.com` if order notifications should still arrive to that Gmail inbox.

Set `APP_URL` to the deployed Render URL after the first deployment.

## Security Notes

- Registration, login, order-code sending, and order-code verification are rate limited in `server.js`.
- The storefront calls `/api/health/supabase` on page load. That endpoint sends a lightweight `sweets.select('id').limit(1)` query before loading the catalog. If Supabase is unavailable, the endpoint returns `202` with `waking: true`, and the browser keeps polling for about a minute. A fully paused Supabase project is restored through Supabase Studio or the Management API; configure `SUPABASE_MANAGEMENT_TOKEN` for automatic server-side restore requests and Management API health details (`Database`, `PostgREST`, `Auth`, `Realtime`, `Storage`, `Pooler`).
- Order verification codes are hashed and stored in `public.order_verifications`; active confirmations survive a server restart.
- Orders store `items` as `jsonb`, not text.
- Demo accounts and demo orders live only in the demo setup SQL file.
