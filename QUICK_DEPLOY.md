# 🚀 Quick Deploy Guide

## Deploy in 10 Minutes

### Step 1: Commit & Push Code (Do this first!)

```bash
git add .
git commit -m "Add deployment configuration for Railway and Vercel"
git push
```

### Step 2: Deploy Backend to Railway

1. **Go to**: https://railway.app
2. **Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select** your FitDuo repo
5. **Add PostgreSQL**: Click "+ New" → "Database" → "PostgreSQL"
6. **Set Variables** (in your service → Variables):
   ```
   ENVIRONMENT=production
   CORS_ORIGINS=http://localhost:5173
   FIREBASE_CREDENTIALS=<your Firebase JSON>
   OPENROUTER_API_KEY=<your key>
   ```
7. **Wait for deploy** - Railway auto-detects Python
8. **Get your URL**: `https://your-app.up.railway.app`
9. **Run migrations**: Use Railway Shell tab → `alembic upgrade head`

### Step 3: Deploy Frontend to Vercel

1. **Go to**: https://vercel.com
2. **Login** with GitHub
3. **Add New** → **Project** → **Import** your repo
4. **Set Root Directory**: `frontend` ⚠️ **IMPORTANT!**
5. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app
   VITE_WS_URL=wss://your-railway-app.up.railway.app
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=fitduo-830b3.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=fitduo-830b3
   VITE_FIREBASE_STORAGE_BUCKET=fitduo-830b3.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
6. **Deploy** - Vercel auto-builds
7. **Get your URL**: `https://your-app.vercel.app`

### Step 4: Connect Them

1. **Update Railway CORS**: Add your Vercel URL to `CORS_ORIGINS`
2. **Update Firebase**: Add Vercel domain to authorized domains
3. **Test**: Visit your Vercel URL!

---

## ✅ Multiplayer Works!

Railway supports WebSockets natively - your multiplayer will work perfectly!

**WebSocket URL**: `wss://your-railway-app.up.railway.app/ws/{game_id}`

---

## Need Help?

See `DEPLOY_NOW.md` for detailed step-by-step instructions.

