# 🚀 Start Deployment Here

## Quick Start (5 Steps)

### 1️⃣ Commit Your Code
```bash
git add .
git commit -m "Add deployment config for Railway and Vercel"
git push
```

### 2️⃣ Deploy Backend to Railway

**Go to**: https://railway.app

1. **Login** with GitHub
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Select **FitDuo** repository
4. Railway auto-detects Python - click **"Deploy"**
5. **Add PostgreSQL**: Click **"+ New"** → **"Database"** → **"PostgreSQL"**
6. **Set Environment Variables** (Service → Variables):
   - `ENVIRONMENT=production`
   - `CORS_ORIGINS=http://localhost:5173` (update after Vercel)
   - `FIREBASE_CREDENTIALS=<paste your Firebase service account JSON>`
   - `OPENROUTER_API_KEY=<your key>`
7. **Wait for deployment** (watch logs)
8. **Copy your Railway URL**: `https://your-app.up.railway.app`
9. **Run migrations**: Service → Shell → `alembic upgrade head`

### 3️⃣ Deploy Frontend to Vercel

**Go to**: https://vercel.com

1. **Login** with GitHub
2. **"Add New"** → **"Project"**
3. **Import** your FitDuo repository
4. **⚠️ CRITICAL**: Set **Root Directory** to `frontend`
5. **Environment Variables** (add these):
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   VITE_WS_URL=wss://your-railway-url.up.railway.app
   VITE_FIREBASE_API_KEY=<your key>
   VITE_FIREBASE_AUTH_DOMAIN=fitduo-830b3.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=fitduo-830b3
   VITE_FIREBASE_STORAGE_BUCKET=fitduo-830b3.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your id>
   VITE_FIREBASE_APP_ID=<your id>
   VITE_FIREBASE_MEASUREMENT_ID=<your id>
   ```
6. Click **"Deploy"**
7. **Copy your Vercel URL**: `https://your-app.vercel.app`

### 4️⃣ Connect Backend & Frontend

**Update Railway CORS:**
1. Go back to Railway → Your service → Variables
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
   ```
3. Railway auto-redeploys

**Update Firebase:**
1. Firebase Console → Authentication → Settings
2. **Authorized domains** → **Add domain**
3. Add: `your-app.vercel.app`

### 5️⃣ Test!

1. Visit your Vercel URL
2. Test login/signup
3. Test WebSocket (browser console):
   ```javascript
   const ws = new WebSocket('wss://your-railway-url.up.railway.app/ws/1?player_id=1');
   ws.onopen = () => console.log('✅ Connected!');
   ```

---

## ✅ You're Done!

Your app is live with full multiplayer support!

**Backend**: `https://your-app.up.railway.app`  
**Frontend**: `https://your-app.vercel.app`  
**WebSocket**: `wss://your-app.up.railway.app/ws/{game_id}`

---

## 📚 Need More Details?

- **Detailed guide**: See `DEPLOY_NOW.md`
- **Railway specific**: See `backend/RAILWAY_QUICKSTART.md`
- **Full checklist**: See `DEPLOYMENT_CHECKLIST.md`

