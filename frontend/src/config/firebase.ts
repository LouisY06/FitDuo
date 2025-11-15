/**
 * Firebase Configuration
 * 
 * Initialize Firebase for the frontend.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase web app configuration
// All values should be set in .env.local file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required config values are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0 && import.meta.env.DEV) {
  console.warn(
    'Missing required Firebase environment variables:',
    missingVars.join(', ')
  );
  console.warn('Please create a .env.local file with your Firebase config.');
}

// Initialize Firebase (only if not already initialized)
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

// Wrap initialization in try-catch to prevent crashes
try {
  if (getApps().length === 0) {
    // Only initialize if we have the required config
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized successfully");
    } else {
      console.warn("Firebase config incomplete - some features may not work");
    }
  } else {
    app = getApps()[0];
  }

  if (app) {
    // Initialize Firebase Auth
    authInstance = getAuth(app);

    // Initialize Analytics (only in browser environment)
    if (typeof window !== "undefined") {
      try {
        getAnalytics(app);
      } catch (error) {
        console.warn("Firebase Analytics initialization failed:", error);
      }
    }
  }
} catch (error: any) {
  console.error("Firebase initialization error:", error);
  console.warn("App will continue without Firebase - authentication features will not work");
  // Don't throw - let the app continue
}

// Export with null check - components should handle null case
export const auth: Auth | null = authInstance;

export default app;

