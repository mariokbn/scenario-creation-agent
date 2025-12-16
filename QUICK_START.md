# 🚀 Quick Start - Deploy in 5 Minutes

## Step 1: Create GitHub Repository (2 min)

1. Go to https://github.com/new
2. Repository name: `scenario-creation-agent`
3. Description: `Professional scenario creation tool with AI`
4. Choose **Public** or **Private**
5. **Important**: Do NOT check any boxes (no README, .gitignore, or license)
6. Click **Create repository**

## Step 2: Push Code to GitHub (1 min)

Run these commands in your terminal:

```bash
cd "/Users/mariobuynomics/scenario creation agent"

# Add your GitHub username (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/scenario-creation-agent.git
git branch -M main
git push -u origin main
```

Or use the helper script:
```bash
./deploy.sh
```

## Step 3: Set Up Supabase (2 min)

1. **Create Project**
   - Go to https://app.supabase.com
   - Click **New Project**
   - Name: `scenario-creation-agent`
   - Database Password: (save this securely)
   - Region: Choose closest to you
   - Click **Create new project**
   - Wait ~2 minutes for provisioning

2. **Create Tables**
   - In Supabase dashboard, go to **SQL Editor**
   - Click **New query**
   - Copy entire contents of `supabase/schema.sql`
   - Paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - You should see "Success. No rows returned"

3. **Get API Keys**
   - Go to **Settings** → **API**
   - Copy these two values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public** key (long string starting with `eyJ...`)

## Step 4: Deploy to Vercel (2 min)

1. **Import Project**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click **Add New Project**
   - Find `scenario-creation-agent` in your repositories
   - Click **Import**

2. **Configure Project**
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables**
   Click **Environment Variables** and add:
   
   ```
   Name: VITE_SUPABASE_URL
   Value: [paste your Supabase Project URL]
   ```
   
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: [paste your Supabase anon key]
   ```
   
   ```
   Name: VITE_OPENAI_API_KEY (optional)
   Value: [your OpenAI API key if you have one]
   ```

4. **Deploy**
   - Click **Deploy**
   - Wait ~2 minutes for build
   - Your app will be live! 🎉

## Step 5: Test Your Deployment

1. Visit your Vercel URL (provided after deployment)
2. Upload a CSV file (base scenario)
3. Upload a JSON file (product master)
4. Create a scenario
5. Check Supabase dashboard → **Table Editor** → **scenarios** to see saved data

## 🎯 That's It!

Your app is now live and saving data to Supabase!

## 🔧 Troubleshooting

**Build fails?**
- Check that all environment variables are set in Vercel
- Verify Node.js version (Vercel uses 18+)

**Can't connect to Supabase?**
- Double-check your URL and anon key
- Verify tables were created (check SQL Editor)
- Check RLS policies are set (see schema.sql)

**Data not saving?**
- Check browser console for errors
- Verify Supabase credentials in Vercel
- Check Supabase logs in dashboard

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check `README.md` for feature documentation
- Check browser console for error messages
