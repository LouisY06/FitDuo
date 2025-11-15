# Connecting Vercel Frontend to Railway Backend

## The Problem

On localhost, matchmaking works because:
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:8000`
- `VITE_API_URL=http://localhost:8000` in `.env.local` ✅

On Railway/Vercel, matchmaking doesn't work because:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.up.railway.app`
- `VITE_API_URL` not set in Vercel environment variables ❌

## The Fix

### Step 1: Get Your Railway Backend URL

1. Go to Railway → Your Service
2. Click **Settings** → **Domains**
3. Copy your Railway URL (e.g., `https://fitduo-production.up.railway.app`)

### Step 2: Add to Vercel Environment Variables

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Add/Edit `VITE_API_URL`:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.up.railway.app` (your Railway URL)
   - **Environment**: Production, Preview, Development (select all)
3. **Save**

### Step 3: Redeploy Vercel

After adding the environment variable:
1. Vercel will automatically redeploy
2. Or manually trigger a redeploy: **Deployments** → **Redeploy**

### Step 4: Verify

After redeploy:
1. Visit your Vercel site
2. Open browser console (F12)
3. Check: `import.meta.env.VITE_API_URL` should show your Railway URL
4. Try matchmaking - should work now!

---

## Quick Checklist

- [ ] Got Railway backend URL
- [ ] Added `VITE_API_URL` to Vercel environment variables
- [ ] Set for all environments (Production, Preview, Development)
- [ ] Vercel redeployed
- [ ] Tested matchmaking on Vercel site

---

## Common Issues

### "Failed to fetch" or Network errors
- ✅ Check `VITE_API_URL` is set correctly in Vercel
- ✅ Check Railway backend is running (test Railway URL directly)
- ✅ Check Railway CORS includes your Vercel domain

### CORS errors on Railway
- ✅ Update Railway `CORS_ORIGINS` to include your Vercel URL:
  ```
  http://localhost:5173,https://your-app.vercel.app
  ```

### Still using localhost URL
- ✅ Make sure you redeployed Vercel after adding env var
- ✅ Clear browser cache
- ✅ Check Vercel build logs to verify env var is included

---

## Environment Variables Summary

### Vercel (Frontend)
```
VITE_API_URL=https://your-backend.up.railway.app
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
(etc.)
```

### Railway (Backend)
```
ENVIRONMENT=production
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
FIREBASE_CREDENTIALS=...
DATABASE_URL=... (auto-provided)
```

---

## Test Connection

After setup, test in browser console on Vercel site:

```javascript
// Should show your Railway URL
console.log(import.meta.env.VITE_API_URL);

// Test backend connection
fetch(`${import.meta.env.VITE_API_URL}/health`)
  .then(r => r.json())
  .then(console.log);
```

Should return: `{status: "healthy"}`

