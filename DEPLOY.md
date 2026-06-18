# Deploying FindMyBites × PimpMyParty to Vercel

This guide takes you from this code to a live global deployment on Vercel,
connected to your GitHub repo.

---

## ⚠️ Before you start — two things Vercel can't do with SQLite

1. **Database**: Vercel's serverless functions can't write to the filesystem,
   so the current SQLite file DB won't work in production. You need a hosted
   Postgres — **Supabase (free tier) is recommended**. The switch is ONE line
   in `prisma/schema.prisma` + one env var.

2. **Image uploads**: Files saved to `public/uploads/` won't persist on
   Vercel (same reason). For production you should move uploads to Supabase
   Storage or S3. (The upload endpoint still works in dev; for production,
   swap the `writeFile` in `src/app/api/upload/route.ts` for a Storage call.)

Everything else (auth, FTS search, Near Me geo, admin panel) works on Vercel
as-is.

---

## Step 1 — Create a Supabase database (free, 2 minutes)

1. Go to **https://supabase.com** → Sign up → New project.
2. Pick a name, generate a strong DB password, choose a region close to you.
3. Wait ~2 min for provisioning.
4. Go to **Project Settings → Database → Connection string → URI**.
5. Copy the connection string (looks like
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`).
   Replace `[YOUR-PASSWORD]` with your actual password.

This is your `DATABASE_URL` for Vercel.

---

## Step 2 — Switch the schema to Postgres

In `prisma/schema.prisma`, change line 8:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

That's it. The Prisma client + all queries work identically on Postgres.
(The FTS5 search layer is SQLite-specific — see `src/lib/search.ts` for the
documented Postgres tsvector + pg_trgm migration path, which I already wrote.)

---

## Step 3 — Push the code to GitHub

1. Create a new repo on **https://github.com/new** (don't add a README —
   the project already has one).
2. In this project folder, run:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

All project files are already committed and `.env` is gitignored (safe).

---

## Step 4 — Deploy on Vercel

1. Go to **https://vercel.com** → Sign up / Log in with **GitHub**.
2. Click **Add New → Project**.
3. **Import** your GitHub repo (find it in the list, click Import).
4. Vercel auto-detects Next.js — keep the defaults.
5. **Expand "Environment Variables"** and add ALL of these:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Supabase connection string from Step 1 |
   | `NEXTAUTH_SECRET` | any random 32+ char string (run `openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://YOUR-APP.vercel.app` (your Vercel URL, added after first deploy) |
   | `GOOGLE_CLIENT_ID` | from Google Cloud Console (optional — for Google sign-in) |
   | `GOOGLE_CLIENT_SECRET` | from Google Cloud Console (optional) |
   | `NEXT_PUBLIC_GOOGLE_CONFIGURED` | `true` (only if you added Google creds above) |

6. Click **Deploy**. First build takes ~2-3 minutes.
7. Once deployed, Vercel gives you a URL like `https://your-app.vercel.app`.
   Go back to Environment Variables and set `NEXTAUTH_URL` to that URL,
   then redeploy (Deployments → ⋯ → Redeploy).

---

## Step 5 — Create the database tables + seed data

After the first successful deploy, run the schema + seed against your
Supabase DB. From your local machine (with `DATABASE_URL` pointing at
Supabase in your `.env`):

```bash
bun run db:push        # creates all tables
bun run seed           # inserts 24 demo vendors + 50 reviews
```

Your live site now shows real data. 🎉

---

## Step 6 (optional) — Google sign-in

1. Go to **https://console.cloud.google.com** → APIs & Services → Credentials.
2. Create OAuth 2.0 Client ID (Web application).
3. Add `https://YOUR-APP.vercel.app/api/auth/callback/google` to
   **Authorized redirect URIs**.
4. Copy the Client ID + Secret into Vercel env vars (Step 4 table).
5. Set `NEXT_PUBLIC_GOOGLE_CONFIGURED=true` and redeploy.

---

## Step 7 (optional, recommended) — Image uploads to Supabase Storage

The current `/api/upload` saves to `public/uploads/` (ephemeral on Vercel).
To make uploads permanent:

1. In Supabase → Storage → create a public bucket called `vendor-images`.
2. Replace the `writeFile` logic in `src/app/api/upload/route.ts` with a
   Supabase Storage upload (use `@supabase/supabase-js`).
3. Return the public URL Supabase gives you.

---

## Every push to `main` auto-deploys

Once connected, every `git push origin main` triggers a new Vercel deploy.
Preview deployments happen automatically for pull requests.

---

## Troubleshooting

- **Build fails on Prisma**: ensure `postinstall: "prisma generate"` is in
  `package.json` (it is). Vercel runs it automatically.
- **Auth redirects fail**: `NEXTAUTH_URL` must exactly match your Vercel URL
  (including `https://`).
- **DB errors**: double-check the Supabase connection string has your real
  password (not the `[YOUR-PASSWORD]` placeholder).
- **Search not working**: the SQLite FTS5 layer won't exist on Postgres.
  Implement the `tsvector` migration documented at the bottom of
  `src/lib/search.ts` (the API contract doesn't change — only that one file).
