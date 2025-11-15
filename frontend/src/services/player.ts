/**
 * Player Service
 * 
 * Handles all player-related API calls:
 * - Player statistics
 * - Workout history
 * - Player preferences
 */

import { apiGet, apiPost, apiPut, type ApiError } from "./api";

// ==================== Types ====================

export interface PlayerStats {
  user_id: number;
  total_games: number;
  games_won: number;
  games_lost: number;
  games_tied: number;
  win_rate: number;
  total_reps: number;
  total_workouts: number;
  total_workout_time: number;
  best_pushups: number;
  best_squats: number;
  best_pullups: number;
  best_burpees: number;
  best_plank_time: number;
  best_wall_sit_time: number;
  current_win_streak: number;
  longest_win_streak: number;
  current_workout_streak: number;
  longest_workout_streak: number;
  last_workout_at: string | null;
  last_game_at: string | null;
  level: number;
  experience_points: number;
}

export interface Workout {
  id: number;
  exercise_id: number | null;
  exercise_name: string;
  exercise_category: string;
  reps: number | null;
  duration_seconds: number | null;
  score: number;
  workout_type: "solo" | "battle" | "practice";
  form_rating: number | null;
  completed_at: string;
}

export interface PlayerPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  match_notifications: boolean;
  achievement_notifications: boolean;
  profile_visibility: "public" | "friends" | "private";
  show_stats: boolean;
  show_workout_history: boolean;
  preferred_exercises: string | null; // JSON array
  difficulty_level: "easy" | "medium" | "hard" | "expert";
  auto_match: boolean;
  default_workout_duration: number;
  rest_time_between_exercises: number;
  enable_cv_detection: boolean;
  units: "metric" | "imperial";
  theme: "light" | "dark" | "auto";
  language: string;
}

export interface CreateWorkoutRequest {
  exercise_id?: number;
  exercise_name: string;
  exercise_category: string;
  reps?: number;
  duration_seconds?: number;
  score?: number;
  workout_type?: "solo" | "battle" | "practice";
  game_session_id?: number;
  form_rating?: number;
  notes?: string;
}

export interface UpdatePreferencesRequest {
  email_notifications?: boolean;
  push_notifications?: boolean;
  match_notifications?: boolean;
  achievement_notifications?: boolean;
  profile_visibility?: "public" | "friends" | "private";
  show_stats?: boolean;
  show_workout_history?: boolean;
  preferred_exercises?: string;
  difficulty_level?: "easy" | "medium" | "hard" | "expert";
  auto_match?: boolean;
  default_workout_duration?: number;
  rest_time_between_exercises?: number;
  enable_cv_detection?: boolean;
  units?: "metric" | "imperial";
  theme?: "light" | "dark" | "auto";
  language?: string;
}

export interface WorkoutHistoryParams {
  limit?: number;
  offset?: number;
  exercise_id?: number;
  workout_type?: "solo" | "battle" | "practice";
}

// ==================== API Functions ====================

/**
 * Get player statistics
 */
export async function getPlayerStats(): Promise<PlayerStats> {
  try {
    return await apiGet<PlayerStats>("/api/player/stats");
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Get workout history
 */
export async function getWorkoutHistory(
  params?: WorkoutHistoryParams
): Promise<Workout[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.exercise_id) queryParams.append("exercise_id", params.exercise_id.toString());
    if (params?.workout_type) queryParams.append("workout_type", params.workout_type);

    const queryString = queryParams.toString();
    const endpoint = `/api/player/workouts${queryString ? `?${queryString}` : ""}`;
    
    return await apiGet<Workout[]>(endpoint);
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Create a new workout
 */
export async function createWorkout(
  workout: CreateWorkoutRequest
): Promise<{ message: string; workout_id: number }> {
  try {
    return await apiPost<{ message: string; workout_id: number }>(
      "/api/player/workouts",
      workout
    );
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Get player preferences
 */
export async function getPlayerPreferences(): Promise<PlayerPreferences> {
  try {
    return await apiGet<PlayerPreferences>("/api/player/preferences");
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Update player preferences
 */
export async function updatePlayerPreferences(
  preferences: UpdatePreferencesRequest
): Promise<PlayerPreferences> {
  try {
    return await apiPut<PlayerPreferences>(
      "/api/player/preferences",
      preferences
    );
  } catch (error) {
    throw error as ApiError;
  }
}

// ==================== Helper Functions ====================

/**
 * Format workout time (seconds to MM:SS)
 */
export function formatWorkoutTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format win rate as percentage
 */
export function formatWinRate(winRate: number): string {
  return `${(winRate * 100).toFixed(1)}%`;
}

/**
 * Get preferred exercises as array
 */
export function getPreferredExercises(
  preferredExercises: string | null
): number[] {
  if (!preferredExercises) return [];
  try {
    return JSON.parse(preferredExercises);
  } catch {
    return [];
  }
}

/**
 * Set preferred exercises as JSON string
 */
export function setPreferredExercises(exerciseIds: number[]): string {
  return JSON.stringify(exerciseIds);
}

