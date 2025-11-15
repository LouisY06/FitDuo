/**
 * Authentication Service
 * 
 * Handles authentication with Firebase Auth and the backend API.
 * The backend expects Firebase ID tokens for authentication.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "../config/firebase";

// Helper to check if auth is available
function requireAuth() {
  if (!auth) {
    throw {
      message: "Firebase Auth is not initialized. Please check your configuration.",
      status: 500,
    } as ApiError;
  }
  return auth;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ApiError {
  message: string;
  status?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  token?: string;
  user?: {
    id: number;
    firebase_uid: string;
    username: string;
    email?: string;
  };
}

/**
 * Get Firebase ID token for authenticated user
 */
async function getIdToken(): Promise<string | null> {
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

/**
 * Login with email and password using Firebase Auth
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const authInstance = requireAuth();
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(
      authInstance,
      credentials.email,
      credentials.password
    );

    // Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();

    // Store token in localStorage
    localStorage.setItem("auth_token", idToken);

    // Sync with backend to get/create user profile (optional if backend is down)
    let profile = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();

        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (profileResponse.ok) {
          profile = await profileResponse.json();
        } else {
          profile = userData;
        }
      } else {
        // Backend sync failed, but Firebase auth succeeded
        console.warn("Backend sync failed, but user is authenticated with Firebase");
      }
    } catch (backendError) {
      // Backend is not available, but Firebase auth succeeded
      console.warn("Backend is not available, but user is authenticated with Firebase");
    }

    return {
      token: idToken,
      user: profile || {
        id: userCredential.user.uid,
        firebase_uid: userCredential.user.uid,
        username: userCredential.user.displayName || credentials.email.split("@")[0],
        email: userCredential.user.email || undefined,
      },
    };
  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code) {
      let message = "Login failed";
      switch (error.code) {
        case "auth/user-not-found":
          message = "No account found with this email";
          break;
        case "auth/wrong-password":
          message = "Incorrect password";
          break;
        case "auth/invalid-email":
          message = "Invalid email address";
          break;
        case "auth/user-disabled":
          message = "This account has been disabled";
          break;
        case "auth/too-many-requests":
          message = "Too many failed attempts. Please try again later";
          break;
        default:
          message = error.message || "Login failed";
      }
      throw {
        message,
        status: 401,
      } as ApiError;
    }

    // Handle API errors
    if ((error as ApiError).status) {
      throw error;
    }

    throw {
      message: "Network error. Please check your connection.",
      status: 0,
    } as ApiError;
  }
}

/**
 * Sign up with email and password using Firebase Auth
 */
export async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
  try {
    const authInstance = requireAuth();
    // Create user with Firebase
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      credentials.email,
      credentials.password
    );

    // Update display name if provided
    if (credentials.username) {
      await userCredential.user.updateProfile({
        displayName: credentials.username,
      });
    }

    // Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();

    // Store token in localStorage
    localStorage.setItem("auth_token", idToken);

    // Sync with backend to create user profile (optional if backend is down)
    let profile = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (profileResponse.ok) {
          profile = await profileResponse.json();
        }
      } else {
        // Backend sync failed, but Firebase auth succeeded
        console.warn("Backend sync failed, but user is authenticated with Firebase");
      }
    } catch (backendError) {
      // Backend is not available, but Firebase auth succeeded
      console.warn("Backend is not available, but user is authenticated with Firebase");
    }

    return {
      token: idToken,
      user: profile || {
        id: userCredential.user.uid,
        firebase_uid: userCredential.user.uid,
        username: credentials.username || credentials.email.split("@")[0],
        email: userCredential.user.email || undefined,
      },
    };
  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code) {
      let message = "Sign up failed";
      switch (error.code) {
        case "auth/email-already-in-use":
          message = "An account with this email already exists";
          break;
        case "auth/invalid-email":
          message = "Invalid email address";
          break;
        case "auth/weak-password":
          message = "Password is too weak. Please use a stronger password";
          break;
        default:
          message = error.message || "Sign up failed";
      }
      throw {
        message,
        status: 400,
      } as ApiError;
    }

    // Handle API errors
    if ((error as ApiError).status) {
      throw error;
    }

    throw {
      message: "Network error. Please check your connection.",
      status: 0,
    } as ApiError;
  }
}

/**
 * Send password reset email using Firebase Auth
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    const authInstance = requireAuth();
    await sendPasswordResetEmail(authInstance, email);
  } catch (error: any) {
    if (error.code) {
      let message = "Failed to send reset email";
      switch (error.code) {
        case "auth/user-not-found":
          message = "No account found with this email";
          break;
        case "auth/invalid-email":
          message = "Invalid email address";
          break;
        default:
          message = error.message || "Failed to send reset email";
      }
      throw {
        message,
        status: 400,
      } as ApiError;
    }

    throw {
      message: "Network error. Please check your connection.",
      status: 0,
    } as ApiError;
  }
}

/**
 * Get current user profile from backend
 */
export async function getCurrentUser(): Promise<AuthResponse["user"]> {
  try {
    const idToken = await getIdToken();
    if (!idToken) {
      throw { message: "Not authenticated", status: 401 } as ApiError;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        throw { message: "Session expired. Please log in again.", status: 401 } as ApiError;
      }
      const error = await response.json().catch(() => ({ message: "Failed to get user" }));
      throw {
        message: error.detail || error.message || "Failed to get user",
        status: response.status,
      } as ApiError;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }
    throw {
      message: "Network error. Please check your connection.",
      status: 0,
    } as ApiError;
  }
}

/**
 * Logout from Firebase and clear local storage
 */
export async function logout(): Promise<void> {
  try {
    if (auth) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.error("Error signing out:", error);
  } finally {
    localStorage.removeItem("auth_token");
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): (() => void) | null {
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser(): User | null {
  return auth?.currentUser || null;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const authInstance = requireAuth();
    const provider = new GoogleAuthProvider();
    
    // Sign in with Google popup
    const userCredential = await signInWithPopup(authInstance, provider);
    
    // Get Firebase ID token
    const idToken = await userCredential.user.getIdToken();
    
    // Store token in localStorage
    localStorage.setItem("auth_token", idToken);
    
    // Sync with backend to get/create user profile (optional if backend is down)
    let profile = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      if (response.ok) {
        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });
        
        if (profileResponse.ok) {
          profile = await profileResponse.json();
        }
      } else {
        // Backend sync failed, but Firebase auth succeeded
        console.warn("Backend sync failed, but user is authenticated with Firebase");
      }
    } catch (backendError) {
      // Backend is not available, but Firebase auth succeeded
      console.warn("Backend is not available, but user is authenticated with Firebase");
    }
    
    return {
      token: idToken,
      user: profile || {
        id: userCredential.user.uid,
        firebase_uid: userCredential.user.uid,
        username: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "User",
        email: userCredential.user.email || undefined,
      },
    };
  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code) {
      let message = "Google sign-in failed";
      switch (error.code) {
        case "auth/popup-closed-by-user":
          message = "Sign-in popup was closed";
          break;
        case "auth/popup-blocked":
          message = "Sign-in popup was blocked. Please allow popups for this site.";
          break;
        case "auth/cancelled-popup-request":
          message = "Only one popup request is allowed at a time";
          break;
        default:
          message = error.message || "Google sign-in failed";
      }
      throw {
        message,
        status: 401,
      } as ApiError;
    }
    
    // Handle API errors
    if ((error as ApiError).status) {
      throw error;
    }
    
    throw {
      message: "Network error. Please check your connection.",
      status: 0,
    } as ApiError;
  }
}
