# Fix Railway Build Error

## Problem
Railway is detecting the root directory (which has both `backend/` and `frontend/`), so it doesn't know what to build.

## Solution: Set Service Root Directory

### Option 1: Railway Dashboard (Easiest)

1. **Go to your Railway project**
2. **Click on your service** (the backend service)
3. **Go to Settings tab**
4. **Find "Root Directory"** setting
5. **Set it to**: `backend`
6. **Save**
7. **Redeploy** (Railway will auto-redeploy)

### Option 2: Railway Service Configuration

If you're creating a new service:

1. When adding a service, select **"Empty Service"**
2. Then connect it to your GitHub repo
3. **In service settings**, set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Option 3: Use Railway CLI

```bash
railway service
# Select your service
railway variables set RAILWAY_SERVICE_ROOT=backend
```

---

## Quick Fix Steps

1. **Railway Dashboard** → Your Service → **Settings**
2. **Root Directory** → Set to `backend`
3. **Save** → Railway auto-redeploys
4. **Watch logs** → Should see Python build now

---

## Verify It's Working

After setting root directory, you should see in logs:
- ✅ Python detected
- ✅ Installing from requirements.txt
- ✅ Starting uvicorn

Instead of:
- ❌ "Railpack could not determine how to build"

---

## Alternative: Separate Repos

If you want to keep them separate:
- Backend repo → Deploy to Railway
- Frontend repo → Deploy to Vercel

But setting root directory is easier!

