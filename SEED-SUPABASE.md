# Seed your Supabase database (run on YOUR computer, ~1 minute)

Your Supabase project is live but needs the tables + demo data. Run these
commands on your own computer (it can reach Supabase directly).

## Prerequisites
- Install Node.js or Bun: https://bun.sh (fastest) or https://nodejs.org

## Steps

```bash
# 1. Clone your repo
git clone https://github.com/crosscraftedin-prog/findmybites-pimpmpyparty.git
cd findmybites-pimpmpyparty

# 2. Install dependencies
bun install        # or: npm install

# 3. Create .env with your Supabase connection string
echo 'DATABASE_URL=postgresql://postgres:Joshcat%401406@db.kcqygvzxgkvwlupoyzzw.supabase.co:5432/postgres' > .env

# 4. Create all tables in Supabase
bunx prisma db push
#   → type "y" if it asks about data loss (it's a new empty DB)

# 5. Insert the 24 demo vendors + 50 reviews
bun run seed
```

## Verify
Visit https://findmybites-pimpmpyparty.vercel.app — you should see all the
vendors. Also check https://kcqygvzxgkvwlupoyzzw.supabase.co → Table Editor
to see the Vendor rows.

## Don't forget: add DATABASE_URL to Vercel
In Vercel → your project → Settings → Environment Variables, add:
- Name: `DATABASE_URL`
- Value: `postgresql://postgres:Joshcat%401406@db.kcqygvzxgkvwlupoyzzw.supabase.co:5432/postgres`
- Apply to all environments

Then Deployments → ⋯ → Redeploy.
