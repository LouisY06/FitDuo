/**
 * React hook for managing game WebSocket connections
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  GameWebSocket,
  type WebSocketMessage,
  type GameState,
} from "../services/websocket";

export interface UseGameWebSocketOptions {
  gameId: number;
  playerId: number;
  onGameState?: (state: GameState) => void;
  onRepIncrement?: (playerId: number, repCount: number) => void;
  onRoundStart?: (round: number, exerciseId?: number) => void;
  onRoundEnd?: (data: {
    winnerId: number | null;
    loserId: number | null;
    playerAScore: number;
    playerBScore: number;
    narrative: string;
    strategy: Record<string, unknown>;
  }) => void;
  onFormRules?: (rules: {
    exercise_id: number;
    exercise_name: string;
    form_rules: Record<string, unknown>;
  }) => void;
  onPlayerReady?: (playerId: number, isReady: boolean) => void;
  onReadyPhaseStart?: (startTimestamp: number, durationSeconds: number) => void;
  onCountdownStart?: (startTimestamp: number, durationSeconds: number) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

export function useGameWebSocket(options: UseGameWebSocketOptions) {
  const {
    gameId,
    playerId,
    onGameState,
    onRepIncrement,
    onRoundStart,
    onRoundEnd,
    onFormRules,
    onPlayerReady,
    onReadyPhaseStart,
    onCountdownStart,
    onError,
    autoConnect = true,
  } = options;

  const wsRef = useRef<GameWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to avoid recreating WebSocket on callback changes
  const callbacksRef = useRef({
    onGameState,
    onRepIncrement,
    onRoundStart,
    onRoundEnd,
    onFormRules,
    onPlayerReady,
    onReadyPhaseStart,
    onCountdownStart,
    onError,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onGameState,
      onRepIncrement,
      onRoundStart,
      onRoundEnd,
      onFormRules,
      onPlayerReady,
      onReadyPhaseStart,
      onCountdownStart,
      onError,
    };
  }, [onGameState, onRepIncrement, onRoundStart, onRoundEnd, onFormRules, onPlayerReady, onReadyPhaseStart, onCountdownStart, onError]);

  // Initialize WebSocket (only recreate when gameId, playerId, or autoConnect changes)
  useEffect(() => {
    if (!autoConnect || !gameId || !playerId || playerId === 0) {
      // Don't try to connect if playerId is invalid
      if (playerId === 0 && gameId) {
        console.warn("Cannot connect WebSocket: playerId is 0. Waiting for authentication...");
      }
      return;
    }

    // Disconnect existing connection if gameId or playerId changed
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }

    const ws = new GameWebSocket(gameId, playerId);
    wsRef.current = ws;

    // Register handlers using refs to get latest callbacks
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      ws.on("GAME_STATE", (message: WebSocketMessage) => {
        if (callbacksRef.current.onGameState) {
          callbacksRef.current.onGameState(message.payload as unknown as GameState);
        }
      })
    );

    unsubscribers.push(
      ws.on("REP_INCREMENT", (message: WebSocketMessage) => {
        if (callbacksRef.current.onRepIncrement) {
          const payload = message.payload as { playerId: number; repCount: number };
          callbacksRef.current.onRepIncrement(payload.playerId, payload.repCount);
        }
      })
    );

    unsubscribers.push(
      ws.on("ROUND_START", (message: WebSocketMessage) => {
        if (callbacksRef.current.onRoundStart) {
          const payload = message.payload as {
            currentRound: number;
            exerciseId?: number;
          };
          callbacksRef.current.onRoundStart(payload.currentRound, payload.exerciseId);
        }
      })
    );

    unsubscribers.push(
      ws.on("ROUND_END", (message: WebSocketMessage) => {
        if (callbacksRef.current.onRoundEnd) {
          const payload = message.payload as {
            winnerId: number | null;
            loserId: number | null;
            playerAScore: number;
            playerBScore: number;
            narrative: string;
            strategy: Record<string, unknown>;
          };
          callbacksRef.current.onRoundEnd(payload);
        }
      })
    );

    unsubscribers.push(
      ws.on("FORM_RULES", (message: WebSocketMessage) => {
        if (callbacksRef.current.onFormRules) {
          callbacksRef.current.onFormRules(message.payload as {
            exercise_id: number;
            exercise_name: string;
            form_rules: Record<string, unknown>;
          });
        }
      })
    );

    unsubscribers.push(
      ws.on("PLAYER_READY", (message: WebSocketMessage) => {
        if (callbacksRef.current.onPlayerReady) {
          const payload = message.payload as { playerId: number; isReady: boolean };
          callbacksRef.current.onPlayerReady(payload.playerId, payload.isReady);
        }
      })
    );

    unsubscribers.push(
      ws.on("READY_PHASE_START", (message: WebSocketMessage) => {
        if (callbacksRef.current.onReadyPhaseStart) {
          const payload = message.payload as { startTimestamp: number; durationSeconds: number };
          callbacksRef.current.onReadyPhaseStart(payload.startTimestamp, payload.durationSeconds);
        }
      })
    );

    unsubscribers.push(
      ws.on("COUNTDOWN_START", (message: WebSocketMessage) => {
        if (callbacksRef.current.onCountdownStart) {
          const payload = message.payload as { startTimestamp: number; durationSeconds: number };
          callbacksRef.current.onCountdownStart(payload.startTimestamp, payload.durationSeconds);
        }
      })
    );

    unsubscribers.push(
      ws.on("ERROR", (message: WebSocketMessage) => {
        const errorMsg = message.payload as unknown as string;
        setError(errorMsg);
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(errorMsg);
        }
      })
    );

    // Connect
    ws.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        const errorMsg = err.message || "Failed to connect to game";
        setError(errorMsg);
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(errorMsg);
        }
      });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      ws.disconnect();
      setIsConnected(false);
    };
  }, [gameId, playerId, autoConnect]);

  // Send rep increment
  const sendRepIncrement = useCallback((repCount: number) => {
    wsRef.current?.sendRepIncrement(repCount);
  }, []);

  // Send round end
  const sendRoundEnd = useCallback(() => {
    wsRef.current?.sendRoundEnd();
  }, []);

  // Send round start
  const sendRoundStart = useCallback((exerciseId?: number) => {
    wsRef.current?.sendRoundStart(exerciseId);
  }, []);

  // Send exercise selected
  const sendExerciseSelected = useCallback((exerciseId: number) => {
    wsRef.current?.sendExerciseSelected(exerciseId);
  }, []);

  // Send player ready
  const sendPlayerReady = useCallback((isReady: boolean) => {
    wsRef.current?.sendPlayerReady(isReady);
  }, []);

  // Ping
  const ping = useCallback(() => {
    wsRef.current?.ping();
  }, []);

  // Manual connect/disconnect
  const connect = useCallback(async () => {
    if (wsRef.current) {
      try {
        await wsRef.current.connect();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        const errorMsg = (err as Error).message || "Failed to connect";
        setError(errorMsg);
        throw err;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    error,
    sendRepIncrement,
    sendRoundEnd,
    sendRoundStart,
    sendExerciseSelected,
    sendPlayerReady,
    ping,
    connect,
    disconnect,
  };
}

