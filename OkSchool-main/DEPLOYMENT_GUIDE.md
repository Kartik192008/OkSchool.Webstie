# OkSchool Deployment Guide (Netlify)

## Prerequisites
- GitHub repository: https://github.com/Kartik192008/OkSchool.git
- Supabase project (already configured)
- Netlify account (free tier available)

## Step 1: Deploy Frontend to Netlify

### 1.1 Connect GitHub to Netlify
1. Go to https://netlify.com
2. Sign up/login with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository: `Kartik192008/OkSchool`

### 1.2 Configure Build Settings
Netlify will auto-detect the `netlify.toml` file with these settings:
- **Build command**: `cd artifacts/okschool && pnpm install && pnpm build`
- **Publish directory**: `artifacts/okschool/dist`

### 1.3 Add Environment Variables
Add these in Netlify site settings → Environment Variables:

```
VITE_SUPABASE_URL = https://revrmdtnffgnmnqytedr.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldnJtZHRuZmZnbm1ucXl0ZWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDYyOTYsImV4cCI6MjA5ODM4MjI5Nn0.d_cw9bytgHl9BvN-SSASb6IJDuuliJg6kNOGUyxS_II
VITE_API_TARGET = https://your-backend-url.netlify.app
```

### 1.4 Deploy
1. Click "Deploy site"
2. Wait for deployment to complete
3. Copy the frontend URL (e.g., `https://okschool.netlify.app`)

## Step 2: Deploy Backend to Netlify

### 2.1 Create New Netlify Site
1. Click "Add new site" → "Import an existing project"
2. Select same GitHub repository
3. **Base directory**: `artifacts/api-server`

### 2.2 Configure Backend Build
1. **Build command**: `pnpm install && pnpm build`
2. **Publish directory**: `dist`
3. **Functions directory**: `netlify/functions`

### 2.3 Create Netlify Function
Create `artifacts/api-server/netlify/functions/api.js`:

```javascript
const { createServer } = require('http');
const app = require('../dist/index.js');

module.exports.handler = async (req, context) => {
  // Netlify function handler for backend
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Backend API' })
  };
};
```

### 2.4 Add Environment Variables
Add these in Netlify site settings → Environment Variables:

```
DATABASE_URL = postgresql://postgres:K19112008k%40123@db.revrmdtnffgnmnqytedr.supabase.co:5432/postgres
PORT = 8080
```

### 2.5 Alternative: Use Railway for Backend
Netlify is better for static sites. For backend, use Railway:

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. **Root directory**: `artifacts/api-server`
5. Add environment variables:
   ```
   DATABASE_URL = postgresql://postgres:K19112008k%40123@db.revrmdtnffgnmnqytedr.supabase.co:5432/postgres
   PORT = 8080
   ```
6. Deploy and copy the Railway URL

## Step 3: Update Frontend Environment Variable

1. Go to Netlify frontend site settings
2. Update `VITE_API_TARGET` with your actual backend URL (Railway or Netlify)
3. Redeploy frontend

## Step 4: Configure Supabase Auth Redirect

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your frontend URL to:
   - Site URL: `https://okschool.netlify.app`
   - Redirect URLs: `https://okschool.netlify.app/login`

## Step 5: Test Live Deployment

1. Visit your frontend URL
2. Test Google sign-in
3. Test document uploads
4. Test mock test creation
5. Verify all features work

## Step 6: Update GitHub with Live URLs

After successful deployment, update your README.md with:
- Frontend URL
- Backend URL
- Deployment instructions

## Future Updates

To make live changes:
1. Make code changes locally
2. Test locally
3. Commit and push to GitHub
4. Netlify will auto-deploy on push
5. Changes go live automatically

## Important Notes

- Database is already live on Supabase (no changes needed)
- Google OAuth is configured (just update redirect URLs)
- Environment variables are managed in Netlify
- Frontend will auto-deploy on git push
- For backend, Railway is recommended over Netlify functions
- Monitor Netlify dashboard for deployment status
