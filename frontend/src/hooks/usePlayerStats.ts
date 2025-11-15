/**
 * React hook for fetching and managing player statistics
 */

import { useState, useEffect } from "react";
import { getPlayerStats, type PlayerStats, type ApiError } from "../services/player";

export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayerStats();
      setStats(data);
    } catch (err) {
      setError(err as ApiError);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

