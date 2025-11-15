# Deploy Now - Step by Step

## 🚀 Quick Deployment Guide

### Part 1: Deploy Backend to Railway

#### Step 1: Create Railway Project (Web Interface)

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** (use GitHub for easiest setup)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your FitDuo repository**
6. **Railway will detect it's a Python project**

#### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway creates the database automatically
4. **Note**: `DATABASE_URL` is automatically set as an environment variable

#### Step 3: Set Environment Variables

In your Railway service → **Variables** tab, click **"+ New Variable"** and add:

```env
ENVIRONMENT=production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FIREBASE_CREDENTIALS=<paste your Firebase service account JSON here>
OPENROUTER_API_KEY=your-openrouter-key-here
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

**Important**: 
- `DATABASE_URL` is auto-provided by Railway PostgreSQL
- `CORS_ORIGINS` - we'll update this after Vercel deployment with your Vercel URL

#### Step 4: Configure Service

1. Railway should auto-detect Python
2. **Root Directory**: Should be `backend` (or leave blank if repo root is backend)
3. **Build Command**: `pip install -r requirements.txt` (auto-detected)
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (auto-detected)

#### Step 5: Deploy

1. Railway will automatically start deploying
2. Watch the logs to see the build progress
3. Once deployed, Railway gives you a URL like: `https://your-app.up.railway.app`

#### Step 6: Run Database Migrations

**Option A: Railway Dashboard**
1. Go to your service → **Deployments** → Latest deployment
2. Click **"View Logs"** or use **"Shell"** tab
3. Run: `alembic upgrade head`

**Option B: Railway CLI** (if installed)
```bash
railway login
railway link
railway run alembic upgrade head
```

#### Step 7: Test Backend

```bash
curl https://your-app.up.railway.app/health
```

Should return: `{"status":"healthy"}`

**Save your Railway URL!** You'll need it for Vercel.

---

### Part 2: Deploy Frontend to Vercel

#### Step 1: Create Vercel Project

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** (use GitHub)
3. **Click "Add New"** → **"Project"**
4. **Import your GitHub repository**
5. **Select the FitDuo repository**

#### Step 2: Configure Project

**Important Settings:**
- **Framework Preset**: Vite (should auto-detect)
- **Root Directory**: `frontend` ⚠️ **CRITICAL - Set this!**
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

#### Step 3: Set Environment Variables

Before deploying, click **"Environment Variables"** and add:

```env
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_WS_URL=wss://your-railway-app.up.railway.app
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=fitduo-830b3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitduo-830b3
VITE_FIREBASE_STORAGE_BUCKET=fitduo-830b3.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Replace** `your-railway-app.up.railway.app` with your actual Railway URL!

#### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy
3. You'll get a URL like: `https://your-app.vercel.app`

#### Step 5: Update Backend CORS

Go back to Railway:
1. Go to your service → **Variables**
2. Update `CORS_ORIGINS`:
   ```env
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
   ```
3. **Redeploy** the backend (Railway auto-redeploys when env vars change)

#### Step 6: Update Firebase

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Click **"Add domain"**
4. Add: `your-app.vercel.app`
5. Save

---

### Part 3: Test Everything

#### Test Backend
```bash
curl https://your-railway-app.up.railway.app/health
```

#### Test Frontend
1. Visit: `https://your-app.vercel.app`
2. Should load without errors
3. Try logging in

#### Test WebSocket (Multiplayer)
Open browser console on your Vercel site:
```javascript
const ws = new WebSocket('wss://your-railway-app.up.railway.app/ws/1?player_id=1');
ws.onopen = () => console.log('✅ WebSocket Connected!');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
```

---

## 🆘 Troubleshooting

### Backend won't start?
- Check Railway logs
- Verify all environment variables are set
- Make sure `DATABASE_URL` is provided (Railway auto-sets this)

### Frontend build fails?
- Check Vercel build logs
- Verify all `VITE_*` environment variables are set
- Make sure root directory is set to `frontend`

### CORS errors?
- Update `CORS_ORIGINS` in Railway with your Vercel URL
- Include `https://` protocol
- Redeploy backend

### WebSocket not connecting?
- Use `wss://` (secure) in production
- Check Railway logs for connection errors
- Verify CORS includes your Vercel domain

---

## 📝 Quick Reference

**Railway Backend URL**: `https://your-app.up.railway.app`  
**Vercel Frontend URL**: `https://your-app.vercel.app`  
**WebSocket URL**: `wss://your-app.up.railway.app/ws/{game_id}`

---

## ✅ Deployment Complete Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created
- [ ] Environment variables set in Railway
- [ ] Database migrations run
- [ ] Backend health check works
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel (including Railway URL)
- [ ] Frontend loads without errors
- [ ] CORS updated in Railway with Vercel URL
- [ ] Firebase authorized domains updated
- [ ] WebSocket connection tested
- [ ] Login/signup tested

---

**Ready to deploy?** Follow the steps above! 🚀

