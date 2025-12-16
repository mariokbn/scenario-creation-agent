# Deployment Guide

This guide will help you deploy the Scenario Creation Agent to Vercel with Supabase integration.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)
- OpenAI API key (optional, for AI features)

## Step 1: Set Up Supabase

1. Go to [Supabase](https://app.supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **SQL Editor** in your Supabase dashboard
4. Run the SQL script from `supabase/schema.sql` to create the necessary tables:
   ```sql
   -- Copy and paste the contents of supabase/schema.sql
   ```
5. Go to **Settings** → **API** and copy:
   - Project URL (for `VITE_SUPABASE_URL`)
   - Anon/Public key (for `VITE_SUPABASE_ANON_KEY`)

## Step 2: Push to GitHub

1. Create a new repository on GitHub (don't initialize with README)
2. Add the remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/scenario-creation-agent.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Add Environment Variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VITE_OPENAI_API_KEY` - Your OpenAI API key (optional)
6. Click **Deploy**

## Step 4: Verify Deployment

1. Once deployed, Vercel will provide you with a URL
2. Visit the URL and test the application
3. Upload your CSV and JSON files
4. Create a scenario to verify Supabase integration

## Environment Variables

### Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional
- `VITE_OPENAI_API_KEY` - OpenAI API key for AI features

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in `.env`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that RLS policies allow operations (see `supabase/schema.sql`)
- Ensure tables are created correctly

### Build Failures
- Check that all environment variables are set in Vercel
- Verify Node.js version compatibility (Vercel uses Node 18+ by default)

### Data Not Persisting
- Check Supabase dashboard for errors
- Verify RLS policies are set correctly
- Check browser console for error messages

## Security Notes

- The anon key is safe to expose in client-side code (it's designed for this)
- RLS policies control data access
- Consider implementing authentication for production use
- Never commit `.env` files to git
