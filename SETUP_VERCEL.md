# ▲ Vercel Deployment Guide

## Prerequisites

✅ Code pushed to GitHub: https://github.com/mariokbn/scenario-creation-agent  
✅ Supabase project created and tables set up  
✅ Supabase URL and anon key ready

## Step 1: Import Project to Vercel

1. Go to **https://vercel.com**
2. Sign in with **GitHub** (use the same account)
3. Click **"Add New Project"** (or **"Import Project"**)
4. You'll see your GitHub repositories
5. Find **`scenario-creation-agent`**
6. Click **"Import"**

## Step 2: Configure Project Settings

Vercel should auto-detect Vite, but verify:

- **Framework Preset**: `Vite` ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `dist` ✅
- **Install Command**: `npm install` ✅

## Step 3: Add Environment Variables

**IMPORTANT**: Add these BEFORE clicking Deploy!

1. Scroll down to **"Environment Variables"**
2. Click **"Add"** for each variable:

   **Variable 1:**
   ```
   Name: VITE_SUPABASE_URL
   Value: [paste your Supabase Project URL]
   ```
   - Environment: Select all (Production, Preview, Development)

   **Variable 2:**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: [paste your Supabase anon key]
   ```
   - Environment: Select all (Production, Preview, Development)

   **Variable 3 (Optional - for AI features):**
   ```
   Name: VITE_OPENAI_API_KEY
   Value: [your OpenAI API key if you have one]
   ```
   - Environment: Select all

3. Make sure all variables are added and visible

## Step 4: Deploy!

1. Click **"Deploy"** button (bottom right)
2. ⏳ Wait 2-3 minutes for build
3. Watch the build logs - should see:
   - ✅ Installing dependencies
   - ✅ Building application
   - ✅ Deploying

## Step 5: Your App is Live! 🎉

1. Once deployment completes, you'll see:
   - ✅ **"Congratulations!"** message
   - Your live URL (e.g., `scenario-creation-agent.vercel.app`)

2. Click the URL to visit your app

3. **Test it:**
   - Upload CSV file
   - Upload JSON file
   - Create a scenario
   - Check Supabase → Table Editor → scenarios (should see your data!)

## 🎯 Custom Domain (Optional)

1. In Vercel project settings
2. Go to **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

## 🔧 Troubleshooting

**Build fails?**
- Check environment variables are set correctly
- Check build logs for specific errors
- Verify Node.js version (Vercel uses 18+)

**Can't connect to Supabase?**
- Double-check URL and anon key in Vercel
- Verify Supabase tables exist
- Check browser console for errors

**App loads but data doesn't save?**
- Check Supabase RLS policies
- Verify environment variables in Vercel
- Check browser console for API errors

## 📊 Monitoring

- **Vercel Dashboard**: View deployments, logs, analytics
- **Supabase Dashboard**: View database, logs, API usage

Your app is now live! 🚀
