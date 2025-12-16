# 🔧 Fix GitHub Push Error

If you're getting HTTP 400 errors when pushing, try these solutions:

## Solution 1: Increase Git Buffer (Already Done)

```bash
git config http.postBuffer 524288000
git config http.version HTTP/1.1
```

## Solution 2: Try Pushing Again

```bash
git push -u origin main
```

## Solution 3: Use SSH Instead of HTTPS

If HTTPS continues to fail, switch to SSH:

```bash
# Change remote to SSH
git remote set-url origin git@github.com:mariokbn/scenario-creation-agent.git

# Push
git push -u origin main
```

**Note**: You'll need SSH keys set up. If you don't have them:
```bash
# Generate SSH key (if needed)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
cat ~/.ssh/id_ed25519.pub
```

## Solution 4: Push in Smaller Chunks

If the repository is still too large:

```bash
# Push without tags first
git push -u origin main --no-tags

# Or push specific commits
git push origin HEAD:main
```

## Solution 5: Create Fresh Repository (Last Resort)

If nothing works, create a fresh start:

```bash
# Backup your code
cp -r . ../scenario-creation-agent-backup

# Remove git history
rm -rf .git

# Reinitialize
git init
git add .
git commit -m "Initial commit - cleaned repository"

# Add remote
git remote add origin https://github.com/mariokbn/scenario-creation-agent.git
git branch -M main

# Force push (since repo is empty)
git push -u origin main --force
```

## Solution 6: Use GitHub CLI

If you have GitHub CLI installed:

```bash
gh auth login
git push -u origin main
```

## Most Likely Solution

The HTTP 400 error is often due to authentication. Try:

1. **Use Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Use token as password when pushing

2. **Or use SSH** (Solution 3 above)

Try Solution 1 first (already configured), then Solution 2. If that doesn't work, try Solution 3 (SSH).
