# Railway Quick Start Guide

## Step-by-Step Deployment

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub (recommended)

### 2. Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your FitDuo repository
4. Select the `backend` folder as root directory

### 3. Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically creates a PostgreSQL instance
4. The `DATABASE_URL` is automatically set as an environment variable

### 4. Set Environment Variables
Go to your service → Variables tab, add:

```env
ENVIRONMENT=production
CORS_ORIGINS=https://your-app.vercel.app
FIREBASE_CREDENTIALS=<paste your Firebase service account JSON>
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

**Note**: `DATABASE_URL` is automatically provided by Railway's PostgreSQL service.

### 5. Deploy
Railway will automatically:
- Detect Python
- Install dependencies from `requirements.txt`
- Run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 6. Run Migrations
After first deployment:

**Option A: Railway CLI**
```bash
railway login
railway link
railway run alembic upgrade head
```

**Option B: Railway Dashboard**
1. Go to your service
2. Click "Deployments" → Latest
3. Click "View Logs"
4. Or use the "Shell" tab to run commands

### 7. Get Your Backend URL
Railway provides a URL like: `https://your-app.up.railway.app`

**WebSocket URL**: `wss://your-app.up.railway.app/ws/{game_id}`

---

## Vercel Quick Start

### 1. Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

### 2. Import Project
1. Click "Add New" → "Project"
2. Import your GitHub repository
3. **Important**: Set root directory to `frontend`

### 3. Configure Build
Vercel should auto-detect Vite. Settings:
- Framework: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### 4. Set Environment Variables
In Vercel project → Settings → Environment Variables:

```env
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

### 5. Deploy
Click "Deploy" - Vercel will build and deploy automatically.

### 6. Update Backend CORS
Go back to Railway and update `CORS_ORIGINS` with your Vercel URL:
```env
CORS_ORIGINS=https://your-app.vercel.app
```

Redeploy backend for changes to take effect.

---

## Testing Multiplayer

After deployment, test WebSocket:

```javascript
// In browser console on your Vercel site
const ws = new WebSocket('wss://your-app.up.railway.app/ws/1?player_id=1');
ws.onopen = () => console.log('✅ Connected!');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
```

✅ **Multiplayer works!** Railway fully supports WebSocket connections.

---

## Troubleshooting

### WebSocket not connecting?
- Check CORS settings include your Vercel domain
- Verify WebSocket URL uses `wss://` (secure) in production
- Check Railway logs for connection errors

### Database errors?
- Run migrations: `railway run alembic upgrade head`
- Verify `DATABASE_URL` is set (Railway auto-sets this)
- Check PostgreSQL service is running in Railway

### CORS errors?
- Update `CORS_ORIGINS` in Railway with your Vercel domain
- Include protocol: `https://your-app.vercel.app`
- Redeploy backend after CORS changes

