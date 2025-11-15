# Test CORS Configuration

## Step 1: Check What Railway Actually Has

Test the debug endpoint to see what CORS origins are configured:

```bash
curl https://fitduo-production.up.railway.app/debug/cors
```

This will show you exactly what CORS origins Railway is using.

## Step 2: Test CORS Preflight

Test if CORS is working from your Vercel domain:

```bash
curl -X OPTIONS https://fitduo-production.up.railway.app/api/auth/me \
  -H "Origin: https://fit-duo-ao7y.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v
```

Look for these headers in the response:
- `access-control-allow-origin: https://fit-duo-ao7y.vercel.app`
- `access-control-allow-methods: *`
- `access-control-allow-credentials: true`

## Step 3: Check Railway Logs

1. Go to Railway → Your Service → **Logs**
2. Look for startup messages
3. Check if there are any errors about CORS_ORIGINS
4. Look for the server starting message

## Step 4: Verify Environment Variable

1. Railway → Your Service → **Variables**
2. Check `CORS_ORIGINS` value
3. Should be exactly (no extra spaces):
   ```
   http://localhost:5173,http://localhost:5174,https://fit-duo-ao7y.vercel.app
   ```

## Step 5: Force Redeploy

If Railway didn't redeploy automatically:

1. Railway → Your Service → **Settings**
2. Click **"Redeploy"** button
3. Or make a small code change and push to trigger redeploy

## Common Issues

### Issue: Railway Didn't Redeploy
**Solution**: Manually trigger redeploy or push a code change

### Issue: Wrong Format
**Solution**: Make sure CORS_ORIGINS is comma-separated, no spaces after commas

### Issue: Backend Not Running
**Solution**: Check Railway logs for errors

### Issue: Cached Response
**Solution**: Hard refresh browser (Cmd+Shift+R)

