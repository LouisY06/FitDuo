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
    onError,
    autoConnect = true,
  } = options;

  const wsRef = useRef<GameWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!autoConnect) return;

    const ws = new GameWebSocket(gameId, playerId);
    wsRef.current = ws;

    // Register handlers
    const unsubscribers: (() => void)[] = [];

    if (onGameState) {
      unsubscribers.push(
        ws.on("GAME_STATE", (message: WebSocketMessage) => {
          onGameState(message.payload as unknown as GameState);
        })
      );
    }

    if (onRepIncrement) {
      unsubscribers.push(
        ws.on("REP_INCREMENT", (message: WebSocketMessage) => {
          const payload = message.payload as { playerId: number; repCount: number };
          onRepIncrement(payload.playerId, payload.repCount);
        })
      );
    }

    if (onRoundStart) {
      unsubscribers.push(
        ws.on("ROUND_START", (message: WebSocketMessage) => {
          const payload = message.payload as {
            currentRound: number;
            exerciseId?: number;
          };
          onRoundStart(payload.currentRound, payload.exerciseId);
        })
      );
    }

    if (onRoundEnd) {
      unsubscribers.push(
        ws.on("ROUND_END", (message: WebSocketMessage) => {
          const payload = message.payload as {
            winnerId: number | null;
            loserId: number | null;
            playerAScore: number;
            playerBScore: number;
            narrative: string;
            strategy: Record<string, unknown>;
          };
          onRoundEnd(payload);
        })
      );
    }

    if (onFormRules) {
      unsubscribers.push(
        ws.on("FORM_RULES", (message: WebSocketMessage) => {
          onFormRules(message.payload as {
            exercise_id: number;
            exercise_name: string;
            form_rules: Record<string, unknown>;
          });
        })
      );
    }

    if (onError) {
      unsubscribers.push(
        ws.on("ERROR", (message: WebSocketMessage) => {
          const errorMsg = message.payload as unknown as string;
          onError(errorMsg);
          setError(errorMsg);
        })
      );
    }

    // Connect
    ws.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        const errorMsg = err.message || "Failed to connect to game";
        setError(errorMsg);
        if (onError) onError(errorMsg);
      });

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      ws.disconnect();
      setIsConnected(false);
    };
  }, [
    gameId,
    playerId,
    autoConnect,
    onGameState,
    onRepIncrement,
    onRoundStart,
    onRoundEnd,
    onFormRules,
    onError,
  ]);

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
    ping,
    connect,
    disconnect,
  };
}

