/**
 * WebSocket Service for Real-Time Multiplayer Battles
 * 
 * Handles WebSocket connections for live game sessions
 */

// Get WebSocket URL from environment or construct from API URL
function getWebSocketUrl(): string {
  // If explicit WS URL is provided, use it
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Otherwise, construct from API URL
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  
  // Convert http/https to ws/wss
  if (apiUrl.startsWith("https://")) {
    return apiUrl.replace("https://", "wss://");
  } else if (apiUrl.startsWith("http://")) {
    return apiUrl.replace("http://", "ws://");
  }
  
  // Default fallback
  return apiUrl.startsWith("ws") ? apiUrl : `ws://${apiUrl}`;
}

const WS_BASE_URL = getWebSocketUrl();

export type WebSocketMessageType =
  | "GAME_STATE"
  | "REP_INCREMENT"
  | "ROUND_START"
  | "ROUND_END"
  | "FORM_RULES"
  | "EXERCISE_SELECTED"
  | "PLAYER_READY"
  | "READY_PHASE_START"
  | "COUNTDOWN_START"
  | "PING"
  | "PONG"
  | "ERROR"
  | "ECHO";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: Record<string, unknown>;
}

export interface GameState {
  gameId: number;
  playerA: {
    id: number;
    score: number;
  };
  playerB: {
    id: number;
    score: number;
  };
  currentRound: number;
  status: string;
  exerciseId?: number | null;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private gameId: number;
  private playerId: number;
  private handlers: Map<WebSocketMessageType, WebSocketEventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualClose = false;

  constructor(gameId: number, playerId: number) {
    this.gameId = gameId;
    this.playerId = playerId;
  }

  /**
   * Connect to the game WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE_URL}/ws/${this.gameId}?player_id=${this.playerId}`;
      
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log(`✅ Connected to game ${this.gameId} as player ${this.playerId}`);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`);
          
          // Don't reconnect if it's a client error (4xx) or if playerId is invalid
          if (event.code === 1006 || event.code === 4000 || this.playerId === 0) {
            console.warn("WebSocket connection failed due to client error. Not reconnecting.");
            this.isManualClose = true;
            return;
          }
          
          // Auto-reconnect if not manually closed
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
              this.connect().catch(console.error);
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("Max reconnection attempts reached. Stopping reconnection.");
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send a message to the server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }

  /**
   * Send rep increment
   */
  sendRepIncrement(repCount: number): void {
    this.send({
      type: "REP_INCREMENT",
      payload: { repCount },
    });
  }

  /**
   * Send round end
   */
  sendRoundEnd(): void {
    this.send({
      type: "ROUND_END",
      payload: {},
    });
  }

  /**
   * Send round start
   */
  sendRoundStart(exerciseId?: number): void {
    this.send({
      type: "ROUND_START",
      payload: { exerciseId: exerciseId || null },
    });
  }

  /**
   * Send exercise selection
   */
  sendExerciseSelected(exerciseId: number): void {
    this.send({
      type: "EXERCISE_SELECTED",
      payload: { exerciseId },
    });
  }

  /**
   * Send player ready status
   */
  sendPlayerReady(isReady: boolean): void {
    this.send({
      type: "PLAYER_READY",
      payload: { isReady },
    });
  }

  /**
   * Send ping (keep-alive)
   */
  ping(): void {
    this.send({
      type: "PING",
      payload: {},
    });
  }

  /**
   * Register a message handler
   */
  on(type: WebSocketMessageType, handler: WebSocketEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in handler for ${message.type}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get ready state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
