# Architect — Setup Guide

Get your app live on your phone and laptop in 15 minutes. Total cost: $0.

---

## STEP 1 — Create your database (Supabase)

1. Go to **https://supabase.com** and click **Start your project** (sign up free with GitHub or email)
2. Once logged in, click **New Project**
   - **Name:** `architect`
   - **Database Password:** pick anything, save it somewhere
   - **Region:** US East (or closest to Montreal)
3. Wait about 1 minute for it to set up

### Create the table

4. In the left sidebar, click **SQL Editor**
5. Click **New Query**
6. Paste this EXACTLY:

```sql
create table architect_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table architect_data enable row level security;

create policy "Allow all access" on architect_data
  for all using (true) with check (true);
```

7. Click the green **Run** button — you should see "Success"

### Get your keys

8. In the left sidebar, click **Project Settings** (the gear icon at the bottom)
9. Click **API**
10. You need TWO things from this page:
    - **Project URL** — looks like `https://abc123xyz.supabase.co`
    - **anon public key** — long string starting with `eyJ...`
11. Copy both somewhere (a note on your phone works)

---

## STEP 2 — Paste your keys into the app

1. Unzip the `architect-app.zip` file you downloaded
2. Open the folder and find: `src/supabase.js`
3. Open it in any text editor (TextEdit on Mac, Notepad on Windows)
4. Replace the two placeholder lines:

```js
const SUPABASE_URL = 'https://your-actual-url.supabase.co'
const SUPABASE_ANON_KEY = 'eyJyour-actual-key-here'
```

5. Save the file

---

## STEP 3 — Deploy to Vercel (makes it a real website)

### First: push to GitHub

1. Go to **https://github.com** — sign up or log in
2. Click the **+** in the top right → **New repository**
   - Name: `architect-app`
   - Keep it **Public** or **Private**, doesn't matter
   - Do NOT check "Add a README"
   - Click **Create repository**
3. GitHub will show you setup instructions. You need to run commands in your terminal.

**If you're on Mac:**
- Open **Terminal** (search for it in Spotlight)
- Run these commands one by one:

```bash
cd ~/Downloads/architect-app
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/architect-app.git
git push -u origin main
```

**If you're on Windows:**
- Download Git from https://git-scm.com if you don't have it
- Open **Git Bash**
- Same commands as above

### Then: deploy on Vercel

4. Go to **https://vercel.com** — sign up with your GitHub account
5. Click **Add New → Project**
6. Find your `architect-app` repo and click **Import**
7. Framework should auto-detect as **Vite**
8. Click **Deploy**
9. Wait about 60 seconds — done!
10. You'll get a URL like: `architect-app.vercel.app`

**Test it:** Open that URL in your browser. You should see the Architect app.

---

## STEP 4 — Add to your phone home screen

### iPhone
1. Open your Vercel URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share button** (square with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Name it `Architect` → tap **Add**

### Android
1. Open your Vercel URL in **Chrome**
2. Tap the **three dots** in the top right
3. Tap **Add to Home Screen**
4. Name it `Architect` → tap **Add**

It now opens full-screen like a native app — no browser bar.

---

## STEP 5 — Access from your laptop

Just bookmark your Vercel URL in your browser. Same app, same data — it all syncs through Supabase.

---

## Optional: Custom domain

If you want something like `architect.servirahq.com`:

1. In Vercel → your project → **Settings** → **Domains**
2. Add your domain
3. Add the DNS records Vercel shows you at your domain registrar (Namecheap)

---

## Optional: App icon

The app uses placeholder icons. To add your own:

1. Find or create a 512x512 PNG icon
2. Go to https://favicon.io/favicon-converter/
3. Upload your image
4. Download the generated files
5. Put `android-chrome-192x192.png` as `icon-192.png` in the `public/` folder
6. Put `android-chrome-512x512.png` as `icon-512.png` in the `public/` folder
7. Push to GitHub again — Vercel auto-deploys

---

## How it works

- **Your data** lives in Supabase (your own database, free forever for this)
- **Your app** lives on Vercel (free forever for personal projects)
- **Your phone** accesses it as a PWA (progressive web app) — feels native
- When you make changes on your phone, they sync instantly to your laptop and vice versa

---

## Troubleshooting

**"Failed to fetch" or blank screen:**
→ Double-check your Supabase URL and key in `src/supabase.js`. Make sure there are no extra spaces.

**App shows but doesn't save data:**
→ Make sure you ran the SQL query in Step 1. Check the Supabase dashboard → Table Editor to see if `architect_data` table exists.

**Can't push to GitHub:**
→ You might need to set up Git credentials. Run: `git config --global user.email "you@email.com"` and `git config --global user.name "Your Name"`

**Want to update the app later:**
→ Edit files locally, then run `git add . && git commit -m "update" && git push` — Vercel auto-deploys.
