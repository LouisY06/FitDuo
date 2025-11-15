# Fix Railway CORS for Vercel

## The Problem

Your Vercel frontend (`https://fit-duo-ao7y.vercel.app`) is being blocked by Railway CORS because the Vercel domain isn't in the allowed origins list.

## The Fix

### Step 1: Update Railway CORS_ORIGINS

1. Go to **Railway** → Your Service → **Variables** tab
2. Find `CORS_ORIGINS` variable
3. Click to **Edit**
4. Update the value to include your Vercel URL:
   ```
   http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app
   ```
   (Replace `fit-duo-ao7y.vercel.app` with your actual Vercel domain if different)
5. **Save** - Railway will auto-redeploy

### Step 2: Wait for Redeploy

- Railway will automatically redeploy after saving
- Wait 1-2 minutes for the deployment to complete
- Check Railway **Logs** to confirm it restarted

### Step 3: Test Again

After Railway redeploys:
1. Refresh your Vercel site
2. Try matchmaking again
3. Should work now! ✅

---

## Current CORS_ORIGINS Should Be:

```
http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app
```

This allows:
- ✅ Local development (ports 5173, 5174)
- ✅ Production Vercel site

---

## Also Notice: Double Slash in URL

I see: `https://fitduo-production.up.railway.app//api/auth/me`

There's a double slash (`//`). This might be a code issue. Let me check and fix that too.

---

## Quick Checklist

- [ ] Added Vercel URL to Railway `CORS_ORIGINS`
- [ ] Railway redeployed (check logs)
- [ ] Tested on Vercel site
- [ ] CORS errors should be gone

