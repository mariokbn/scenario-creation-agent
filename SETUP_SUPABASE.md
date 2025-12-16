# 🔷 Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to **https://app.supabase.com**
2. Sign in (or create account - it's free)
3. Click **"New Project"**
4. Fill in:
   - **Name**: `scenario-creation-agent`
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes for provisioning

## Step 2: Create Database Tables

1. In your Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. **Copy ALL the SQL code** from that file
5. **Paste it** into the SQL Editor
6. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)
7. ✅ You should see: "Success. No rows returned"

## Step 3: Get Your API Keys

1. In Supabase dashboard, click **"Settings"** (gear icon, bottom left)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL**
   - Looks like: `https://xxxxxxxxxxxxx.supabase.co`
   - Copy this entire URL

   **anon public key**
   - Long string starting with `eyJ...`
   - Click the eye icon to reveal it
   - Copy the entire key

4. **Save these somewhere safe** - you'll need them for Vercel!

## Step 4: Verify Tables Created

1. Click **"Table Editor"** (left sidebar)
2. You should see two tables:
   - ✅ `scenarios`
   - ✅ `upload_sessions`

If you see these tables, you're all set! 🎉

## Next: Deploy to Vercel

Once you have your Supabase URL and anon key, proceed to Vercel deployment.
