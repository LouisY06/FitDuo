# Firebase Auth Setup Guide

Firebase Auth has been integrated into the frontend. Follow these steps to complete the setup:

## 1. Get Firebase Web App Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **fitduo-830b3**
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select **Project Settings**
5. Scroll down to **Your apps** section
6. If you don't have a web app yet, click **Add app** > **Web** (</> icon)
7. Register your app (you can name it "FitDuo Web")
8. Copy the Firebase configuration object

## 2. Create Environment File

Create a file called `.env.local` in the `frontend/` directory:

```bash
cd frontend
touch .env.local
```

Add your Firebase config to `.env.local`:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=fitduo-830b3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitduo-830b3
VITE_FIREBASE_STORAGE_BUCKET=fitduo-830b3.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
VITE_FIREBASE_APP_ID=your-app-id-here
```

Replace the placeholder values with your actual Firebase web app config values.

## 3. Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. (Optional) Enable other sign-in methods you want to support

## 4. Restart Dev Server

After creating `.env.local`, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd frontend && npm run dev
```

## 5. Test Authentication

Once configured, you should be able to:
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Reset password via email
- ✅ Automatically sync user profile with backend

## Troubleshooting

### "Firebase: Error (auth/api-key-not-valid)"
- Make sure you copied the correct API key from Firebase Console
- Verify `.env.local` file exists and has the correct values
- Restart the dev server after creating/updating `.env.local`

### "Network error" when calling backend
- Make sure the backend is running on `http://localhost:8000`
- Check that CORS is configured correctly in the backend
- Verify `VITE_API_URL` in `.env.local` matches your backend URL

### Authentication works but backend sync fails
- Check that the backend Firebase Admin SDK is configured correctly
- Verify the backend can verify Firebase ID tokens
- Check backend logs for detailed error messages

## Files Created

- `frontend/src/config/firebase.ts` - Firebase initialization
- `frontend/src/services/auth.ts` - Authentication service with Firebase integration
- `.env.local` - Your local environment variables (create this file)

## Next Steps

After Firebase is configured:
1. Test sign up/sign in flow
2. Verify user profile syncs with backend
3. Implement protected routes
4. Add auth state persistence

