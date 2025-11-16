/**
 * React hook for matchmaking
 * 
 * Manages matchmaking state, queue operations, and WebSocket connections.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  MatchmakingWebSocket,
  type QueueStatus,
  type MatchFoundPayload,
} from "../services/matchmaking";
import { getCurrentUser } from "../services/auth";

export interface UseMatchmakingOptions {
  onMatchFound?: (payload: MatchFoundPayload) => void;
  autoConnect?: boolean;
}

export interface UseMatchmakingReturn {
  // State
  isSearching: boolean;
  queueStatus: QueueStatus | null;
  error: string | null;
  loading: boolean;

  // Actions
  startSearching: (exerciseId?: number) => Promise<void>;
  stopSearching: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useMatchmaking(
  options: UseMatchmakingOptions = {}
): UseMatchmakingReturn {
  const { onMatchFound, autoConnect = false } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef<MatchmakingWebSocket | null>(null);
  const playerIdRef = useRef<number | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("🔍 Fetching current user for matchmaking...");
        const user = await getCurrentUser();
        console.log("👤 Current user:", user);
        // User object has id field from backend
        if (user && (user.id || (user as any).user_id)) {
          playerIdRef.current = (user.id || (user as any).user_id) as number;
          console.log(`✅ Player ID set to: ${playerIdRef.current}`);
        } else {
          console.warn("⚠️ User ID not found in user object:", user);
        }
      } catch (err) {
        console.error("❌ Error fetching current user:", err);
      }
    };
    fetchUser();
  }, []);

  // Store onMatchFound in a ref to avoid reconnections
  const onMatchFoundRef = useRef(onMatchFound);
  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
  }, [onMatchFound]);

  // Connect to matchmaking WebSocket when searching
  useEffect(() => {
    if (isSearching && playerIdRef.current && autoConnect) {
      console.log(`🔌 Connecting to matchmaking WebSocket for player ${playerIdRef.current}`);
      const ws = new MatchmakingWebSocket(playerIdRef.current);
      wsRef.current = ws;

      // Use the ref to avoid reconnections when callback changes
      ws.onMatchFound((payload) => {
        if (onMatchFoundRef.current) {
          console.log("✅ Calling onMatchFound from ref");
          onMatchFoundRef.current(payload);
        } else {
          console.log("Match found (no handler):", payload);
        }
      });

      ws.connect()
        .then(() => {
          console.log("✅ Matchmaking WebSocket connected successfully");
        })
        .catch((err) => {
          console.error("❌ Failed to connect to matchmaking WebSocket:", err);
          setError("Failed to connect to matchmaking service");
        });

      return () => {
        console.log("🔌 Disconnecting matchmaking WebSocket");
        ws.disconnect();
        wsRef.current = null;
      };
    }
  }, [isSearching, autoConnect]);

  // Start searching for a match
  const startSearching = useCallback(async (exerciseId?: number) => {
    console.log("🔴🔴🔴 startSearching() CALLED 🔴🔴🔴", { exerciseId, playerId: playerIdRef.current });
    try {
      console.log("startSearching called", { exerciseId, playerId: playerIdRef.current });
      setLoading(true);
      setError(null);
      console.log("✅ Loading set to true, error cleared");

      if (!playerIdRef.current) {
        console.warn("⚠️ No player ID, fetching user...");
        // Try to get user ID again
        try {
          const user = await getCurrentUser();
          console.log("👤 Got user from getCurrentUser():", user);
          if (user && (user.id || (user as any).user_id)) {
            playerIdRef.current = (user.id || (user as any).user_id) as number;
            console.log("✅ Got player ID:", playerIdRef.current);
          } else {
            console.error("❌ User ID not found in user object:", user);
            throw new Error("User ID not found");
          }
        } catch (err) {
          console.error("❌ Failed to get user ID:", err);
          throw new Error("Please log in to start matchmaking");
        }
      } else {
        console.log("✅ Player ID already set:", playerIdRef.current);
      }

      console.log("📥 Joining queue...", { exerciseId, playerId: playerIdRef.current });
      try {
        const status = await joinQueue(exerciseId);
        console.log("✅ Queue status received:", status);
        setQueueStatus(status);
        setIsSearching(true);
        console.log("✅ Matchmaking started, isSearching set to true");
      } catch (error) {
        console.error("❌ Error joining queue:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        throw error;
      }

      // Poll for queue status updates
      const pollInterval = setInterval(async () => {
        try {
          const updatedStatus = await getQueueStatus();
          setQueueStatus(updatedStatus);

          // Don't auto-stop when removed from queue - let match notification handle it
          // (Players are removed from queue when matched, but need to stay connected
          // to receive the MATCH_FOUND notification)
        } catch (err) {
          console.error("Error polling queue status:", err);
        }
      }, 5000); // Poll every 5 seconds

      // Store interval for cleanup
      (startSearching as any).pollInterval = pollInterval;
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || "Failed to join matchmaking queue");
      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop searching
  const stopSearching = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to leave queue (ignore 404 if already removed)
      try {
        await leaveQueue();
      } catch (err: any) {
        // Ignore "Not in queue" errors - user might have been matched already
        if (err.status !== 404) {
          throw err;
        }
      }
      
      setIsSearching(false);
      setQueueStatus(null);

      // Clear polling interval
      if ((startSearching as any).pollInterval) {
        clearInterval((startSearching as any).pollInterval);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || "Failed to leave matchmaking queue");
    } finally {
      setLoading(false);
    }
  }, [startSearching]);

  // Refresh queue status
  const refreshStatus = useCallback(async () => {
    try {
      const status = await getQueueStatus();
      setQueueStatus(status);
      setIsSearching(status.in_queue);
    } catch (err) {
      console.error("Error refreshing queue status:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
      if ((startSearching as any).pollInterval) {
        clearInterval((startSearching as any).pollInterval);
      }
    };
  }, [startSearching]);

  return {
    isSearching,
    queueStatus,
    error,
    loading,
    startSearching,
    stopSearching,
    refreshStatus,
  };
}

