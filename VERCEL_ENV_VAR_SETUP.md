# Setting VITE_API_URL in Vercel

## The Problem

Your built frontend on Vercel is trying to connect to `localhost:8000` because `VITE_API_URL` isn't set in Vercel environment variables.

## The Fix

### Step 1: Get Your Railway Backend URL

1. Go to **Railway** → Your Service → **Settings** → **Domains**
2. Copy your Railway URL (e.g., `https://fitduo-production.up.railway.app`)

### Step 2: Add to Vercel

1. Go to **Vercel** → Your Project
2. Click **Settings** → **Environment Variables**
3. Click **"+ Add New"**
4. Fill in:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.up.railway.app` (your Railway URL)
   - **Environment**: Select all:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
5. Click **Save**

### Step 3: Redeploy

After adding the environment variable:
- Vercel will **automatically redeploy** your site
- Or manually: **Deployments** → Click **"..."** → **Redeploy**

### Step 4: Verify

After redeploy, test your Vercel site:
1. Open browser console (F12)
2. Run: `console.log(import.meta.env.VITE_API_URL)`
3. Should show your Railway URL, **not** `localhost:8000`

---

## Important Notes

### Why This Happens

- Vite environment variables are **baked into the build** at build time
- If `VITE_API_URL` isn't set in Vercel, it uses the default: `http://localhost:8000`
- This is why it works locally (you have `.env.local`) but not on Vercel

### After Adding the Variable

- **Must redeploy** for changes to take effect
- The new build will include the Railway URL
- Old deployments will still use `localhost:8000` until redeployed

---

## Quick Checklist

- [ ] Got Railway backend URL
- [ ] Added `VITE_API_URL` to Vercel
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Saved the variable
- [ ] Vercel redeployed (automatic or manual)
- [ ] Tested on Vercel site - should connect to Railway now

---

## Test It

After redeploy, your Vercel site should:
- ✅ Connect to Railway backend
- ✅ Matchmaking should work
- ✅ No more `ERR_CONNECTION_REFUSED` errors

