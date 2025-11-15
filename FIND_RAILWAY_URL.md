# How to Find Your Railway Backend URL

## Step-by-Step Guide

### Method 1: Railway Dashboard (Easiest)

1. **Go to Railway**: https://railway.app
2. **Login** to your account
3. **Click on your project** (the one with your backend)
4. **Click on your service** (the backend service, not the database)
5. **Click on the "Settings" tab** (gear icon or "Settings" in the menu)
6. **Scroll down to "Domains" section**
7. **You'll see your Railway URL** like:
   - `https://your-app-name.up.railway.app`
   - Or `https://your-app-name-production.up.railway.app`

**Copy this URL!** This is your backend URL.

---

### Method 2: From Service Overview

1. **Go to Railway** → Your Project
2. **Click on your backend service**
3. **Look at the top of the page** - you might see a URL or "View" button
4. **Or check the "Deployments" tab** - recent deployments show the URL

---

### Method 3: From Service Settings

1. **Railway** → Your Project → Your Service
2. **Settings** tab
3. **Look for:**
   - **"Public Domain"** section
   - **"Custom Domain"** section (if you set one up)
   - **"Domains"** section

---

## What the URL Looks Like

Railway URLs typically look like:
- `https://fitduo-production.up.railway.app`
- `https://fitduo-backend.up.railway.app`
- `https://your-app-name.up.railway.app`

**Important**: Make sure you're looking at the **backend service**, not the database service!

---

## Quick Visual Guide

```
Railway Dashboard
├── Projects
│   └── Your Project
│       ├── Services
│       │   ├── [Backend Service] ← Click this!
│       │   │   ├── Deployments
│       │   │   ├── Variables
│       │   │   ├── Settings ← Click here!
│       │   │   │   └── Domains ← Your URL is here!
│       │   │   ├── Metrics
│       │   │   └── Logs
│       │   └── PostgreSQL (database - not this one)
│       └── ...
```

---

## If You Don't See a URL

If you don't see a domain/URL:

1. **Check if the service is deployed**
   - Go to **Deployments** tab
   - Make sure there's a successful deployment

2. **Generate a domain** (if needed)
   - Railway should auto-generate one
   - If not, click **"Generate Domain"** or **"Add Domain"** button

3. **Check service is running**
   - Go to **Logs** tab
   - Make sure the service started successfully

---

## After You Find It

Once you have your Railway URL:

1. **Copy it** (e.g., `https://fitduo-production.up.railway.app`)
2. **Add to Vercel** as `VITE_API_URL`
3. **Update Railway CORS** to include your Vercel domain

---

## Test Your URL

After finding it, test it works:

```bash
curl https://your-backend.up.railway.app/health
```

Should return: `{"status":"healthy"}`

If you get an error, the service might not be running or the URL is wrong.

