#!/bin/bash

# Deployment Helper Script
# This script helps you deploy the Scenario Creation Agent

echo "🚀 Scenario Creation Agent - Deployment Helper"
echo "================================================"
echo ""

# Check if git remote exists
if git remote -v | grep -q "origin"; then
    echo "✅ Git remote already configured"
    git remote -v
else
    echo "📝 Step 1: Create a GitHub Repository"
    echo "--------------------------------------"
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: scenario-creation-agent"
    echo "3. Description: Professional scenario creation tool with AI"
    echo "4. Choose Public or Private"
    echo "5. DO NOT initialize with README, .gitignore, or license"
    echo "6. Click 'Create repository'"
    echo ""
    read -p "Press Enter after you've created the GitHub repository..."
    
    echo ""
    echo "📝 Enter your GitHub username:"
    read GITHUB_USERNAME
    
    if [ -z "$GITHUB_USERNAME" ]; then
        echo "❌ GitHub username is required"
        exit 1
    fi
    
    echo ""
    echo "🔗 Adding GitHub remote..."
    git remote add origin "https://github.com/${GITHUB_USERNAME}/scenario-creation-agent.git"
    git branch -M main
    
    echo "✅ Remote added successfully"
fi

echo ""
echo "📤 Step 2: Pushing to GitHub"
echo "----------------------------"
read -p "Ready to push to GitHub? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin main
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo "🔗 Repository URL: https://github.com/${GITHUB_USERNAME}/scenario-creation-agent"
    else
        echo "❌ Push failed. Please check your GitHub credentials and try again."
        exit 1
    fi
else
    echo "⏭️  Skipping push. You can run 'git push -u origin main' later."
fi

echo ""
echo "🎉 Next Steps:"
echo "=============="
echo "1. Set up Supabase:"
echo "   - Go to https://app.supabase.com"
echo "   - Create a new project"
echo "   - Run the SQL from supabase/schema.sql"
echo "   - Copy your Project URL and Anon Key"
echo ""
echo "2. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
