# Deployment Guide

## Railway (Backend) + Vercel (Frontend)

This guide walks you through deploying FitDuo to production.

## Architecture

- **Backend**: Railway (supports WebSockets for multiplayer)
- **Frontend**: Vercel (static hosting)
- **Database**: Railway PostgreSQL (or SQLite for dev)

## Prerequisites

1. Railway account: https://railway.app
2. Vercel account: https://vercel.com
3. GitHub repository (recommended)

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or "Empty Project")
4. Connect your repository

### Step 2: Add PostgreSQL Database

1. In Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL instance
4. Note the connection string (you'll need this)

### Step 3: Configure Environment Variables

In Railway, go to your service → Variables tab, add:

```env
# Environment
ENVIRONMENT=production

# Database (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS - Add your Vercel domain here
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

# Firebase Admin SDK
FIREBASE_CREDENTIALS=<paste your Firebase service account JSON here>
# OR use Railway's file storage for the JSON file

# OpenRouter API (for LLM features)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

### Step 4: Deploy

1. Railway will auto-detect Python and deploy
2. It will run: `pip install -r requirements.txt`
3. Then start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Railway assigns a domain like: `your-app.up.railway.app`

### Step 5: Run Database Migrations

After first deployment, run migrations:

1. In Railway, go to your service
2. Click "Deployments" → Latest deployment
3. Click "View Logs"
4. Or use Railway CLI:
   ```bash
   railway run alembic upgrade head
   ```

### Step 6: Get Your Backend URL

Railway will provide a URL like: `https://your-app.up.railway.app`

**Important**: Railway WebSocket URLs use `wss://` (secure WebSocket)

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `frontend` folder as root directory

### Step 2: Configure Build Settings

Vercel should auto-detect Vite. If not:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```env
# Backend API URL (your Railway URL)
VITE_API_URL=https://your-app.up.railway.app

# WebSocket URL (same as API URL, but Railway handles wss://)
VITE_WS_URL=wss://your-app.up.railway.app

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=fitduo-830b3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitduo-830b3
VITE_FIREBASE_STORAGE_BUCKET=fitduo-830b3.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. You'll get a URL like: `https://your-app.vercel.app`

### Step 5: Update Backend CORS

Go back to Railway and update CORS_ORIGINS:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

Redeploy the backend for CORS changes to take effect.

---

## Part 3: Update Firebase Configuration

### Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `your-app.vercel.app`
   - `your-custom-domain.com`
   - Any other domains you use

### Firebase Hosting (Optional)

If you want to use Firebase Hosting instead of Vercel, that's also possible.

---

## Part 4: WebSocket Configuration

### Railway WebSocket Support

✅ **Railway fully supports WebSockets** - no special configuration needed!

Your WebSocket endpoint will be:
```
wss://your-app.up.railway.app/ws/{game_id}?player_id={player_id}
```

### Frontend WebSocket Connection

The frontend WebSocket service (`services/websocket.ts`) automatically:
- Uses `wss://` for production (secure WebSocket)
- Uses `ws://` for development
- Connects to the Railway backend URL

---

## Part 5: Custom Domain (Optional)

### Railway Custom Domain

1. In Railway project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update CORS_ORIGINS with your custom domain

### Vercel Custom Domain

1. In Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records
4. Update Firebase authorized domains

---

## Environment Variables Summary

### Railway (Backend)

```env
ENVIRONMENT=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGINS=https://your-app.vercel.app
FIREBASE_CREDENTIALS=<JSON or file path>
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

### Vercel (Frontend)

```env
VITE_API_URL=https://your-app.up.railway.app
VITE_WS_URL=wss://your-app.up.railway.app
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

---

## Testing Deployment

### 1. Test Backend Health

```bash
curl https://your-app.up.railway.app/health
```

### 2. Test WebSocket Connection

```javascript
// In browser console on your Vercel site
const ws = new WebSocket('wss://your-app.up.railway.app/ws/1?player_id=1');
ws.onopen = () => console.log('✅ Connected!');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
```

### 3. Test API Endpoints

```bash
curl https://your-app.up.railway.app/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### WebSocket Connection Issues

- ✅ Railway supports WebSockets natively
- ✅ Use `wss://` (secure) in production
- ✅ Check CORS settings allow your frontend domain
- ✅ Verify WebSocket endpoint path: `/ws/{game_id}`

### CORS Errors

- Update `CORS_ORIGINS` in Railway with your Vercel domain
- Include both `https://` and `http://` if testing locally
- Redeploy backend after CORS changes

### Database Connection

- Railway PostgreSQL: Connection string is auto-provided
- If using SQLite: Not recommended for production
- Run migrations: `railway run alembic upgrade head`

### Environment Variables Not Working

- Vercel: Rebuild after adding env vars
- Railway: Redeploy after adding env vars
- Check variable names match exactly (case-sensitive)

---

## Production Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created
- [ ] Database migrations run
- [ ] Environment variables set in Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] CORS configured with Vercel domain
- [ ] Firebase authorized domains updated
- [ ] WebSocket connection tested
- [ ] API endpoints tested
- [ ] Custom domains configured (if using)

---

## Cost Estimates

### Railway
- **Hobby Plan**: $5/month (includes PostgreSQL)
- **Pro Plan**: $20/month (better performance)

### Vercel
- **Hobby Plan**: Free (good for most projects)
- **Pro Plan**: $20/month (team features)

**Total**: ~$5-25/month depending on plan

---

## Next Steps

1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Test multiplayer WebSocket connections
4. Monitor logs for any issues
5. Set up custom domains if desired

