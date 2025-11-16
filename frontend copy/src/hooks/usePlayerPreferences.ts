/**
 * React hook for fetching and updating player preferences
 */

import { useState, useEffect } from "react";
import {
  getPlayerPreferences,
  updatePlayerPreferences,
  type PlayerPreferences,
  type UpdatePreferencesRequest,
  type ApiError,
} from "../services/player";

export function usePlayerPreferences() {
  const [preferences, setPreferences] = useState<PlayerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayerPreferences();
      setPreferences(data);
    } catch (err) {
      setError(err as ApiError);
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: UpdatePreferencesRequest) => {
    try {
      setUpdating(true);
      setError(null);
      const updated = await updatePlayerPreferences(updates);
      setPreferences(updated);
      return updated;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    updating,
    error,
    refetch: fetchPreferences,
    update: updatePreferences,
  };
}

