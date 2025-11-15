# Check Vercel Environment Variable

## The Problem

Even after fixing the code, the double slash persists. This suggests the **Vercel environment variable itself** might have a trailing slash.

## Check Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Find `VITE_BACKEND_URL` (or `VITE_API_URL`)
4. Check the **Value** - does it end with a `/`?

### If it has a trailing slash:

**Current (WRONG):**
```
https://fitduo-production.up.railway.app/
```

**Should be (CORRECT):**
```
https://fitduo-production.up.railway.app
```

## Fix Steps

1. **Edit the environment variable:**
   - Click on `VITE_BACKEND_URL`
   - Remove the trailing `/` if present
   - Save

2. **Redeploy:**
   - Vercel will auto-redeploy after saving
   - OR manually trigger: Deployments → Redeploy

3. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or use incognito/private window

## Why This Happens

Even though our code normalizes URLs, if the environment variable itself has a trailing slash:
- `VITE_BACKEND_URL = "https://fitduo-production.up.railway.app/"`
- Code: `${baseUrl}/api/auth/me`
- Result: `https://fitduo-production.up.railway.app//api/auth/me` ❌

Our normalization should catch this, but let's make sure the env var is correct.

