# ⚠️ CRITICAL: Set CORS_ORIGINS in Railway

## The Problem

Railway is **NOT** reading your `CORS_ORIGINS` environment variable. The debug endpoint shows:
```json
{
  "cors_origins_env": "NOT SET"
}
```

This means Railway is using **default localhost origins only**, which is why your Vercel site is blocked.

## The Fix

### Step 1: Go to Railway Variables

1. Open Railway → Your Service
2. Click **"Variables"** tab
3. Look for `CORS_ORIGINS` variable

### Step 2: Add/Update CORS_ORIGINS

If it doesn't exist, click **"+ New Variable"**

Set the **Name**: `CORS_ORIGINS`

Set the **Value** (exactly as shown, no extra spaces):
```
http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app
```

**Important:**
- ✅ No spaces after commas
- ✅ Include `https://` for Vercel
- ✅ Use your exact Vercel domain
- ❌ No trailing comma
- ❌ No quotes around the value

### Step 3: Save and Wait

1. Click **"Save"** or **"Add"**
2. Railway will **auto-redeploy** (1-2 minutes)
3. Check Railway → **Deployments** → should show new deployment

### Step 4: Verify

After redeploy, test:
```bash
curl https://fitduo-production.up.railway.app/debug/cors
```

Should show:
```json
{
  "cors_origins_env": "http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app",
  "cors_origins": [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://fit-duo-ao7y.vercel.app"
  ]
}
```

### Step 5: Test Your Site

Once `cors_origins_env` shows your Vercel domain:
1. Refresh your Vercel site
2. Try matchmaking
3. CORS error should be gone! ✅

---

## Quick Checklist

- [ ] Railway → Variables → `CORS_ORIGINS` exists
- [ ] Value is: `http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app`
- [ ] No extra spaces or trailing commas
- [ ] Saved the variable
- [ ] Railway redeployed (check Deployments tab)
- [ ] `/debug/cors` shows your Vercel domain
- [ ] Tested on Vercel site - CORS works!

