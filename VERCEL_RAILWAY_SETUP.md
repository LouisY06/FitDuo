# Connecting Vercel to Railway

## Step 1: Get Your Vercel URL

1. Go to Vercel → Your Project
2. You'll see your deployment URL (e.g., `https://fitduo.vercel.app`)
3. **Copy this URL**

## Step 2: Update Railway CORS

1. Go to Railway → Your Service → **Variables** tab
2. Find `CORS_ORIGINS` variable
3. Click to **Edit**
4. Update the value to include your Vercel URL:
   ```
   http://localhost:5173,https://your-app.vercel.app
   ```
   (Replace `your-app.vercel.app` with your actual Vercel URL)
5. **Save** - Railway will auto-redeploy

## Step 3: Verify

After Railway redeploys:
1. Test your Vercel site
2. Try making an API call
3. Should work without CORS errors!

---

## Firebase Google Sign-In Error Fix

The error is likely because Firebase doesn't recognize your Vercel domain as an authorized domain.

### Fix: Add Vercel Domain to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fitduo-830b3**
3. Click ⚙️ → **Project Settings**
4. Scroll down to **"Authorized domains"** section
5. Click **"Add domain"**
6. Enter your Vercel domain: `your-app.vercel.app`
   - (Don't include `https://`, just the domain)
7. Click **"Add"**
8. **Save**

### Also Check:

1. **Authentication → Sign-in method**
   - Make sure **Google** is enabled
   - Check that **Authorized domains** includes your Vercel domain

2. **OAuth consent screen** (if using Google Cloud Console)
   - Add your Vercel URL to authorized redirect URIs

---

## Quick Checklist

- [ ] Got Vercel URL
- [ ] Updated Railway `CORS_ORIGINS` with Vercel URL
- [ ] Added Vercel domain to Firebase Authorized domains
- [ ] Verified Google sign-in is enabled in Firebase
- [ ] Tested login on Vercel site

---

## Common Firebase Errors

### "auth/unauthorized-domain"
- ✅ Add Vercel domain to Firebase Authorized domains (see above)

### "auth/operation-not-allowed"
- ✅ Enable Google sign-in in Firebase Console
- ✅ Go to Authentication → Sign-in method → Google → Enable

### "auth/popup-blocked"
- ✅ Check browser popup settings
- ✅ Make sure COOP headers are set (already done in vite.config.ts)

### CORS errors
- ✅ Update Railway `CORS_ORIGINS` with Vercel URL

