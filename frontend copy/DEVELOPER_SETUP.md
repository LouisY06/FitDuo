# Developer Setup Guide

This guide helps new developers (including frontend developers) set up the project.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FitDuo/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Then edit .env.local with your Firebase credentials
   # (See "Getting Firebase Credentials" below)
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

## Getting Firebase Credentials

### Option 1: Get from Team Lead/Project Owner

Ask the project owner to share the Firebase credentials. They can:
- Share the values directly (Firebase web app config is safe to share)
- Or give you access to the Firebase Console

### Option 2: Get from Firebase Console (if you have access)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fitduo-830b3**
3. Click ⚙️ (gear icon) > **Project Settings**
4. Scroll to **Your apps** section
5. Click on the web app (or create one if it doesn't exist)
6. Copy the config values

### Option 3: Use Existing Credentials (if shared)

If credentials are shared via:
- Password manager (1Password, LastPass, etc.)
- Team chat (Slack, Discord, etc.)
- Secure document sharing

Copy them into your `.env.local` file.

## Environment Variables Needed

Your `.env.local` file should look like this:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...your-actual-key
VITE_FIREBASE_AUTH_DOMAIN=fitduo-830b3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitduo-830b3
VITE_FIREBASE_STORAGE_BUCKET=fitduo-830b3.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Verifying Setup

After setting up `.env.local`:

1. **Restart the dev server** (important!)
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check the browser console**
   - You should see: `✅ Firebase initialized successfully`
   - If you see warnings about missing variables, check your `.env.local` file

3. **Test login**
   - Try signing up with a test email
   - Or use Google sign-in

## Troubleshooting

### "Missing required Firebase environment variables"
- Make sure `.env.local` exists in the `frontend/` directory
- Check that all variables start with `VITE_`
- Restart the dev server after creating/editing `.env.local`

### "Firebase: Error (auth/api-key-not-valid)"
- Verify you copied the correct API key
- Make sure there are no extra spaces or quotes
- Check that the project ID matches: `fitduo-830b3`

### "Cannot connect to backend"
- Make sure backend is running: `cd ../backend && uvicorn app.main:app --reload`
- Check `VITE_API_URL` in `.env.local` matches backend URL

## Security Note

⚠️ **Important**: 
- `.env.local` is gitignored (not committed to repo)
- Firebase web app config is **safe to share** with team members
- These are public-facing credentials (they appear in client-side code)
- Never commit `.env.local` to git
- Never share Firebase Admin SDK credentials (backend only)

## Need Help?

If you're stuck:
1. Check `FIREBASE_SETUP.md` for detailed Firebase setup
2. Ask the team lead for Firebase credentials
3. Verify your `.env.local` file format matches `.env.example`

