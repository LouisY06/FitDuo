import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { LiveBattleCard } from "../LiveBattleCard";
import { AnimatedTitle } from "../AnimatedTitle";
import { ShimmerButton, ShimmerCard } from "../ShimmerComponents";
import { ElectricButton } from "../ElectricButton";
import { CVDetector } from "../../../cv/services/cv-detector";
import { PUSHUP_FORM_RULES } from "../../../cv/exercises/pushup-params";
import { SQUAT_FORM_RULES, checkStandingForm as _checkStandingForm } from "../../../cv/exercises/squat-params";
import { PLANK_FORM_RULES } from "../../../cv/exercises/plank-params";
import { LUNGE_FORM_RULES } from "../../../cv/exercises/lunge-params";
import { useGameWebSocket } from "../../hooks/useGameWebSocket";
import { getCurrentUser } from "../../services/auth";
import { auth } from "../../config/firebase";
import type { GameState } from "../../services/websocket";
import { apiGet } from "../../services/api";

type ExerciseType = "push-up" | "squat" | "plank" | "lunge";

interface ExerciseOption {
  id: ExerciseType;
  name: string;
  description: string;
  icon: string;
  formRules: any;
}

/**
 * ActiveBattleScreen
 *
 * Battle view wired to URL routing.
 * Renders LiveBattleCard with real-time CV tracking and WebSocket updates.
 */
const EXERCISE_OPTIONS: ExerciseOption[] = [
  {
    id: "push-up",
    name: "Push-ups",
    description: "Classic upper body exercise",
    icon: "",
    formRules: PUSHUP_FORM_RULES,
  },
  {
    id: "squat",
    name: "Squats",
    description: "Lower body strength builder",
    icon: "",
    formRules: SQUAT_FORM_RULES,
  },
  {
    id: "plank",
    name: "Plank Hold",
    description: "Core stability challenge",
    icon: "",
    formRules: PLANK_FORM_RULES,
  },
  {
    id: "lunge",
    name: "Sit-ups",
    description: "Core strength and endurance",
    icon: "",
    formRules: LUNGE_FORM_RULES,
  },
];

export function ActiveBattleScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<CVDetector | null>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userReps, setUserReps] = useState(0);
  const [opponentReps, setOpponentReps] = useState(0);
  const [opponentName] = useState<string>("Opponent");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [isCVReady, setIsCVReady] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [showCoinFlip, setShowCoinFlip] = useState(true);
  const [coinFlipResult, setCoinFlipResult] = useState<number | null>(null); // Player ID who won coin flip
  const [whoseTurnToChoose, setWhoseTurnToChoose] = useState<number | null>(null); // Player ID whose turn it is to choose
  const [currentRound, setCurrentRound] = useState(1);
  const [userRoundsWon, setUserRoundsWon] = useState(0);
  const [opponentRoundsWon, setOpponentRoundsWon] = useState(0);
  const [_countdownRemaining, setCountdownRemaining] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [lastRepTime, setLastRepTime] = useState<number>(Date.now());
  const [readyPhaseRemaining, setReadyPhaseRemaining] = useState(10); // 10 seconds to get ready
  const [readyPhaseStartTime, setReadyPhaseStartTime] = useState<number | null>(null); // Server timestamp for sync
  const [startCountdown, setStartCountdown] = useState(5); // 5-second countdown after both ready
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null); // Server timestamp for sync
  const [userReady, setUserReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isInStartingPosition, _setIsInStartingPosition] = useState(false);
  const [gamePhase, setGamePhase] = useState<"ready" | "countdown" | "live" | "ended">("ready");
  const [roundEndData, setRoundEndData] = useState<{
    winnerId: number | null;
    loserId: number | null;
    playerAScore: number;
    playerBScore: number;
    playerARoundsWon?: number;
    playerBRoundsWon?: number;
    gameOver?: boolean;
    matchWinnerId?: number | null;
    narrative: string;
    strategy: Record<string, unknown>;
  } | null>(null);
  const [roundEndCountdown, setRoundEndCountdown] = useState(5); // 5 second countdown after round ends
  const [showGameOver, setShowGameOver] = useState(false);
  const [debugEndState, setDebugEndState] = useState<"victory" | "defeat" | "tie" | null>(null);
  const sendRepIncrementRef = useRef<((repCount: number) => void) | null>(null);
  const sendRoundEndRef = useRef<(() => void) | null>(null);
  const sendExerciseSelectedRef = useRef<((exerciseId: number) => void) | null>(null);
  const lastSentRepCountRef = useRef<number>(0);
  // Refs to track game state for rep callback (to avoid stale closures)
  const gamePhaseRef = useRef<string>("ready");
  const userReadyRef = useRef<boolean>(false);
  const opponentReadyRef = useRef<boolean>(false);
  const wsSendPlayerReadyRef = useRef<((isReady: boolean) => void) | null>(null);
  
  // Game state derived values
  // const gameStateStr = gameState?.status || "countdown"; // Unused
  const durationSeconds = 60;

  // Debug helper: allow forcing end-state screens via ?endState=victory|defeat|tie
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("endState");
    if (value === "victory" || value === "defeat" || value === "tie") {
      setDebugEndState(value);
    } else {
      setDebugEndState(null);
    }
  }, [location.search]);
  
  // Get selected exercise form rules
  const getSelectedExerciseRules = (): any => {
    if (!selectedExercise) return PUSHUP_FORM_RULES;
    const exercise = EXERCISE_OPTIONS.find((e) => e.id === selectedExercise);
    return exercise?.formRules || PUSHUP_FORM_RULES;
  };
  
  // Get current user ID and perform coin flip
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.id) {
          console.log(`✅ Player ID set: ${user.id}`);
          setPlayerId(user.id);
        } else {
          console.warn("⚠️ getCurrentUser() returned no ID");
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        // Try to get player ID from game state if available
        if (gameState) {
          // Check if we can infer player ID from game state
          // This is a fallback if auth fails
          const firebaseUser = auth?.currentUser;
          if (firebaseUser) {
            // Try to match Firebase UID with player IDs in game state
            // This is a workaround for CORS issues
            console.warn("Using fallback method to determine player ID");
          }
        }
      }
    };
    fetchUser();
  }, []);

  // HTTP fallback: Fetch game state if WebSocket fails or hasn't connected after 3 seconds
  useEffect(() => {
    if (!gameId || !playerId || gameState) return; // Already have game state

    let cancelled = false;
    const timeout = setTimeout(async () => {
      // Double-check that we still don't have game state (in case WebSocket connected in the meantime)
      if (cancelled) return;
      
      try {
        console.log(`🔄 WebSocket not connected, fetching game state via HTTP for game ${gameId}...`);
        const matchData = await apiGet<{
          id: number;
          player_a_id: number;
          player_b_id: number;
          player_a_score: number;
          player_b_score: number;
          current_round: number;
          status: string;
          current_exercise_id: number | null;
        }>(`/api/matches/${gameId}`);
        
        // Check again if we got game state from WebSocket while fetching
        if (cancelled) return;
        
        // Convert match API response to GameState format
        const fallbackGameState: GameState = {
          gameId: matchData.id,
          playerA: {
            id: matchData.player_a_id,
            score: matchData.player_a_score,
          },
          playerB: {
            id: matchData.player_b_id,
            score: matchData.player_b_score,
          },
          currentRound: matchData.current_round,
          status: matchData.status,
          exerciseId: matchData.current_exercise_id,
        };
        
        console.log(`✅ Fetched game state via HTTP fallback:`, fallbackGameState);
        setGameState(fallbackGameState);
        setCurrentRound(fallbackGameState.currentRound || 1);
        
        // If exercise is already selected, set it
        if (fallbackGameState.exerciseId) {
          const exerciseIdMap: Record<number, ExerciseType> = {
            1: "push-up",
            2: "squat",
            3: "plank",
            4: "lunge",
          };
          const exercise = exerciseIdMap[fallbackGameState.exerciseId];
          if (exercise) {
            setSelectedExercise(exercise);
            setShowExerciseSelection(false);
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch game state via HTTP fallback:", error);
      }
    }, 3000); // Wait 3 seconds before trying HTTP fallback

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [gameId, playerId, gameState]);

  // Coin flip logic - determine who chooses first (only for round 1)
  useEffect(() => {
    if (!playerId || !gameState || coinFlipResult !== null) {
      if (!playerId) console.log("⏳ Coin flip: Waiting for playerId...");
      if (!gameState) console.log("⏳ Coin flip: Waiting for gameState...");
      if (coinFlipResult !== null) console.log("✅ Coin flip: Already completed");
      return;
    }
    
    // Only do coin flip at the start of round 1
    const currentRoundNum = gameState.currentRound || 1;
    if (currentRoundNum !== 1) {
      console.log(`⏭️ Coin flip: Skipping (round ${currentRoundNum}, not round 1)`);
      setShowCoinFlip(false);
      setShowExerciseSelection(true); // Show exercise selection for later rounds
      return;
    }

    console.log("🎲 Starting coin flip logic...");
    
    // Perform coin flip: randomly choose between playerA and playerB
    const isPlayerA = gameState.playerA.id === playerId;
    const otherPlayerId = isPlayerA ? gameState.playerB.id : gameState.playerA.id;
    
    // Use a deterministic coin flip based on game ID and player IDs
    // This ensures both players get the same result
    const flipSeed = (gameId ? parseInt(gameId) : 0) + playerId + otherPlayerId;
    const flipResult = flipSeed % 2 === 0 ? gameState.playerA.id : gameState.playerB.id;
    
    console.log(`🎲 Coin flip result: Player ${flipResult} chooses first (seed: ${flipSeed})`);
    
    setCoinFlipResult(flipResult);
    setWhoseTurnToChoose(flipResult);
    setShowCoinFlip(true); // Ensure coin flip screen is shown
    
    // If it's this player's turn, show exercise selection after coin flip animation
    if (flipResult === playerId) {
      console.log("✅ It's your turn to choose! Will show exercise selection in 3 seconds...");
      setTimeout(() => {
        setShowCoinFlip(false);
        setShowExerciseSelection(true);
        console.log("✅ Exercise selection screen should now be visible");
      }, 3000); // Show coin flip for 3 seconds
    } else {
      console.log("⏳ Waiting for opponent to choose... Will show waiting screen in 3 seconds...");
      setTimeout(() => {
        setShowCoinFlip(false);
        setShowExerciseSelection(true); // Show waiting screen
        console.log("✅ Waiting screen should now be visible");
      }, 3000);
    }
  }, [playerId, gameState, coinFlipResult, gameId]);

  // Reset ready state when exercise is selected
  useEffect(() => {
    if (selectedExercise && gamePhase === "ready") {
      setUserReady(false);
      setOpponentReady(false);
      setStartCountdown(5);
      setTimeRemaining(60);
      setGamePhase("ready");
      // Don't reset readyPhaseRemaining here - wait for server timestamp
    }
  }, [selectedExercise, gamePhase]);

  // Ready phase timer (synced with server timestamp)
  useEffect(() => {
    if (!selectedExercise || gamePhase !== "ready" || !readyPhaseStartTime) return;

    const updateTimer = () => {
      const now = Date.now() / 1000; // Current time in seconds
      const elapsed = now - readyPhaseStartTime;
      const remaining = Math.max(0, 10 - elapsed);
      setReadyPhaseRemaining(Math.ceil(remaining));
      
      if (remaining <= 0) {
        setReadyPhaseRemaining(0);
      }
    };

    // Update immediately
    updateTimer();

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [selectedExercise, gamePhase, readyPhaseStartTime]);

  // Handle ready phase start from server (for timer synchronization)
  const handleReadyPhaseStart = useCallback((startTimestamp: number) => {
    console.log(`⏱️ Ready phase started at server time: ${startTimestamp}`);
    // Convert server timestamp (seconds) to client timestamp (milliseconds)
    // Account for potential clock skew by using relative time
    // const serverTimeMs = startTimestamp * 1000; // Unused
    // const clientTimeMs = Date.now(); // Unused
    // Store the server timestamp as-is, timer will calculate relative to current time
    setReadyPhaseStartTime(startTimestamp);
    setGamePhase("ready");
    setUserReady(false);
    setOpponentReady(false);
    setReadyPhaseRemaining(10); // Reset to 10 seconds
  }, []);

  // Handle countdown start from server (for timer synchronization)
  const handleCountdownStart = useCallback((startTimestamp: number, durationSeconds: number) => {
    console.log(`⏱️ COUNTDOWN_START received from server: startTimestamp=${startTimestamp}, durationSeconds=${durationSeconds}`);
    setCountdownStartTime(startTimestamp);
    setGamePhase("countdown");
    console.log(`✅ Game phase changed to: countdown`);
  }, []);

  // Note: Countdown start is now handled by the server when both players are ready
  // The server will send COUNTDOWN_START message to sync both players

  // 5-second countdown after both players ready (synced with server timestamp)
  useEffect(() => {
    if (gamePhase !== "countdown" || !countdownStartTime) return;

    const updateCountdown = () => {
      const now = Date.now() / 1000; // Current time in seconds
      const elapsed = now - countdownStartTime;
      const remaining = Math.max(0, 5 - elapsed);
      setStartCountdown(Math.ceil(remaining));
      
      if (remaining <= 0) {
        setStartCountdown(0);
        // Start the game!
        setGamePhase("live");
        setTimeRemaining(60);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [gamePhase, countdownStartTime]);

  // Update refs when state changes
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);
  
  useEffect(() => {
    userReadyRef.current = userReady;
  }, [userReady]);
  
  useEffect(() => {
    opponentReadyRef.current = opponentReady;
  }, [opponentReady]);

  // Game timer (1 minute) - only for non-plank exercises
  useEffect(() => {
    if (gamePhase !== "live" || selectedExercise === "plank") {
      // Reset timer when not live
      if (gamePhase !== "live") {
        setTimeRemaining(durationSeconds);
      }
      return;
    }

    // Reset timer to full duration when game becomes live
    setTimeRemaining(durationSeconds);
    setLastRepTime(Date.now()); // Reset inactivity timer when round starts

    let intervalCleared = false;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1 && !intervalCleared) {
          // Time's up! Send round end to backend
          console.log("⏰ Time's up! Sending ROUND_END to backend...");
          intervalCleared = true;
          clearInterval(interval); // Clear immediately
          
          // Set game phase to ended
          setGamePhase("ended");
          
          // Send round end
          const sendRoundEnd = sendRoundEndRef.current;
          if (sendRoundEnd) {
            sendRoundEnd();
            console.log("📤 ROUND_END sent to backend");
          } else {
            console.error("❌ sendRoundEnd is not available!");
          }
          return 0;
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => {
      if (!intervalCleared) {
        clearInterval(interval);
      }
    };
  }, [gamePhase, selectedExercise, playerId, gameState, durationSeconds]);

  // Inactivity timer - end round if no reps for 10 seconds
  useEffect(() => {
    if (gamePhase !== "live" || selectedExercise === "plank") return;

    let inactivityTriggered = false;
    const checkInactivity = setInterval(() => {
      if (inactivityTriggered) return;
      
      const timeSinceLastRep = Date.now() - lastRepTime;
      const inactivityThreshold = 10000; // 10 seconds

      if (timeSinceLastRep >= inactivityThreshold) {
        console.log("💤 10 seconds of inactivity - ending round...");
        inactivityTriggered = true;
        clearInterval(checkInactivity); // Clear immediately
        
        setGamePhase("ended");
        const sendRoundEnd = sendRoundEndRef.current;
        if (sendRoundEnd) {
          sendRoundEnd();
          console.log("📤 ROUND_END sent due to inactivity");
        } else {
          console.error("❌ sendRoundEnd is not available!");
        }
      }
    }, 1000); // Check every second

    return () => {
      if (!inactivityTriggered) {
        clearInterval(checkInactivity);
      }
    };
  }, [gamePhase, lastRepTime, selectedExercise]);

  const handlePlayerReady = useCallback((playerIdFromWS: number, isReady: boolean) => {
    console.log(`📨 PLAYER_READY received: playerId=${playerIdFromWS}, isReady=${isReady}, myPlayerId=${playerId}, gameState=${gameState ? JSON.stringify({playerA: gameState.playerA.id, playerB: gameState.playerB.id}) : 'null'}`);
    
    // The backend sends PLAYER_READY messages excluding the sender (exclude_player=player_id)
    // So if we receive a PLAYER_READY message, it's always from the opponent
    // However, let's double-check to be safe
    
    // If we have playerId, verify it's not our own
    if (playerId && playerIdFromWS === playerId) {
      console.warn(`⚠️ Received PLAYER_READY from ourselves (shouldn't happen - backend excludes sender): playerId=${playerIdFromWS}`);
      return; // Ignore our own ready status
    }
    
    // Verify the playerIdFromWS matches one of the players in the game
    if (gameState) {
      const isPlayerA = playerIdFromWS === gameState.playerA.id;
      const isPlayerB = playerIdFromWS === gameState.playerB.id;
      
      if (!isPlayerA && !isPlayerB) {
        console.warn(`⚠️ Received PLAYER_READY from unknown player: playerId=${playerIdFromWS} (not in game state)`);
        return;
      }
    }
    
    // This is the opponent's ready status - update it
    console.log(`✅ Setting opponent ready status: ${isReady} (from playerId=${playerIdFromWS})`);
    setOpponentReady(isReady);
    console.log(`📊 Current ready status - User: ${userReady}, Opponent: ${isReady}`);
  }, [playerId, gameState, userReady]);

  // WebSocket handlers (must be defined before useGameWebSocket)
  const handleGameState = useCallback((state: GameState) => {
    console.log("📊 Game state update:", state);
    setGameState(state);
    setCurrentRound(state.currentRound || 1);
    
    // Try to infer player ID from game state if we don't have it yet
    if (!playerId && auth?.currentUser) {
      // Try to match Firebase UID with player IDs in game state
      // This is a fallback if getCurrentUser() fails due to CORS
      // Note: This is a workaround - ideally we'd get player ID from auth
      // But if CORS blocks /api/auth/me, we can't get it that way
      console.warn("Player ID not set - cannot determine which player you are from game state alone");
    }
    
    // If game state has an exercise ID, map it to exercise type
    if (state.exerciseId) {
      const exerciseIdMap: Record<number, ExerciseType> = {
        1: "push-up",
        2: "squat",
        3: "plank",
        4: "lunge",
      };
      const exercise = exerciseIdMap[state.exerciseId];
      if (exercise) {
        // Always update exercise and hide selection screen when exercise is set
        // This is important for the waiting player in round 2+
        if (exercise !== selectedExercise) {
          console.log(`✅ Exercise selected via GAME_STATE: ${exercise} (ID: ${state.exerciseId})`);
        }
        setSelectedExercise(exercise);
        setShowExerciseSelection(false); // Hide waiting/exercise selection screen immediately
        // Set game phase to ready to ensure waiting screen condition fails
        setGamePhase("ready");
      }
    }
    
    // Handle round end state - show round end screen
    // NOTE: This should NOT trigger if handleRoundEnd callback already handled it
    // The ROUND_END WebSocket message should be the source of truth, not GAME_STATE
    if (state.status === "round_end" || state.status === "ended_time" || state.status === "ended_inactivity") {
      // Only handle here if handleRoundEnd hasn't been called yet
      // (handleRoundEnd is called from ROUND_END WebSocket message)
      if (!showRoundEnd && playerId) {
        console.log("📊 GAME_STATE shows round_end, but handleRoundEnd should handle this");
        // Don't duplicate round end handling - let handleRoundEnd callback do it
        // This is just a fallback for state updates
      }
    }
    
    // Update opponent info from game state
    // Only update reps from game state if NOT in live phase (to avoid overwriting live rep counts)
    if (playerId && state.status !== "active" && state.status !== "live") {
      const isPlayerA = state.playerA.id === playerId;
      const opponent = isPlayerA ? state.playerB : state.playerA;
      setOpponentReps(opponent.score);
      // You might want to fetch opponent name from backend
    }
  }, [playerId, selectedExercise, showRoundEnd]);

  const handleRoundStart = useCallback((round: number, exerciseId?: number) => {
    console.log(`🎮 Round ${round} starting with exercise ID: ${exerciseId}`);
    console.log(`🎮 Current showExerciseSelection: ${showExerciseSelection}, selectedExercise: ${selectedExercise}`);
    
    setCurrentRound(round);
    // CRITICAL: Hide exercise selection/waiting screen immediately for both players
    setShowExerciseSelection(false);
    setShowRoundEnd(false);
    setRoundEndData(null);
    
    // Reset timers for new round
    setCountdownRemaining(10);
    setTimeRemaining(durationSeconds);
    
    // Map exercise ID to exercise type if provided
    // This is important for the waiting player who receives ROUND_START
    if (exerciseId) {
      const exerciseIdMap: Record<number, ExerciseType> = {
        1: "push-up",
        2: "squat",
        3: "plank",
        4: "lunge",
      };
      const exercise = exerciseIdMap[exerciseId];
      if (exercise) {
        console.log(`🎮 Setting exercise from ROUND_START: ${exercise} (round ${round}) - HIDING WAITING SCREEN`);
        setSelectedExercise(exercise);
        // Force hide exercise selection screen (redundant but ensures it's hidden)
        setShowExerciseSelection(false);
        // Set game phase to ready so waiting screen condition fails
        setGamePhase("ready");
      } else {
        console.warn(`⚠️ Unknown exercise ID in ROUND_START: ${exerciseId}`);
      }
    } else {
      console.warn(`⚠️ ROUND_START received without exerciseId for round ${round}`);
      // Even without exerciseId, hide the waiting screen
      setShowExerciseSelection(false);
    }
    
    // Reset reps for new round
    setUserReps(0);
    setOpponentReps(0);
    lastSentRepCountRef.current = 0;
    setLastRepTime(Date.now()); // Reset inactivity timer for new round
  }, [durationSeconds, showExerciseSelection, selectedExercise]);

  const handleRoundEnd = useCallback((data: {
    winnerId: number | null;
    loserId: number | null;
    playerAScore: number;
    playerBScore: number;
    playerARoundsWon?: number;
    playerBRoundsWon?: number;
    gameOver?: boolean;
    matchWinnerId?: number | null;
    narrative: string;
    strategy: Record<string, unknown>;
    currentRound?: number;
  }) => {
    console.log("🏁 Round ended:", data);
    console.log(`📊 Current round when ending: ${currentRound}, from data: ${data.currentRound}`);
    
    // Update round wins (frontend tracking)
    if (data.winnerId === playerId) {
      setUserRoundsWon(prev => prev + 1);
    } else if (data.winnerId && data.winnerId !== playerId) {
      setOpponentRoundsWon(prev => prev + 1);
    }
    
    const newUserRoundsWon = data.winnerId === playerId ? userRoundsWon + 1 : userRoundsWon;
    const newOpponentRoundsWon = data.winnerId && data.winnerId !== playerId ? opponentRoundsWon + 1 : opponentRoundsWon;
    
    setRoundEndData({
      ...data,
      playerARoundsWon: gameState?.playerA.id === playerId ? newUserRoundsWon : newOpponentRoundsWon,
      playerBRoundsWon: gameState?.playerA.id === playerId ? newOpponentRoundsWon : newUserRoundsWon,
    });
    setShowRoundEnd(true);
    setRoundEndCountdown(5); // Reset countdown
    
    // Use the round number from the backend message (which is the round that just ended)
    // Prefer data.currentRound from backend, fallback to currentRound state
    const roundThatJustEnded = data.currentRound !== undefined ? data.currentRound : currentRound;
    console.log(`🔍 Round that just ended: ${roundThatJustEnded} (from data: ${data.currentRound}, from state: ${currentRound})`);
    console.log(`🔍 User wins: ${newUserRoundsWon}, Opponent wins: ${newOpponentRoundsWon}`);
    console.log(`🔍 Game over check: userWins >= 2? ${newUserRoundsWon >= 2}, opponentWins >= 2? ${newOpponentRoundsWon >= 2}, round >= 3? ${roundThatJustEnded >= 3}`);
    
    // Check if someone won 2 rounds (best of 3 winner) OR if we just completed round 3
    // Game ends if:
    // 1. Someone won 2 rounds (best of 3), OR
    // 2. Round 3 just ended (regardless of score - play all 3 rounds)
    const gameIsOver = newUserRoundsWon >= 2 || newOpponentRoundsWon >= 2 || roundThatJustEnded >= 3;
    
    console.log(`🔍 Game is over? ${gameIsOver} (reason: ${newUserRoundsWon >= 2 ? 'user won 2' : newOpponentRoundsWon >= 2 ? 'opponent won 2' : roundThatJustEnded >= 3 ? 'round 3 ended' : 'none'})`);
    
    if (gameIsOver) {
      console.log(`🎉 Game Over! Final score - You: ${newUserRoundsWon}, Opponent: ${newOpponentRoundsWon}, Round: ${roundThatJustEnded}`);
      setTimeout(() => {
        setShowGameOver(true);
        setShowRoundEnd(false);
      }, 5000);
      return;
    }
    
    console.log(`✅ Game continues to next round. Current: Round ${roundThatJustEnded}, Next: Round ${roundThatJustEnded + 1}`);
    
    // Determine who chooses next: loser chooses, or if tie, alternate
    let nextChooser: number | null = null;
    if (data.loserId) {
      // Loser chooses next round
      nextChooser = data.loserId;
    } else if (data.winnerId === null) {
      // Tie - alternate (if current chooser was player, next is opponent, and vice versa)
      if (whoseTurnToChoose === playerId) {
        nextChooser = gameState?.playerA.id === playerId ? gameState?.playerB.id : gameState?.playerA.id || null;
      } else {
        nextChooser = playerId;
      }
    }
    
    setWhoseTurnToChoose(nextChooser);
    
    // After showing round end screen, show exercise selection for next round
    setTimeout(() => {
      setShowRoundEnd(false);
      setSelectedExercise(null);
      // Backend will increment round number in next GAME_STATE update
      // Show exercise selection screen for both players
      // One will see the selection UI, the other will see the waiting screen
      setShowExerciseSelection(true);
    }, 5000); // Show round end screen for 5 seconds
  }, [currentRound, whoseTurnToChoose, playerId, gameState, userRoundsWon, opponentRoundsWon]);

  const handleRepIncrement = useCallback((playerIdFromWS: number, repCount: number) => {
    // Update opponent reps if it's not our player ID
    if (playerId && playerIdFromWS !== playerId) {
      console.log(`📈 Opponent rep update: ${repCount}`);
      setOpponentReps(repCount);
      setLastRepTime(Date.now()); // Update last rep time for inactivity tracking
    }
  }, [playerId]);

  const handleFormRules = useCallback((data: {
    exercise_id: number;
    exercise_name: string;
    form_rules: Record<string, unknown>;
  }) => {
    console.log("📋 Form rules received:", data);
    console.log("📋 Current selectedExercise:", selectedExercise);
    console.log("📋 Current showExerciseSelection:", showExerciseSelection);
    
    // When form rules are received, it means an exercise was selected
    // Map exercise ID to exercise type
    const exerciseIdMap: Record<number, ExerciseType> = {
      1: "push-up",
      2: "squat",
      3: "plank",
      4: "lunge",
    };
    const exercise = exerciseIdMap[data.exercise_id];
    
    if (exercise) {
      // Always update exercise when FORM_RULES is received (for rounds 2 and 3)
      // This ensures the waiting player gets the exercise selection
      // CRITICAL: Hide waiting screen immediately when exercise is selected
      console.log(`✅ Exercise selected via FORM_RULES: ${exercise} (ID: ${data.exercise_id}) - HIDING WAITING SCREEN`);
      setSelectedExercise(exercise);
      setShowExerciseSelection(false); // Hide exercise selection/waiting screen immediately
      setGamePhase("ready"); // Start ready phase and ensure waiting screen condition fails
      setReadyPhaseRemaining(10);
      setUserReady(false);
      setOpponentReady(false);
    } else {
      console.warn(`⚠️ Unknown exercise ID: ${data.exercise_id}`);
    }
  }, [selectedExercise, showExerciseSelection]);

  // WebSocket connection (must be after all handlers are defined)
  const {
    isConnected,
    error: wsError,
    sendRepIncrement: wsSendRepIncrement,
    sendRoundEnd: wsSendRoundEnd,
    sendExerciseSelected: wsSendExerciseSelected,
    sendPlayerReady: wsSendPlayerReady,
  } = useGameWebSocket({
    gameId: gameId ? parseInt(gameId) : 0,
    playerId: playerId || 0,
    onGameState: handleGameState,
    onRepIncrement: handleRepIncrement,
    onRoundStart: handleRoundStart,
    onRoundEnd: handleRoundEnd,
    onFormRules: handleFormRules,
    onPlayerReady: handlePlayerReady,
    onReadyPhaseStart: handleReadyPhaseStart,
    onCountdownStart: handleCountdownStart,
    autoConnect: !!gameId && !!playerId,
  });

  // Keep wsSendPlayerReady ref up to date
  useEffect(() => {
    wsSendPlayerReadyRef.current = wsSendPlayerReady || null;
  }, [wsSendPlayerReady]);

  // Round end countdown timer
  useEffect(() => {
    if (!showRoundEnd || roundEndCountdown <= 0) return;

    const interval = setInterval(() => {
      setRoundEndCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showRoundEnd, roundEndCountdown]);

  // Detect starting position during ready phase
  // TEMPORARILY COMMENTED OUT FOR TESTING - using manual button instead
  /*
  useEffect(() => {
    if (!detectorRef.current || !isCVReady || gamePhase !== "ready" || !selectedExercise) return;

    // Start detection to check starting position
    detectorRef.current.startDetection();
    
    // Track consecutive valid frames to avoid false positives
    let validFrameCount = 0;
    const CHECK_INTERVAL_MS = 100; // Check every 100ms (10 checks per second)
    const REQUIRED_VALID_FRAMES = 20; // Need 20 consecutive valid checks = 2 seconds (10 checks/second * 2 seconds = 20)
    
    // Import CV functions for starting position detection
    const checkStartingPosition = async () => {
      if (!detectorRef.current) return false;
      
      // Get latest detection result from detector
      const latestResult = (detectorRef.current as any).latestResult;
      if (!latestResult) return false;
      
      const { formValid, repState, landmarks } = latestResult;
      
      // Must have valid form
      if (!formValid || !landmarks || landmarks.length === 0) {
        return false;
      }
      
      // Check starting position based on exercise type
      if (selectedExercise === "push-up") {
        // For pushups: form must be valid AND must be at top position (not down)
        // Top position means: elbow angle > 160° (isDown === false)
        const isAtTop = !repState.isDown;
        return isAtTop;
      } else if (selectedExercise === "squat") {
        // For squats: use checkStandingForm to verify standing position
        const standingCheck = checkStandingForm(landmarks);
        return standingCheck.isValid;
      } else if (selectedExercise === "plank") {
        // For planks: form must be valid (plank position check is in form validation)
        return true;
      }
      
      return false;
    };
    
    // Check starting position periodically
    const checkInterval = setInterval(async () => {
      if (!detectorRef.current) return;

      const isInStartingPosition = await checkStartingPosition();
      
      // If in starting position, increment valid frame count
      if (isInStartingPosition) {
        validFrameCount++;
        const requiredChecks = REQUIRED_VALID_FRAMES; // 60 checks = 2 seconds at 30fps checking every 100ms
        if (validFrameCount >= requiredChecks && !userReady) {
          setUserReady(true);
          setIsInStartingPosition(true);
          const sendReady = wsSendPlayerReadyRef.current;
          if (sendReady) {
            console.log(`📤 Sending PLAYER_READY=true to server...`);
            sendReady(true);
            console.log(`✅ Player ready - held starting position for 2 seconds (${validFrameCount} checks)`);
          } else {
            console.error(`❌ wsSendPlayerReady is not available! Cannot send ready status. wsSendPlayerReady=${wsSendPlayerReady}, wsSendPlayerReadyRef.current=${wsSendPlayerReadyRef.current}`);
          }
        } else if (validFrameCount < requiredChecks) {
          // Still counting up - show progress
          const progress = Math.min(100, (validFrameCount / requiredChecks) * 100);
          if (validFrameCount % 10 === 0) { // Log every 10 checks to avoid spam
            console.log(`⏳ Holding position... ${progress.toFixed(0)}% (${validFrameCount}/${requiredChecks})`);
          }
        }
      } else {
        // Reset count if not in starting position
        if (validFrameCount > 0) {
          console.log(`⚠️ Lost starting position - resetting count (was at ${validFrameCount}/${REQUIRED_VALID_FRAMES})`);
        }
        validFrameCount = 0;
        if (userReady) {
          setUserReady(false);
          setIsInStartingPosition(false);
          const sendReady = wsSendPlayerReadyRef.current;
          if (sendReady) {
            console.log(`📤 Sending PLAYER_READY=false to server...`);
            sendReady(false);
            console.log("❌ Player no longer ready - moved out of starting position");
          } else {
            console.error(`❌ wsSendPlayerReady is not available! Cannot send ready status.`);
          }
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(checkInterval);
      if (detectorRef.current) {
        detectorRef.current.stopDetection();
      }
    };
  }, [gamePhase, isCVReady, selectedExercise, userReady]);
  */

  // Start/stop CV detection based on game phase
  useEffect(() => {
    if (!detectorRef.current || !isCVReady) return;

    if (gamePhase === "live") {
      // Start detection when game goes live
      detectorRef.current.resetRepCount();
      lastSentRepCountRef.current = 0; // Reset sent count when game starts
      setUserReps(0); // Reset displayed count
      detectorRef.current.startDetection();
      console.log("🎥 CV detection started - game is live");
    } else if (gamePhase === "ended") {
      // Stop detection when game ends
      detectorRef.current.stopDetection();
      console.log("⏹️ CV detection stopped - game ended");
    }
  }, [gamePhase, isCVReady]);

  // Store WebSocket functions in refs so CV callback can access them
  useEffect(() => {
    sendRepIncrementRef.current = wsSendRepIncrement;
  }, [wsSendRepIncrement]);

  useEffect(() => {
    sendRoundEndRef.current = wsSendRoundEnd;
  }, [wsSendRoundEnd]);

  useEffect(() => {
    sendExerciseSelectedRef.current = wsSendExerciseSelected;
  }, [wsSendExerciseSelected]);

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exercise: ExerciseType) => {
    console.log(`✅ Exercise selected: ${exercise}`);
    setSelectedExercise(exercise);
    setShowExerciseSelection(false);
    setGamePhase("ready"); // Start ready phase
    setReadyPhaseRemaining(10);
    setUserReady(false);
    setOpponentReady(false);
    
    // Map exercise type to exercise ID (you may need to adjust these IDs based on your backend)
    const exerciseIdMap: Record<ExerciseType, number> = {
      "push-up": 1,
      "squat": 2,
      "plank": 3,
      "lunge": 4,
    };
    
    const exerciseId = exerciseIdMap[exercise];
    if (sendExerciseSelectedRef.current && exerciseId) {
      sendExerciseSelectedRef.current(exerciseId);
      console.log(`📤 Selected exercise: ${exercise} (ID: ${exerciseId})`);
    }
  }, []);

  // Initialize CV detector (only when exercise is selected)
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !gameId || !selectedExercise) return;

    const initCV = async () => {
      try {
        // Request webcam access with mobile-friendly constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user", // Front-facing camera on mobile
          },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                resolve(void 0);
              };
            }
          });

          // Initialize CV detector
          const detector = new CVDetector();
          if (canvasRef.current) {
            await detector.initialize(videoRef.current, canvasRef.current);
          } else {
            await detector.initialize(videoRef.current);
          }
          
          // Set form rules based on selected exercise
          const exerciseRules = getSelectedExerciseRules();
          const exerciseName = selectedExercise || "push-up";
          detector.setFormRules(exerciseRules, exerciseName);
          
          // Set rep callback to send reps over WebSocket
          // Only count reps when both players are ready and game is live
          detector.setRepCallback((count) => {
            // Use refs to get latest values (avoid stale closures)
            const currentPhase = gamePhaseRef.current;
            const currentUserReady = userReadyRef.current;
            const currentOpponentReady = opponentReadyRef.current;
            
            // Only update reps if game is live and both players are ready
            if (currentPhase === "live" && currentUserReady && currentOpponentReady) {
              setUserReps(count);
              setLastRepTime(Date.now()); // Update last rep time for inactivity tracking
              // Send rep update via WebSocket only when count increases
              if (sendRepIncrementRef.current && count > lastSentRepCountRef.current) {
                sendRepIncrementRef.current(count);
                lastSentRepCountRef.current = count;
                console.log(`📤 Sent rep update: ${count}`);
              }
            } else {
              // Game not live or players not ready - don't count reps
              console.log(`⏸️ Rep detected but not counting: gamePhase=${currentPhase}, userReady=${currentUserReady}, opponentReady=${currentOpponentReady}`);
            }
          });

          // Set form error callback
          detector.setFormErrorCallback((errors) => {
            if (errors.length > 0) {
              console.warn("Form errors:", errors);
            }
          });

          // Set detection update callback to check starting position
          detector.setDetectionUpdateCallback((result) => {
            // Store latest detection result for starting position check
            if (detectorRef.current) {
              (detectorRef.current as any).latestResult = result;
            }
          });

          detectorRef.current = detector;
          setIsCVReady(true);
          setCvError(null);
          
          console.log("✅ CV Detector initialized");
        }
      } catch (error) {
        console.error("Failed to initialize CV:", error);
        let errorMessage = "Failed to initialize camera";
        
        if (error instanceof Error) {
          if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
          } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            errorMessage = "No camera found. Please connect a camera and try again.";
          } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
            errorMessage = "Camera is being used by another application. Please close other apps using the camera.";
          } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
            errorMessage = "Camera doesn't support required settings. Trying with default settings...";
            // Try again with minimal constraints
            try {
              const fallbackStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
              });
              if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                // Retry initialization with fallback stream
                // (You might want to call initCV again here or handle it differently)
              }
            } catch (fallbackError) {
              errorMessage = error.message || "Failed to initialize camera";
            }
          } else {
            errorMessage = error.message || "Failed to initialize camera";
          }
        }
        
        setCvError(errorMessage);
        setIsCVReady(false);
      }
    };

    initCV();

    // Cleanup
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stopDetection();
        detectorRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [gameId, selectedExercise]);

  // Game Over Screen
  if ((showGameOver || debugEndState === "victory" || debugEndState === "defeat") && (roundEndData || debugEndState)) {
    const effectiveRoundEndData =
      roundEndData ??
      ({
        winnerId: debugEndState === "victory" ? playerId ?? 1 : debugEndState === "defeat" ? null : null,
        loserId: null,
        playerAScore: 46,
        playerBScore: 39,
        playerARoundsWon: 2,
        playerBRoundsWon: 1,
        narrative: "",
        strategy: {},
      } as unknown as NonNullable<typeof roundEndData>);

    const userRounds =
      playerId && gameState?.playerA.id === playerId
        ? effectiveRoundEndData!.playerARoundsWon || 0
        : effectiveRoundEndData!.playerBRoundsWon || 0;
    const opponentRounds =
      playerId && gameState?.playerA.id === playerId
        ? effectiveRoundEndData!.playerBRoundsWon || 0
        : effectiveRoundEndData!.playerARoundsWon || 0;

    let isMatchWinner = userRounds > opponentRounds;
    if (debugEndState === "victory") isMatchWinner = true;
    if (debugEndState === "defeat") isMatchWinner = false;

    const isTie = userRounds === opponentRounds && !debugEndState;
    const isDefeat = !isMatchWinner && !isTie;

    const isPlayerA = playerId && gameState?.playerA.id === playerId;
    const userScore = isPlayerA
      ? effectiveRoundEndData!.playerAScore
      : effectiveRoundEndData!.playerBScore;
    const opponentScore = isPlayerA
      ? effectiveRoundEndData!.playerBScore
      : effectiveRoundEndData!.playerAScore;

    const maskStyle: React.CSSProperties = {
      WebkitMaskImage:
        "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
      maskImage:
        "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
    };

    const fxFilterStyle: React.CSSProperties = {
      // Liquid glass filter from FxFilter.js
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore -- CSS custom property not in standard typings
      "--fx-filter": "blur(4px) liquid-glass(2, 10) saturate(1.25)",
    };

    return (
      <>
        <main className="min-h-screen bg-[#050712] text-slate-100 flex items-center justify-center p-4 md:p-8">
          <div className="relative w-full max-w-5xl mx-auto">
            {/* Background grid + diagonal accent */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              <div
                className={`absolute inset-0 opacity-[0.12] ${
                  isTie
                    ? "bg-[radial-gradient(circle_at_top,_#63FF00_0,_transparent_55%),radial-gradient(circle_at_bottom,_#e11d74_0,_transparent_55%)]"
                    : isDefeat
                    ? "bg-[radial-gradient(circle_at_top,_#fb7185_0,_transparent_55%),radial-gradient(circle_at_bottom,_#ea580c_0,_transparent_55%)]"
                    : "bg-[radial-gradient(circle_at_top,_#63FF00_0,_transparent_55%),radial-gradient(circle_at_bottom,_#22d3ee_0,_transparent_55%)]"
                }`}
              />
              <div className="absolute inset-[1px] bg-[linear-gradient(to_right,_rgba(148,163,184,0.18)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(148,163,184,0.18)_1px,_transparent_1px)] bg-[size:32px_32px] mix-blend-screen opacity-50" />
              <div className="absolute -top-16 -left-24 w-80 h-80 bg-emerald-400/25 blur-3xl rotate-[-18deg]" />
              <div className="absolute -bottom-20 -right-24 w-80 h-80 bg-fuchsia-500/25 blur-3xl rotate-[18deg]" />
            </div>

            {/* Main container panel */}
            <div
              className="relative border border-slate-800/80 bg-slate-950/60 rounded-3xl shadow-[0_32px_90px_rgba(0,0,0,0.75)] overflow-hidden"
              style={{ ...maskStyle, ...fxFilterStyle }}
            >
              {/* Top accent bar */}
              <div
                className={`h-1 w-full bg-gradient-to-r opacity-80 ${
                  isTie
                    ? "from-[#63FF00] via-fuchsia-500 to-sky-400"
                    : isDefeat
                    ? "from-[#fb7185] via-[#f97316] to-[#facc15]"
                    : "from-[#63FF00] via-fuchsia-500 to-sky-400"
                }`}
              />

              <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-5 md:py-6 lg:py-8 space-y-6 md:space-y-8">
                {/* Header / hero */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border shadow-[0_0_25px_rgba(99,255,0,0.35)] ${
                        isTie
                          ? "border-[#63FF00]/60 bg-slate-900/80"
                          : isDefeat
                          ? "border-[#fb7185]/70 bg-[#fb7185]/10 shadow-[0_0_25px_rgba(251,113,133,0.55)]"
                          : "border-emerald-400/40 bg-emerald-500/10"
                      }`}
                    >
                      <span
                        className={`inline-flex h-2 w-2 rounded-full shadow-[0_0_12px_rgba(99,255,0,0.9)] ${
                          isTie
                            ? "bg-[#63FF00] shadow-[0_0_16px_rgba(236,72,153,0.9)]"
                            : isDefeat
                            ? "bg-[#fb7185] shadow-[0_0_12px_rgba(251,113,133,0.95)]"
                            : "bg-[#63FF00]"
                        }`}
                      />
                      <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/90 font-medium">
                        Ranked Match Result
                      </span>
                    </div>

                    <div className="flex items-end gap-3">
                      <h1
                        className={`text-3xl sm:text-4xl md:text-[40px] leading-tight tracking-tight audiowide-regular ${
                          isTie
                            ? "bg-gradient-to-r from-[#63FF00] via-fuchsia-400 to-sky-400 text-transparent bg-clip-text drop-shadow-[0_0_28px_rgba(236,72,153,0.85)]"
                            : isDefeat
                            ? "text-[#fb7185] drop-shadow-[0_0_18px_rgba(251,113,133,0.75)]"
                            : "text-[#63FF00] drop-shadow-[0_0_18px_rgba(99,255,0,0.65)]"
                        }`}
                      >
                        {isTie ? "MATCH TIED" : isMatchWinner ? "VICTORY" : "DEFEAT"}
                      </h1>
                      <span className="text-xs sm:text-sm uppercase tracking-[0.24em] text-slate-400">
                        {isTie
                          ? "Too close to call"
                          : isMatchWinner
                          ? "You outpaced your rival"
                          : "Your rival edged ahead this time"}
                      </span>
                    </div>

                    <p className="text-sm sm:text-[13px] text-slate-300/85 max-w-xl">
                      {isTie
                        ? "Neither side gave an inch—tempo and rep pacing were nearly identical. This one could've gone either way."
                        : isMatchWinner
                        ? "You won the match! Your tempo spikes carried the win—lock in that pacing to climb the ladder."
                        : "Tough loss, but your pacing shows real potential—tune the final stretch and you’ll start converting these into wins."}
                    </p>
                  </div>

                  {/* Mini match badge (no season/tier for now) */}
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] text-slate-400 uppercase tracking-[0.24em]">
                      <span className="text-slate-400/80">FitDuo</span>
                      <span className="text-slate-500/80">VS BATTLE</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-slate-900 via-slate-700/70 to-slate-900" />

                {/* Score Summary */}
                <section className="grid md:grid-cols-[1.15fr_1fr] gap-5 md:gap-6 items-stretch">
                  {/* Score: You vs Opponent */}
                  <div className="relative border border-slate-800/90 rounded-2xl bg-slate-950/70 px-4 sm:px-5 py-4 sm:py-5 overflow-hidden">
                    <div className="pointer-events-none absolute -top-24 right-[-40%] w-80 h-80 bg-gradient-to-br from-emerald-500/25 via-emerald-500/5 to-transparent opacity-60 rotate-[-16deg]" />

                    <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.26em] text-slate-400">
                          Final score
                    </span>
                        <div className="flex items-end gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-[32px] tracking-tight text-slate-50 audiowide-regular">
                              {userRounds}
                            </span>
                            <span className="text-lg text-slate-500 font-medium">
                              –
                            </span>
                            <span className="text-3xl sm:text-[32px] tracking-tight text-slate-400 audiowide-regular">
                              {opponentRounds}
                            </span>
                    </div>
                          <span className="text-[11px] uppercase tracking-[0.26em] text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/40 rounded-full px-2 py-0.5">
                            {isTie ? "Perfect Balance" : "Best of 3"}
                          </span>
                  </div>
              </div>

                      {/* Round chips - static 3-round layout */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-400/50 bg-emerald-500/10">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                              R1
                            </span>
                            <span className="text-[10px] font-medium text-emerald-300">
                              {userRounds >= 1 ? "W" : "L"}
                            </span>
                </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-400/50 bg-emerald-500/10">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                              R2
                            </span>
                            <span className="text-[10px] font-medium text-emerald-300">
                              {userRounds >= 2 ? "W" : "L"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-fuchsia-500/60 bg-fuchsia-500/10">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                              R3
                            </span>
                            <span className="text-[10px] font-medium text-fuchsia-300">
                              {userRounds === opponentRounds ? "—" : userRounds > opponentRounds ? "W" : "L"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 text-right max-w-[180px]">
                          Best-of-three match closed out at {userRounds}
                          –{opponentRounds}.{" "}
                          {isTie
                            ? "Pacing symmetry stayed locked in from start to finish."
                            : isMatchWinner
                            ? "Your early rounds created the gap."
                            : "A late surge from your rival decided it."}
                        </p>
                </div>
              </div>

                    {/* You vs Opponent rows */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="relative rounded-xl border border-emerald-500/50 bg-emerald-500/8 px-3 py-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-[0.26em] text-slate-300">
                            You
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 uppercase tracking-[0.18em]">
                            {isTie ? "Tied" : isMatchWinner ? "Winner" : "Fighter"}
                          </span>
                </div>
                        <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400">
                              Rounds Won
                            </span>
                            <span className="text-sm text-emerald-300 font-medium">
                              {userRounds} / 3
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5 text-emerald-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                d="M7 17L17 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 7H17V16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>
                              {isTie
                                ? "MMR Stable"
                                : isMatchWinner
                                ? "+MMR Gain"
                                : "MMR Stable"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-[0.26em] text-slate-400">
                            Opponent
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 uppercase tracking-[0.18em]">
                            Rival
                          </span>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">
                              Rounds Won
                            </span>
                            <span className="text-sm text-fuchsia-300 font-medium">
                              {opponentRounds} / 3
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5 text-fuchsia-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                d="M7 7L17 17"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M17 8V17H8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>
                              {isTie
                                ? "MMR Stable"
                                : isMatchWinner
                                ? "MMR Loss"
                                : "+MMR Gain"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key stats panel */}
                  <div className="relative border border-slate-800/90 rounded-2xl bg-slate-950/70 px-4 sm:px-5 py-4 sm:py-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#63FF00] shadow-[0_0_10px_rgba(99,255,0,0.9)]" />
                        <h2 className="text-xs uppercase tracking-[0.26em] text-slate-300">
                          Performance Snapshot
                        </h2>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        1-min Battle
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Total Reps */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-emerald-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <polyline
                                points="22 12 18 12 15 21 9 3 6 12 2 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                              Total Reps (Last Round)
                            </span>
                            <span className="text-xs text-slate-300">
                              Overall volume in the final round.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 text-right">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-300/90 uppercase tracking-[0.18em]">
                              You
                            </span>
                            <span className="text-sm text-emerald-200 font-medium">
                              {userScore}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-fuchsia-300/90 uppercase tracking-[0.18em]">
                              Rival
                            </span>
                            <span className="text-sm text-fuchsia-200 font-medium">
                              {opponentScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Best Round Reps */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl border border-sky-500/40 bg-sky-500/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-sky-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                d="M12 3C12.5 5 14 6.5 15 8.5C16 10.5 16.5 13 15 15.5C14 17.25 12.75 18 12 18C11.25 18 10 17.25 9 15.5C7.5 13 8 10.5 9 8.5C10 6.5 11.5 5 12 3Z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10.5 14C11 14.75 11.5 15 12 15C12.5 15 13 14.75 13.5 14"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                              Best Round Reps
                            </span>
                            <span className="text-xs text-slate-300">
                              Peak output snapshot (this round).
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 text-right">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-300/90 uppercase tracking-[0.18em]">
                              You
                            </span>
                            <span className="text-sm text-emerald-200 font-medium">
                              {userScore}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-fuchsia-300/90 uppercase tracking-[0.18em]">
                              Rival
                            </span>
                            <span className="text-sm text-fuchsia-200 font-medium">
                              {opponentScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Consistency Score - placeholder for now */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl border border-slate-600/70 bg-slate-900/80 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-slate-200"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                d="M3 3v18h18"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M19 9l-4 4-3-3-4 4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                              Consistency Score
                            </span>
                            <span className="text-xs text-slate-300">
                              Steady cadence through most of the round.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 text-right">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-300/90 uppercase tracking-[0.18em]">
                              You
                            </span>
                            <span className="text-sm text-emerald-200 font-medium">
                              88
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-fuchsia-300/90 uppercase tracking-[0.18em]">
                              Rival
                            </span>
                            <span className="text-sm text-fuchsia-200 font-medium">
                              81
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tiny legend */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80 mt-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-3 rounded-full bg-emerald-400" />
                          <span className="text-[11px] text-slate-400">You</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-3 rounded-full bg-fuchsia-400" />
                          <span className="text-[11px] text-slate-400">
                            Opponent
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-[0.22em]">
                        Live telemetry
                      </div>
                    </div>
                  </div>
                </section>

                {/* Coaching insight + CTA stack */}
                <section className="grid md:grid-cols-[1.2fr_1fr] gap-5 md:gap-6">
                  <div className="relative border border-slate-800/90 rounded-2xl bg-slate-950/80 px-4 sm:px-5 py-4 sm:py-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-7 w-7 rounded-full border border-emerald-400/50 bg-emerald-500/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-emerald-300"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M12 8V4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <rect x="7" y="8" width="10" height="9" rx="2" ry="2" />
                          <path
                            d="M5 11H3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 11h-2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <path
                            d="M8 17c.6.6 1.5 1 2.5 1h3c1 0 1.9-.4 2.5-1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xs uppercase tracking-[0.26em] text-slate-300">
                          Coaching Insight
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Powered by FitDuo Pace Engine
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed">
                      {effectiveRoundEndData.narrative
                        ? effectiveRoundEndData.narrative
                        : isTie
                        ? "Neither side gave an inch—your cadence, tempo, and rep quality tracked almost perfectly. Lean into micro-pacing drills to find the tiny edge that turns stalemates into streaks."
                        : isMatchWinner
                        ? "You surged ahead mid-match with faster, cleaner reps. Your pacing only dipped slightly in the final seconds—lock in that finish and you’ll snowball future matches."
                        : "Your rival found momentum late in the match. Stabilize your cadence earlier and protect your pacing in the final 15 seconds to flip these close losses into wins."}
                    </p>

                    <div className="mt-3.5 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-slate-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="13" r="6" />
                          <path
                            d="M12 10v3l1.5 1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 4h6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Focus next: end-game endurance</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-emerald-300"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="12" r="7" />
                          <path
                            d="M3 12h3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M18 12h3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 3v3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 18v3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Suggested: 2× tempo drills</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA stack */}
                  <div className="flex flex-col gap-3 sm:gap-4 justify-between">
                    {/* Primary CTA */}
                    <button
                      className="relative group w-full inline-flex items-center justify-center px-4 py-3.5 rounded-2xl overflow-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(99,255,0,0.35),transparent_60%),linear-gradient(to_right,#63FF00,#22c55e,#a855f7)] shadow-[0_0_35px_rgba(99,255,0,0.4)] border border-emerald-400/70 hover:border-emerald-300 transition-all duration-300"
                      onClick={() => {
                        try {
                          localStorage.setItem("app_initial_tab", "battle");
                        } catch {
                          // ignore storage errors
                        }
                        navigate("/app"); // Navigate to matchmaking screen without auto-starting
                      }}
                    >
                      <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-60 group-hover:translate-x-[120%] transition-transform duration-700 ease-out" />
                      <span className="relative flex items-center gap-2 text-[13px] uppercase tracking-[0.26em] text-slate-950 font-medium">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-slate-950"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path
                            d="M2 12h2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 2v2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20 12h2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 20v2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 12l4-4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                    Return to Matchmaking
                  </span>
                      <span className="absolute inset-0 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </button>

                    {/* Secondary CTAs */}
                    <div className="relative border border-slate-800/90 rounded-2xl bg-slate-950/80 px-4 sm:px-5 py-3.5 sm:py-4">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <h4 className="text-[11px] uppercase tracking-[0.26em] text-slate-300">
                          Aftermatch Actions
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Choose your next move
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5 text-[13px]">
                        <button
                          type="button"
                          className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-slate-200 bg-slate-900/60 border border-slate-700/80 hover:border-emerald-400/60 hover:bg-slate-900 transition-colors group"
                          onClick={() => navigate("/history")}
                        >
                          <span className="flex items-center gap-2.5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                d="M3 3v18h18"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <rect
                                x="7"
                                y="10"
                                width="2"
                                height="5"
                                rx="0.5"
                              />
                              <rect
                                x="11"
                                y="8"
                                width="2"
                                height="7"
                                rx="0.5"
                              />
                              <rect
                                x="15"
                                y="6"
                                width="2"
                                height="9"
                                rx="0.5"
                              />
                            </svg>
                            <span>View match stats</span>
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3 text-slate-500 group-hover:text-emerald-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M9 18l6-6-6-6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-slate-300 bg-slate-950/60 border border-slate-700/80 hover:border-fuchsia-400/70 hover:bg-slate-900 transition-colors group"
                          onClick={() => navigate("/discover")}
                        >
                          <span className="flex items-center gap-2.5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5 text-slate-400 group-hover:text-fuchsia-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <rect
                                x="3"
                                y="9"
                                width="3"
                                height="6"
                                rx="0.5"
                              />
                              <rect
                                x="18"
                                y="9"
                                width="3"
                                height="6"
                                rx="0.5"
                              />
                              <rect
                                x="8"
                                y="10"
                                width="8"
                                height="4"
                                rx="0.5"
                              />
                            </svg>
                            <span>Change exercise</span>
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3 text-slate-500 group-hover:text-fuchsia-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M9 18l6-6-6-6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-slate-300 bg-slate-950/40 border border-slate-700/70 hover:border-sky-400/80 hover:bg-slate-900/80 transition-colors group"
                          onClick={() => {
                            try {
                              localStorage.setItem("app_initial_tab", "workout");
                            } catch {
                              // ignore storage errors
                            }
                            navigate("/app");
                          }}
                        >
                          <span className="flex items-center gap-2.5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-300"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <circle cx="14" cy="5" r="1.75" />
                              <path
                                d="M9 20l2-5 2.5-2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11 11l1.5-2.5 3 1.5 2.5 2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M6 12l3 1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>Practice solo</span>
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3 text-slate-500 group-hover:text-sky-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M9 18l6-6-6-6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Footer metadata bar */}
                <footer className="mt-1 border-t border-slate-800/90 pt-3 sm:pt-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="uppercase tracking-[0.22em] text-slate-300/90">
                          Exercise
                        </span>
                        <span className="text-slate-400/90">
                          1-min Battle
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                        <span className="uppercase tracking-[0.22em] text-slate-300/90">
                          Mode
                        </span>
                        <span className="text-slate-400/90">Ranked Duo</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3 text-slate-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M5 9h14"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5 15h14"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M11 4L9 20"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 4l-2 16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="uppercase tracking-[0.22em] text-slate-300/90">
                          Match
                        </span>
                        <span className="text-slate-500/90">
                          Best of 3 • {userRounds}-{opponentRounds}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-slate-500">
                      <span>Finished • Live session</span>
                      <span className="hidden sm:inline-block h-3 w-px bg-slate-700/80" />
                      <span className="uppercase tracking-[0.22em] text-slate-500/90">
                        FitDuo Arena
                      </span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Round End Screen
  if ((showRoundEnd || debugEndState === "tie") && (roundEndData || debugEndState === "tie")) {
    const effectiveRoundEndData =
      roundEndData ??
      ({
        winnerId: null,
        loserId: null,
        playerAScore: 40,
        playerBScore: 40,
        playerARoundsWon: 1,
        playerBRoundsWon: 1,
        narrative: "",
        strategy: {},
      } as unknown as NonNullable<typeof roundEndData>);

    const isWinner = playerId && effectiveRoundEndData!.winnerId === playerId;
    const isTie = debugEndState === "tie" ? true : effectiveRoundEndData!.winnerId === null;
    const userScore =
      playerId && gameState?.playerA.id === playerId
        ? effectiveRoundEndData!.playerAScore
        : effectiveRoundEndData!.playerBScore;
    const opponentScore =
      playerId && gameState?.playerA.id === playerId
        ? effectiveRoundEndData!.playerBScore
        : effectiveRoundEndData!.playerAScore;
    const userRoundsWon =
      playerId && gameState?.playerA.id === playerId
        ? effectiveRoundEndData!.playerARoundsWon || 0
        : effectiveRoundEndData!.playerBRoundsWon || 0;
    const opponentRoundsWon =
      playerId && gameState?.playerA.id === playerId
        ? effectiveRoundEndData!.playerBRoundsWon || 0
        : effectiveRoundEndData!.playerARoundsWon || 0;

    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-semibold text-lime-400 audiowide-regular mb-4">
                Round {currentRound} Complete
              </h1>
              
              {/* Winner/Loser/Tie Display with shimmer card */}
              <div className="mt-8 mb-6 flex justify-center">
                <ShimmerCard
                  variant={isTie ? "primary" : isWinner ? "success" : "secondary"}
                  className="max-w-xl ai-stagger-card"
                >
                  <div className="flex items-center justify-center gap-4">
                    {isTie ? (
                      <div className="inline-flex h-10 w-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-[0_0_24px_rgba(148,163,184,0.8)] items-center justify-center">
                        <span className="audiowide-regular text-xs text-slate-900">
                          =
                        </span>
                      </div>
                    ) : isWinner ? (
                      <div className="inline-flex h-10 w-10 rounded-full bg-gradient-to-br from-lime-300 to-emerald-500 shadow-[0_0_24px_rgba(132,255,78,0.9)] items-center justify-center">
                        <span className="audiowide-regular text-xs text-black">
                          W
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 shadow-[0_0_24px_rgba(244,63,94,0.9)] items-center justify-center">
                        <span className="audiowide-regular text-xs text-black">
                          L
                        </span>
                      </div>
                    )}

                    <div className="text-left">
                      <p className="text-2xl font-semibold audiowide-regular text-slate-100">
                        {isTie
                          ? "It’s a Tie!"
                          : isWinner
                          ? "You Won This Round!"
                          : "You Lost This Round"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        First to 2 rounds wins the match. Keep your pace and form dialed in.
                      </p>
                    </div>
                  </div>
                </ShimmerCard>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
                <div className="bg-[#020511]/80 border border-lime-400/30 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Your Score</p>
                  <p className="text-3xl font-semibold text-lime-400">{userScore}</p>
                </div>
                <div className="bg-[#020511]/80 border border-sky-400/30 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Opponent Score</p>
                  <p className="text-3xl font-semibold text-sky-400">{opponentScore}</p>
                </div>
              </div>

              {/* Round Wins with shimmer pill */}
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-2">Match Score (Best of 3 Rounds)</p>
                <div className="inline-flex items-center gap-4 rounded-xl px-6 py-3 bg-gradient-to-r from-lime-400/15 via-fuchsia-500/10 to-sky-400/15 border border-slate-600">
                  <span className="text-lime-300 font-semibold">
                    You: {userRoundsWon}
                  </span>
                  <span className="text-slate-500">-</span>
                  <span className="text-sky-300 font-semibold">
                    Opponent: {opponentRoundsWon}
                  </span>
                </div>
              </div>

              {/* Narrative */}
              {effectiveRoundEndData.narrative && (
                <div className="max-w-2xl mx-auto bg-[#020511]/60 border border-slate-700 rounded-xl p-6 mb-6">
                  <p className="text-sm text-slate-300 italic">
                    {effectiveRoundEndData.narrative}
                  </p>
                </div>
              )}

              {/* Next Round Info with ElectricButton-style CTA */}
              {currentRound < 3 && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-3 bg-slate-700/30 border border-slate-600 rounded-xl px-6 py-3">
                    <span className="text-2xl audiowide-regular text-lime-300">
                      {roundEndCountdown}
                    </span>
                    <p className="text-slate-400">
                      {effectiveRoundEndData.loserId === playerId
                        ? "You’ll choose the next exercise."
                        : "Waiting for your rival to choose the next exercise."}
                    </p>
                  </div>

                  <ElectricButton
                    className="mt-1"
                    onClick={() => {
                      // No-op for now – server controls the actual transition.
                      // We keep this as a visual "Next Round" affordance.
                    }}
                  >
                    Next Round
                  </ElectricButton>
                </div>
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  // Coin Flip Screen
  if (showCoinFlip && coinFlipResult !== null && gameState) {
    const isPlayerA = gameState.playerA.id === playerId;
    const isWinner = coinFlipResult === playerId;
    const winnerName = coinFlipResult === gameState.playerA.id 
      ? (isPlayerA ? "You" : "Player A")
      : (isPlayerA ? "Player B" : "You");

    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl text-center">
            <div className="mb-8">
              <h1 className="text-5xl font-semibold text-lime-400 audiowide-regular mb-4 flex items-center justify-center gap-3">
                <span className="inline-flex h-10 w-10 rounded-full bg-gradient-to-br from-lime-300 via-emerald-400 to-fuchsia-500 shadow-[0_0_30px_rgba(132,255,78,0.8)] items-center justify-center text-xs tracking-[0.2em] uppercase text-black">
                  FLIP
                </span>
                <span>Coin Flip</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8">
                Determining who chooses the exercise first...
              </p>
              
              {/* Animated coin */}
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lime-400 via-emerald-500 to-fuchsia-500 shadow-[0_0_40px_rgba(132,255,78,0.7)] animate-spin" style={{ animationDuration: "1s" }} />
                  <div className="absolute inset-2 rounded-full bg-[#020617] border border-lime-300/60 flex items-center justify-center">
                    <span className="audiowide-regular text-sm tracking-[0.18em] text-lime-300">
                      VS
                    </span>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="mt-8">
                {isWinner ? (
                  <div className="inline-flex items-center gap-3 bg-lime-500/20 border-2 border-lime-400 rounded-2xl px-8 py-4">
                    <span className="inline-flex h-9 w-9 rounded-full bg-gradient-to-br from-lime-300 to-emerald-500 shadow-[0_0_24px_rgba(132,255,78,0.9)] items-center justify-center">
                      <span className="audiowide-regular text-xs text-black">YOU</span>
                    </span>
                    <span className="text-2xl font-semibold text-lime-300">You Choose First!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-3 bg-slate-700/50 border-2 border-slate-500 rounded-2xl px-8 py-4">
                    <span className="inline-flex h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-fuchsia-500 shadow-[0_0_24px_rgba(56,189,248,0.8)] items-center justify-center">
                      <span className="audiowide-regular text-[10px] text-black">
                        RIVAL
                      </span>
                    </span>
                    <span className="text-2xl font-semibold text-slate-300">
                      {winnerName} Chooses First
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Exercise Selection Screen (only show if it's this player's turn)
  // Also check that we haven't received ROUND_START yet
  // Show if we're not in active game phases (countdown/live) - allow "ready" and "ended" phases
  if (showExerciseSelection && !selectedExercise && whoseTurnToChoose === playerId && gamePhase !== "countdown" && gamePhase !== "live") {
    // If we have roundEndData (meaning a round just ended), we're selecting for the NEXT round
    // so display currentRound + 1. Otherwise (first round), display currentRound
    const hasCompletedAnyRound = roundEndData !== null;
    const displayRound = hasCompletedAnyRound ? currentRound + 1 : currentRound;
    console.log("✅ Rendering exercise selection screen (your turn to choose)");
    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-semibold text-lime-400 audiowide-regular mb-2">
                Round {displayRound}
              </h1>
              <p className="text-lg text-slate-300">
                Choose your exercise for this round
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Best of 3 rounds - First to win 2 rounds wins the match
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {EXERCISE_OPTIONS.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleExerciseSelect(exercise.id)}
                  className="group relative rounded-2xl border-2 border-lime-400/30 bg-[#020511]/80 backdrop-blur-sm p-6 hover:border-lime-400/60 hover:bg-[#020511] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(132,255,78,0.3)]"
                >
                  <div className="mb-3 flex items-center justify-center">
                    {exercise.id === "push-up" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-10 w-10 text-lime-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="3" rx="1" />
                        <path d="M7 14v3" />
                        <path d="M17 14v3" />
                      </svg>
                    )}
                    {exercise.id === "squat" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-10 w-10 text-lime-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="5" r="2" />
                        <path d="M9 22l1.5-5.5L8 11l4-2 4 2-2.5 5.5L15 22" />
                      </svg>
                    )}
                    {exercise.id === "plank" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-10 w-10 text-lime-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 14h18l-1 3H4z" />
                        <path d="M6 11l4-2 4 1 4 2" />
                      </svg>
                    )}
                    {exercise.id === "lunge" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-10 w-10 text-lime-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="10" cy="5" r="2" />
                        <path d="M8 22v-4l2-3 3-1" />
                        <path d="M14 22v-5l-2-3" />
                        <path d="M7 10l3-1 3 1" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-lime-300 mb-1 audiowide-regular">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-slate-400">{exercise.description}</p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-lime-400/0 to-lime-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ))}
            </div>

            {!isConnected && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-sm text-red-300">
                  <span className="animate-pulse">●</span>
                  {wsError ? `Connection Error: ${wsError}` : "Connecting to game..."}
                </div>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  // Waiting for opponent to choose exercise (only show if exercise not yet selected)
  // Also check that we haven't received ROUND_START yet (which would set selectedExercise)
  // Show if we're not in active game phases (countdown/live) - allow "ready" and "ended" phases
  if (showExerciseSelection && !selectedExercise && whoseTurnToChoose !== playerId && whoseTurnToChoose !== null && gamePhase !== "countdown" && gamePhase !== "live") {
    // If we have roundEndData (meaning a round just ended), we're waiting for the NEXT round
    // so display currentRound + 1. Otherwise (first round), display currentRound
    const hasCompletedAnyRound = roundEndData !== null;
    const displayRound = hasCompletedAnyRound ? currentRound + 1 : currentRound;
    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold text-lime-400 audiowide-regular mb-4">
                Round {displayRound}
              </h1>
              <p className="text-lg text-slate-300 mb-8">
                Waiting for opponent to choose exercise...
              </p>
              
              {/* Loading animation */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
                </div>
              </div>

              <p className="text-sm text-slate-400">
                Your opponent is selecting the exercise for this round
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Full-screen glass layer so the entire arena background is blurred */}
      <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />

      <main className="relative min-h-[calc(100vh-120px)] text-neutral-50 flex z-10">
        <div className="flex-1 flex items-center justify-center px-4 pt-8 pb-24">
          <div className="w-full max-w-4xl space-y-8">
            {/* Round Indicator with per-letter intro animation */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/30 rounded-full px-4 py-2 text-sm text-lime-300">
                <AnimatedTitle text={`Round ${currentRound} of 3`} />
                {selectedExercise && (
                  <>
                    <span className="text-lime-400/50">•</span>
                    <AnimatedTitle
                      text={selectedExercise.replace("-", " ")}
                      className="capitalize"
                    />
                  </>
                )}
              </div>
            </div>

            {/* CV Video Feed - Hidden but active for detection */}
            <div className="fixed top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-lime-400/30 bg-black/80 z-20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              {!isCVReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-lime-300">
                  {cvError ? "Camera Error" : "Initializing CV..."}
                </div>
              )}
            </div>

            {/* WebSocket Status Indicator */}
            {!isConnected && (
              <div className="fixed top-4 left-4 bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2 text-xs text-red-300 z-20">
                {wsError ? `WS Error: ${wsError}` : "Connecting to game..."}
              </div>
            )}

            {/* Ready Phase Screen */}
            {gamePhase === "ready" && selectedExercise && (
              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold text-lime-400 mb-4 audiowide-regular">
                  Get Ready!
                </h2>
                <p className="text-lg text-slate-300 mb-4">
                  Get into starting position
                </p>
                <p className="text-4xl font-bold text-lime-300 mb-4">
                  {readyPhaseRemaining}s
                </p>
                <div className="flex justify-center gap-4 mb-4">
                  <div className={`px-4 py-2 rounded-lg ${userReady ? "bg-lime-500/20 border-2 border-lime-400" : "bg-slate-700/50 border-2 border-slate-500"}`}>
                    <p className="text-sm text-slate-400">You</p>
                    <p
                      className={`text-lg font-semibold audiowide-regular tracking-wide ${
                        userReady ? "text-lime-300" : "text-slate-400"
                      }`}
                    >
                      {userReady ? "✓ Ready" : "Not Ready"}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${opponentReady ? "bg-lime-500/20 border-2 border-lime-400" : "bg-slate-700/50 border-2 border-slate-500"}`}>
                    <p className="text-sm text-slate-400">Opponent</p>
                    <p
                      className={`text-lg font-semibold audiowide-regular tracking-wide ${
                        opponentReady ? "text-lime-300" : "text-slate-400"
                      }`}
                    >
                      {opponentReady ? "✓ Ready" : "Not Ready"}
                    </p>
                  </div>
                </div>
                {!isInStartingPosition && (
                  <p className="text-sm text-slate-400 mb-4">
                    Position yourself in the starting position
                  </p>
                )}
                {/* Explicit Ready / Not Ready buttons */}
                <div className="flex items-center justify-center gap-4">
                <button
                    type="button"
                  onClick={() => {
                      if (!userReady) {
                        setUserReady(true);
                    const sendReady = wsSendPlayerReadyRef.current;
                    if (sendReady) {
                          console.log(
                            "📤 [MANUAL] Sending PLAYER_READY=true to server..."
                          );
                          sendReady(true);
                    } else {
                          console.error(
                            "❌ [MANUAL] wsSendPlayerReady is not available!"
                          );
                        }
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold audiowide-regular text-lg transition-colors ${
                    userReady
                        ? "bg-lime-500 text-black"
                      : "bg-lime-500 hover:bg-lime-600 text-black"
                  }`}
                >
                    Ready
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (userReady) {
                        setUserReady(false);
                        const sendReady = wsSendPlayerReadyRef.current;
                        if (sendReady) {
                          console.log(
                            "📤 [MANUAL] Sending PLAYER_READY=false to server..."
                          );
                          sendReady(false);
                        } else {
                          console.error(
                            "❌ [MANUAL] wsSendPlayerReady is not available!"
                          );
                        }
                      }
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold audiowide-regular text-lg transition-colors ${
                      userReady
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    }`}
                  >
                    Not Ready
                </button>
                </div>
              </div>
            )}

            {/* 5-Second Countdown Screen */}
            {gamePhase === "countdown" && (
              <div className="text-center mb-8">
                <h2 className="text-6xl font-bold text-lime-400 mb-4">
                  {startCountdown}
                </h2>
                <p className="text-xl text-slate-300">
                  Get ready to start!
                </p>
              </div>
            )}

            <LiveBattleCard
              gameId={gameId}
              mode={selectedExercise === "plank" ? "hold" : "reps"}
              state={gamePhase === "live" ? "live" : gamePhase === "countdown" ? "countdown" : "countdown"}
              durationSeconds={durationSeconds}
              countdownRemaining={gamePhase === "countdown" ? startCountdown : 0}
              timeRemaining={timeRemaining}
              userMetric={userReps}
              opponentMetric={opponentReps}
              opponentName={opponentName}
            />

            {/* Escape hatch so players are never stuck in a battle */}
            <div className="mt-6 flex justify-center">
              <ShimmerButton
                variant="primary"
                onClick={() => navigate("/app")}
              >
                <span className="audiowide-regular text-sm tracking-wide">
                  Leave Match &amp; Return to Lobby
                </span>
              </ShimmerButton>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}


