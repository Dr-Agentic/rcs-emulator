# RCS Emulator SaaS - Deployment Guide

## 🚀 Quick Deploy to Render (FREE)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/rcs-emulator-saas.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up for free account
3. Click "New Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `rcs-emulator-saas`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

### Step 3: Add Custom Domain
1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain (e.g., `rcs.yourdomain.com`)
4. Update your DNS:
   - **Type**: CNAME
   - **Name**: rcs (or whatever subdomain)
   - **Value**: your-app-name.onrender.com

## 🌐 Alternative: Railway (Free $5 Credit)

### Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up and connect GitHub
3. Click "Deploy from GitHub"
4. Select your repository
5. Railway auto-detects Node.js and deploys

### Add Custom Domain
1. Go to project settings
2. Click "Domains"
3. Add custom domain
4. Update DNS as instructed

## 📋 Environment Variables (Optional)
- `NODE_ENV=production`
- `PORT` (automatically set by hosting platforms)

## 🔧 Files Ready for Deployment
- ✅ `package.json` - Node.js configuration
- ✅ `server.js` - Production-ready server
- ✅ All static files (HTML, CSS, JS)
- ✅ Environment variable support

## 🎯 Post-Deployment
1. Test your live URL
2. Update API endpoints if needed
3. Configure custom domain DNS
4. Share your RCS Emulator SaaS!

## 💡 Tips
- Render free tier sleeps after 15 min inactivity
- Railway gives $5 free credit monthly
- Both support automatic HTTPS
- Both support custom domains for free
