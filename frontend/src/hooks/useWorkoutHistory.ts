/**
 * React hook for fetching workout history
 */

import { useState, useEffect } from "react";
import {
  getWorkoutHistory,
  type Workout,
  type WorkoutHistoryParams,
  type ApiError,
} from "../services/player";

export function useWorkoutHistory(params?: WorkoutHistoryParams) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkoutHistory(params);
      setWorkouts(data);
    } catch (err) {
      setError(err as ApiError);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [params?.limit, params?.offset, params?.exercise_id, params?.workout_type]);

  return {
    workouts,
    loading,
    error,
    refetch: fetchWorkouts,
  };
}

