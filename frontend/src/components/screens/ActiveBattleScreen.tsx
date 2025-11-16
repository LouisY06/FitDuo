import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { LiveBattleCard } from "../LiveBattleCard";
import { CVDetector } from "../../../cv/services/cv-detector";
import { PUSHUP_FORM_RULES } from "../../../cv/exercises/pushup-params";
import { SQUAT_FORM_RULES, checkStandingForm } from "../../../cv/exercises/squat-params";
import { PLANK_FORM_RULES } from "../../../cv/exercises/plank-params";
import { LUNGE_FORM_RULES } from "../../../cv/exercises/lunge-params";
import { useGameWebSocket } from "../../hooks/useGameWebSocket";
import { getCurrentUser } from "../../services/auth";
import { auth } from "../../config/firebase";
import type { GameState } from "../../services/websocket";

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
    icon: "💪",
    formRules: PUSHUP_FORM_RULES,
  },
  {
    id: "squat",
    name: "Squats",
    description: "Lower body strength builder",
    icon: "🦵",
    formRules: SQUAT_FORM_RULES,
  },
  {
    id: "plank",
    name: "Plank Hold",
    description: "Core stability challenge",
    icon: "🏋️",
    formRules: PLANK_FORM_RULES,
  },
  {
    id: "lunge",
    name: "Lunges",
    description: "Leg strength and balance",
    icon: "🚶",
    formRules: LUNGE_FORM_RULES,
  },
];

export function ActiveBattleScreen() {
  const { gameId } = useParams<{ gameId: string }>();
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
  const [countdownRemaining, setCountdownRemaining] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [lastRepTime, setLastRepTime] = useState<number>(Date.now());
  const [readyPhaseRemaining, setReadyPhaseRemaining] = useState(10); // 10 seconds to get ready
  const [readyPhaseStartTime, setReadyPhaseStartTime] = useState<number | null>(null); // Server timestamp for sync
  const [startCountdown, setStartCountdown] = useState(5); // 5-second countdown after both ready
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null); // Server timestamp for sync
  const [userReady, setUserReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isInStartingPosition, setIsInStartingPosition] = useState(false);
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
  const gameStateStr = gameState?.status || "countdown";
  const durationSeconds = 60;
  
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

  // Coin flip logic - determine who chooses first (only for round 1)
  useEffect(() => {
    if (!playerId || !gameState || coinFlipResult !== null) return;
    
    // Only do coin flip at the start of round 1
    const currentRoundNum = gameState.currentRound || 1;
    if (currentRoundNum !== 1) {
      setShowCoinFlip(false);
      return;
    }

    // Perform coin flip: randomly choose between playerA and playerB
    const isPlayerA = gameState.playerA.id === playerId;
    const otherPlayerId = isPlayerA ? gameState.playerB.id : gameState.playerA.id;
    
    // Use a deterministic coin flip based on game ID and player IDs
    // This ensures both players get the same result
    const flipSeed = (gameId ? parseInt(gameId) : 0) + playerId + otherPlayerId;
    const flipResult = flipSeed % 2 === 0 ? gameState.playerA.id : gameState.playerB.id;
    
    setCoinFlipResult(flipResult);
    setWhoseTurnToChoose(flipResult);
    
    // If it's this player's turn, show exercise selection after coin flip animation
    if (flipResult === playerId) {
      setTimeout(() => {
        setShowCoinFlip(false);
        setShowExerciseSelection(true);
      }, 3000); // Show coin flip for 3 seconds
    } else {
      setTimeout(() => {
        setShowCoinFlip(false);
        setShowExerciseSelection(true); // Show waiting screen
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
  const handleReadyPhaseStart = useCallback((startTimestamp: number, durationSeconds: number) => {
    console.log(`⏱️ Ready phase started at server time: ${startTimestamp}`);
    // Convert server timestamp (seconds) to client timestamp (milliseconds)
    // Account for potential clock skew by using relative time
    const serverTimeMs = startTimestamp * 1000;
    const clientTimeMs = Date.now();
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
      if (exercise && exercise !== selectedExercise) {
        setSelectedExercise(exercise);
        setShowExerciseSelection(false);
        // Exercise was selected (either by us or opponent), hide waiting screen
        console.log(`✅ Exercise selected: ${exercise} (ID: ${state.exerciseId})`);
      }
    }
    
    // Handle round end state - show round end screen
    if (state.status === "round_end" || state.status === "ended_time" || state.status === "ended_inactivity") {
      if (!showRoundEnd && playerId) {
        // Determine winner/loser from scores
        const isPlayerA = state.playerA.id === playerId;
        const userScore = isPlayerA ? state.playerA.score : state.playerB.score;
        const opponentScore = isPlayerA ? state.playerB.score : state.playerA.score;
        const winnerId = userScore > opponentScore ? playerId : (opponentScore > userScore ? (isPlayerA ? state.playerB.id : state.playerA.id) : null);
        
        setRoundEndData({
          winnerId,
          loserId: winnerId === playerId ? (isPlayerA ? state.playerB.id : state.playerA.id) : (winnerId ? playerId : null),
          playerAScore: state.playerA.score,
          playerBScore: state.playerB.score,
          narrative: "",
          strategy: {},
        });
        setShowRoundEnd(true);
        
        // After showing round end screen, determine who chooses next
        // (This will be handled by handleRoundEnd callback, but we also handle it here for state updates)
        setTimeout(() => {
          if ((state.currentRound || 1) < 3) {
            setShowRoundEnd(false);
            setSelectedExercise(null);
            // Don't automatically show exercise selection - wait for round end handler
          }
        }, 5000); // Show round end screen for 5 seconds
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
    setCurrentRound(round);
    setShowExerciseSelection(false);
    setShowRoundEnd(false);
    setRoundEndData(null);
    
    // Reset timers for new round
    setCountdownRemaining(10);
    setTimeRemaining(durationSeconds);
    
    // Map exercise ID to exercise type if provided
    if (exerciseId) {
      const exerciseIdMap: Record<number, ExerciseType> = {
        1: "push-up",
        2: "squat",
        3: "plank",
        4: "lunge",
      };
      const exercise = exerciseIdMap[exerciseId];
      if (exercise) {
        setSelectedExercise(exercise);
      }
    }
    
    // Reset reps for new round
    setUserReps(0);
    setOpponentReps(0);
    lastSentRepCountRef.current = 0;
    setLastRepTime(Date.now()); // Reset inactivity timer for new round
  }, [durationSeconds]);

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
  }) => {
    console.log("🏁 Round ended:", data);
    
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
    
    // Check if someone won 2 rounds (best of 3 winner) OR if this was round 3
    const gameIsOver = newUserRoundsWon >= 2 || newOpponentRoundsWon >= 2 || currentRound >= 3;
    
    if (gameIsOver) {
      console.log(`🎉 Game Over! Final score - You: ${newUserRoundsWon}, Opponent: ${newOpponentRoundsWon}`);
      setTimeout(() => {
        setShowGameOver(true);
        setShowRoundEnd(false);
      }, 5000);
      return;
    }
    
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
    // When form rules are received, it means an exercise was selected
    // Map exercise ID to exercise type
    const exerciseIdMap: Record<number, ExerciseType> = {
      1: "push-up",
      2: "squat",
      3: "plank",
      4: "lunge",
    };
    const exercise = exerciseIdMap[data.exercise_id];
    if (exercise && exercise !== selectedExercise) {
      setSelectedExercise(exercise);
      setShowExerciseSelection(false);
      setGamePhase("ready"); // Start ready phase
      setReadyPhaseRemaining(10);
      setUserReady(false);
      setOpponentReady(false);
      console.log(`✅ Exercise selected via FORM_RULES: ${exercise} (ID: ${data.exercise_id})`);
    }
  }, [selectedExercise]);

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
        // Request webcam access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
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
        setCvError(error instanceof Error ? error.message : "Failed to initialize camera");
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
  if (showGameOver && roundEndData) {
    const userRounds = playerId && gameState?.playerA.id === playerId 
      ? roundEndData.playerARoundsWon || 0
      : roundEndData.playerBRoundsWon || 0;
    const opponentRounds = playerId && gameState?.playerA.id === playerId 
      ? roundEndData.playerBRoundsWon || 0
      : roundEndData.playerARoundsWon || 0;
    const isMatchWinner = userRounds > opponentRounds;

    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-semibold text-lime-400 audiowide-regular mb-6 animate-pulse">
                🎮 GAME OVER 🎮
              </h1>
              
              {/* Match Result */}
              <div className="mt-8 mb-6">
                {isMatchWinner ? (
                  <div className="inline-flex items-center gap-4 bg-lime-500/20 border-4 border-lime-400 rounded-3xl px-12 py-6">
                    <span className="text-6xl">🏆</span>
                    <div className="text-left">
                      <p className="text-3xl font-semibold text-lime-300">VICTORY!</p>
                      <p className="text-lg text-lime-400/80">You won the match!</p>
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-4 bg-red-500/20 border-4 border-red-400 rounded-3xl px-12 py-6">
                    <span className="text-6xl">😔</span>
                    <div className="text-left">
                      <p className="text-3xl font-semibold text-red-300">DEFEAT</p>
                      <p className="text-lg text-red-400/80">Better luck next time!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Final Score */}
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
                <div className={`border-2 rounded-xl p-6 ${isMatchWinner ? 'bg-lime-500/10 border-lime-400' : 'bg-[#020511]/80 border-slate-600'}`}>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Your Rounds Won</p>
                  <p className="text-5xl font-semibold text-lime-400">{userRounds}</p>
                </div>
                <div className={`border-2 rounded-xl p-6 ${!isMatchWinner ? 'bg-red-500/10 border-red-400' : 'bg-[#020511]/80 border-slate-600'}`}>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Opponent Rounds Won</p>
                  <p className="text-5xl font-semibold text-sky-400">{opponentRounds}</p>
                </div>
              </div>

              {/* Narrative */}
              {roundEndData.narrative && (
                <div className="max-w-2xl mx-auto bg-[#020511]/60 border border-slate-700 rounded-xl p-6 mb-6">
                  <p className="text-sm text-slate-300 italic">{roundEndData.narrative}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-8">
                <button
                  onClick={() => window.location.href = '/app/battle'}
                  className="px-8 py-4 bg-lime-500 hover:bg-lime-600 text-black font-semibold rounded-xl text-lg transition-colors"
                >
                  Return to Matchmaking
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Round End Screen
  if (showRoundEnd && roundEndData) {
    const isWinner = playerId && roundEndData.winnerId === playerId;
    const isTie = roundEndData.winnerId === null;
    const userScore = playerId && gameState?.playerA.id === playerId 
      ? roundEndData.playerAScore 
      : roundEndData.playerBScore;
    const opponentScore = playerId && gameState?.playerA.id === playerId 
      ? roundEndData.playerBScore 
      : roundEndData.playerAScore;
    const userRoundsWon = playerId && gameState?.playerA.id === playerId 
      ? roundEndData.playerARoundsWon || 0
      : roundEndData.playerBRoundsWon || 0;
    const opponentRoundsWon = playerId && gameState?.playerA.id === playerId 
      ? roundEndData.playerBRoundsWon || 0
      : roundEndData.playerARoundsWon || 0;

    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-semibold text-lime-400 audiowide-regular mb-4">
                Round {currentRound} Complete
              </h1>
              
              {/* Winner/Loser/Tie Display */}
              <div className="mt-8 mb-6">
                {isTie ? (
                  <div className="inline-flex items-center gap-3 bg-slate-700/50 border-2 border-slate-500 rounded-2xl px-8 py-4">
                    <span className="text-4xl">🤝</span>
                    <span className="text-2xl font-semibold text-slate-300">It's a Tie!</span>
                  </div>
                ) : isWinner ? (
                  <div className="inline-flex items-center gap-3 bg-lime-500/20 border-2 border-lime-400 rounded-2xl px-8 py-4">
                    <span className="text-4xl">🏆</span>
                    <span className="text-2xl font-semibold text-lime-300">You Won This Round!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-3 bg-red-500/20 border-2 border-red-400 rounded-2xl px-8 py-4">
                    <span className="text-4xl">😔</span>
                    <span className="text-2xl font-semibold text-red-300">You Lost This Round</span>
                  </div>
                )}
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

              {/* Round Wins */}
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-2">Match Score (Best of 3 Rounds)</p>
                <div className="inline-flex items-center gap-4 bg-slate-700/30 border border-slate-600 rounded-xl px-6 py-3">
                  <span className="text-lime-300 font-semibold">You: {userRoundsWon}</span>
                  <span className="text-slate-500">-</span>
                  <span className="text-sky-300 font-semibold">Opponent: {opponentRoundsWon}</span>
                </div>
              </div>

              {/* Narrative */}
              {roundEndData.narrative && (
                <div className="max-w-2xl mx-auto bg-[#020511]/60 border border-slate-700 rounded-xl p-6 mb-6">
                  <p className="text-sm text-slate-300 italic">{roundEndData.narrative}</p>
                </div>
              )}

              {/* Next Round Info with Countdown */}
              {currentRound < 3 && (
                <div className="mt-6">
                  <div className="inline-flex items-center gap-3 bg-slate-700/30 border border-slate-600 rounded-xl px-6 py-3">
                    <span className="text-2xl">{roundEndCountdown}</span>
                    <p className="text-slate-400">
                      {roundEndData.loserId === playerId 
                        ? "Get ready to choose the next exercise..."
                        : "Waiting for opponent to choose next exercise..."}
                    </p>
                  </div>
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
              <h1 className="text-5xl font-semibold text-lime-400 audiowide-regular mb-4">
                🪙 Coin Flip
              </h1>
              <p className="text-lg text-slate-300 mb-8">
                Determining who chooses the exercise first...
              </p>
              
              {/* Animated coin */}
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_40px_rgba(250,204,21,0.6)] animate-spin" style={{ animationDuration: '1s' }} />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400" />
                </div>
              </div>

              {/* Result */}
              <div className="mt-8">
                {isWinner ? (
                  <div className="inline-flex items-center gap-3 bg-lime-500/20 border-2 border-lime-400 rounded-2xl px-8 py-4">
                    <span className="text-3xl">🎉</span>
                    <span className="text-2xl font-semibold text-lime-300">You Choose First!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-3 bg-slate-700/50 border-2 border-slate-500 rounded-2xl px-8 py-4">
                    <span className="text-3xl">👤</span>
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
  if (showExerciseSelection && !selectedExercise && whoseTurnToChoose === playerId) {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-semibold text-lime-400 audiowide-regular mb-2">
                Round {currentRound}
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
                  <div className="text-5xl mb-3">{exercise.icon}</div>
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
  if (showExerciseSelection && !selectedExercise && whoseTurnToChoose !== playerId && whoseTurnToChoose !== null) {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#020617]/40 backdrop-blur-2xl z-0" />
        <main className="relative min-h-screen text-neutral-50 flex items-center justify-center z-10 px-4">
          <div className="w-full max-w-4xl text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold text-lime-400 audiowide-regular mb-4">
                Round {currentRound}
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
            {/* Round Indicator */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/30 rounded-full px-4 py-2 text-sm text-lime-300">
                <span>Round {currentRound} of 3</span>
                {selectedExercise && (
                  <>
                    <span className="text-lime-400/50">•</span>
                    <span className="capitalize">{selectedExercise.replace("-", " ")}</span>
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
                <h2 className="text-3xl font-semibold text-lime-400 mb-4">
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
                    <p className={`text-lg font-semibold ${userReady ? "text-lime-300" : "text-slate-400"}`}>
                      {userReady ? "✓ Ready" : "Not Ready"}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${opponentReady ? "bg-lime-500/20 border-2 border-lime-400" : "bg-slate-700/50 border-2 border-slate-500"}`}>
                    <p className="text-sm text-slate-400">Opponent</p>
                    <p className={`text-lg font-semibold ${opponentReady ? "text-lime-300" : "text-slate-400"}`}>
                      {opponentReady ? "✓ Ready" : "Not Ready"}
                    </p>
                  </div>
                </div>
                {!isInStartingPosition && (
                  <p className="text-sm text-slate-400 mb-4">
                    Position yourself in the starting position
                  </p>
                )}
                {/* Manual Ready Button for Testing */}
                <button
                  onClick={() => {
                    const newReadyState = !userReady;
                    setUserReady(newReadyState);
                    const sendReady = wsSendPlayerReadyRef.current;
                    if (sendReady) {
                      console.log(`📤 [MANUAL] Sending PLAYER_READY=${newReadyState} to server...`);
                      sendReady(newReadyState);
                    } else {
                      console.error(`❌ [MANUAL] wsSendPlayerReady is not available!`);
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    userReady
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-lime-500 hover:bg-lime-600 text-black"
                  }`}
                >
                  {userReady ? "Unready" : "Mark as Ready"}
                </button>
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
          </div>
        </div>
      </main>
    </>
  );
}


