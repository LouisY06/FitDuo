# Fix Firebase Google Sign-In Error

## The Problem

When you click "Login with Google" on your Vercel site, you get a Firebase error. This is because Firebase doesn't recognize your Vercel domain as authorized.

## The Solution

### Step 1: Add Vercel Domain to Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fitduo-830b3**
3. Click ⚙️ (gear icon) → **Project Settings**
4. Scroll down to **"Authorized domains"** section
5. You'll see domains like:
   - `localhost`
   - `fitduo-830b3.firebaseapp.com`
   - `fitduo-830b3.web.app`
6. Click **"Add domain"** button
7. Enter your Vercel domain: `your-app.vercel.app`
   - **Important**: Don't include `https://`, just the domain name
   - Example: `fitduo.vercel.app` or `fitduo-abc123.vercel.app`
8. Click **"Add"**
9. The domain will appear in the list

### Step 2: Enable Google Sign-In (If Not Already)

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Find **Google** in the list
3. Click on it
4. Toggle **"Enable"** to ON
5. Enter your **Project support email** (your email)
6. Click **"Save"**

### Step 3: Verify OAuth Consent Screen (If Needed)

If you still get errors, check Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **fitduo-830b3**
3. Go to **APIs & Services** → **OAuth consent screen**
4. Under **"Authorized domains"**, make sure your Vercel domain is listed
5. Under **"Authorized redirect URIs"**, add:
   ```
   https://your-app.vercel.app
   ```

## Common Firebase Errors

### "auth/unauthorized-domain"
✅ **Fix**: Add Vercel domain to Firebase Authorized domains (Step 1 above)

### "auth/operation-not-allowed"
✅ **Fix**: Enable Google sign-in in Firebase (Step 2 above)

### "auth/popup-blocked"
✅ **Fix**: 
- Check browser popup settings
- Make sure you're not blocking popups
- COOP headers are already set in `vite.config.ts` ✅

### "auth/network-request-failed"
✅ **Fix**: 
- Check your internet connection
- Verify Firebase config in Vercel environment variables
- Make sure `VITE_API_URL` is set correctly

## Quick Checklist

- [ ] Added Vercel domain to Firebase Authorized domains
- [ ] Enabled Google sign-in in Firebase
- [ ] Verified OAuth consent screen (if needed)
- [ ] Updated Railway `CORS_ORIGINS` with Vercel URL
- [ ] Tested Google sign-in on Vercel site

## After Fixing

1. **Wait a few minutes** for Firebase to propagate changes
2. **Clear browser cache** or try incognito mode
3. **Test Google sign-in** on your Vercel site
4. Should work now! ✅

---

## Still Not Working?

### Check Browser Console

Open browser DevTools (F12) → Console tab, look for:
- Specific Firebase error codes
- Network errors
- CORS errors

### Verify Environment Variables in Vercel

Make sure all Firebase env vars are set in Vercel:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- etc.

### Test Locally First

Try Google sign-in on `localhost:5173` first:
- If it works locally → Firebase config is correct
- If it fails locally → Check Firebase Console settings
- If it works locally but not on Vercel → Domain authorization issue

