import axios from "axios";
import { auth } from "../config/firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Firebase auth token to all requests
api.interceptors.request.use(async (config) => {
  try {
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("⚠️ Failed to get Firebase token:", error);
  }
  
  console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Log API responses
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} - ${error.message}`);
    return Promise.reject(error);
  }
);

export interface UserStats {
  userId: number;
  totalBattles: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  totalReps: number;
  avgReps: number;
  bestRepsSingleRound: number;
  bestPushups: number;
  bestSquats: number;
  bestPlankSeconds: number;
  bestSitups: number;
  bestLunges: number;
  mmr: number;
  tier: string;
  currentStreak: number;
  longestStreak: number;
  totalWorkoutMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// API helper functions for backwards compatibility
export interface ApiError {
  message: string;
  status?: number;
}

export const apiGet = async <T = any>(url: string): Promise<T> => {
  const response = await api.get(url);
  return response.data;
};

export const apiPost = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await api.post(url, data);
  return response.data;
};

export const apiDelete = async <T = any>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response.data;
};

export const apiPut = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await api.put(url, data);
  return response.data;
};

export const userStatsAPI = {
  /**
   * Get user stats by user ID
   */
  getUserStats: async (userId: number): Promise<UserStats> => {
    const response = await api.get(`/api/users/${userId}/stats`);
    return response.data;
  },
};

export default api;
