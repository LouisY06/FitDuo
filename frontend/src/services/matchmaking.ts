/**
 * Matchmaking Service
 * 
 * Handles matchmaking queue operations and WebSocket connections for real-time match notifications.
 */

import { apiPost, apiDelete, apiGet, type ApiError } from "./api";

// ==================== Types ====================

export interface JoinQueueRequest {
  exercise_id?: number;
}

export interface QueueStatus {
  in_queue: boolean;
  queue_position: number;
  estimated_wait: number; // seconds
}

export interface MatchFoundPayload {
  game_id: number;
  opponent_id: number;
  opponent_name: string;
  exercise_id?: number;
}

// ==================== API Functions ====================

/**
 * Join the matchmaking queue
 */
export async function joinQueue(
  exerciseId?: number
): Promise<QueueStatus> {
  try {
    const request: JoinQueueRequest = {};
    if (exerciseId) {
      request.exercise_id = exerciseId;
    }
    console.log("joinQueue called with:", request);
    const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    console.log("API URL:", API_BASE_URL);
    const result = await apiPost<QueueStatus>("/api/matchmaking/queue", request);
    console.log("joinQueue result:", result);
    return result;
  } catch (error) {
    console.error("joinQueue error:", error);
    throw error as ApiError;
  }
}

/**
 * Leave the matchmaking queue
 */
export async function leaveQueue(): Promise<{ status: string; message: string }> {
  try {
    return await apiDelete<{ status: string; message: string }>("/api/matchmaking/queue");
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Get current queue status
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  try {
    return await apiGet<QueueStatus>("/api/matchmaking/status");
  } catch (error) {
    throw error as ApiError;
  }
}

// ==================== WebSocket Client ====================

/**
 * WebSocket client for matchmaking updates
 */
export class MatchmakingWebSocket {
  private ws: WebSocket | null = null;
  private playerId: number;
  private onMatchFoundCallback: ((payload: MatchFoundPayload) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isManualClose = false;

  constructor(playerId: number) {
    this.playerId = playerId;
  }

  /**
   * Connect to matchmaking WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const wsUrl = apiUrl.replace("http://", "ws://").replace("https://", "wss://");
      const url = `${wsUrl}/api/matchmaking/ws/${this.playerId}`;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log(`✅ Connected to matchmaking WebSocket for player ${this.playerId}`);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Error parsing matchmaking WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("Matchmaking WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`Matchmaking WebSocket closed: ${event.code} ${event.reason}`);

          // Auto-reconnect if not manually closed
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`Reconnecting matchmaking WebSocket in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
              this.connect().catch(console.error);
            }, delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    console.log("📨 Matchmaking WebSocket message received:", message);
    if (message.type === "MATCH_FOUND") {
      const payload: MatchFoundPayload = message.payload;
      console.log("✅ Match found via WebSocket:", payload);
      if (this.onMatchFoundCallback) {
        console.log("🎯 Calling onMatchFound callback");
        this.onMatchFoundCallback(payload);
      } else {
        console.warn("⚠️ No onMatchFound callback registered!");
      }
    } else if (message.type === "QUEUE_UPDATE") {
      // Handle queue position updates if needed
      console.log("Queue update:", message.payload);
    } else if (message.type === "MATCH_CANCELLED") {
      console.log("Match cancelled:", message.payload);
    } else {
      console.log("ℹ️ Unknown message type:", message.type);
    }
  }

  /**
   * Set callback for when a match is found
   */
  onMatchFound(callback: (payload: MatchFoundPayload) => void): void {
    this.onMatchFoundCallback = callback;
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send("PING");
    }
  }
}

