# Debugging CORS Issues

## Check These Things

### 1. Did Railway Actually Redeploy?

1. Go to Railway → Your Service → **Deployments** tab
2. Check if there's a **new deployment** after you saved CORS_ORIGINS
3. Look at the **timestamp** - should be recent (within last few minutes)
4. Check **Logs** - should show server restarting

**If no new deployment:**
- Try manually triggering: Click **"Redeploy"** button
- Or make a small change to trigger redeploy

### 2. Verify CORS_ORIGINS is Set Correctly

1. Railway → Your Service → **Variables** tab
2. Check `CORS_ORIGINS` value
3. Should be exactly:
   ```
   http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app
   ```
4. **No spaces** after commas (or minimal spaces)
5. **No trailing commas**

### 3. Test Railway Backend Directly

Test if Railway backend is accessible:

```bash
curl https://fitduo-production.up.railway.app/health
```

Should return: `{"status":"healthy"}`

### 4. Check Railway Logs

1. Railway → Your Service → **Logs** tab
2. Look for:
   - Server starting messages
   - Any CORS-related errors
   - Recent restart messages

### 5. Test CORS Headers

In browser console on Vercel site, run:

```javascript
fetch('https://fitduo-production.up.railway.app/health', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://fit-duo-ao7y.vercel.app',
    'Access-Control-Request-Method': 'GET'
  }
}).then(r => {
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
    status: r.status
  });
});
```

Should show your Vercel domain in `Access-Control-Allow-Origin`.

---

## Common Issues

### Issue 1: Railway Didn't Redeploy
**Fix**: Manually trigger redeploy or make a code change

### Issue 2: CORS_ORIGINS Has Wrong Format
**Fix**: Check for:
- Extra spaces
- Trailing commas
- Missing `https://` prefix
- Wrong domain name

### Issue 3: Backend Not Running
**Fix**: Check Railway logs - service might have crashed

### Issue 4: Cached Response
**Fix**: 
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Try incognito mode

---

## Quick Test

After updating CORS, test in browser console:

```javascript
// Should work without CORS error
fetch('https://fitduo-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If you still get CORS error, Railway hasn't picked up the change yet.

