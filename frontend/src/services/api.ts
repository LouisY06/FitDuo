import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log API requests for debugging
api.interceptors.request.use((config) => {
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
