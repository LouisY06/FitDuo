/**
 * CV Detector Service
 * 
 * This is a UI-agnostic computer vision service for rep detection.
 * Your frontend developer can integrate this into their own UI components.
 * 
 * Usage:
 *   const detector = new CVDetector();
 *   await detector.initialize(videoElement, canvasElement);
 *   detector.setRepCallback((count) => console.log('Rep:', count));
 *   detector.startDetection();
 */

import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import type {
  PoseLandmark,
  FormRules,
  RepDetectionState,
  StaticHoldState,
  CVDetectionResult,
  RepDetectedCallback,
  FormErrorCallback,
  DetectionUpdateCallback,
} from "../types/cv";
import { validatePushupForm, calculateElbowAngle, PUSHUP_REP_PARAMS } from "../exercises/pushup-params";
import { validateSquatForm, calculateKneeAngle, getHipYPosition, getKneeYPosition as _getKneeYPosition, isHipCloseToKnees, checkStandingForm, SQUAT_REP_PARAMS } from "../exercises/squat-params";
import { checkBodyLine, checkPlankBreakage, checkInitialSetup, checkSideView as checkPlankSideView, checkKneeBend as _checkKneeBend, checkPlankInitialSetup, checkKneeCollapse } from "../exercises/plank-params";

export class CVDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private drawingUtils: DrawingUtils | null = null;
  private animationFrameId: number | null = null;
  
  // Rep detection state
  private repState: RepDetectionState = {
    repCount: 0,
    isDown: false,
    lastAngle: 0,
  };
  
  // Stability tracking for squat detection (to prevent false reps from jittery landmarks)
  private hipPositionHistory: number[] = []; // Track last N hip positions
  private lastRepTime: number = 0; // Timestamp of last rep to prevent rapid false counts
  private bottomReachedTime: number = 0; // Timestamp when bottom was reached (to ensure we've been at bottom before coming up)
  private readonly STABILITY_HISTORY_SIZE = 5; // Number of frames to track for stability
  private readonly MIN_REP_INTERVAL_MS = 1000; // Minimum time between reps (1 second)
  private readonly MAX_HIP_MOVEMENT_PER_FRAME = 0.05; // Max hip movement per frame (5% of frame) to detect jitter
  private readonly MIN_BOTTOM_TIME_MS = 200; // Minimum time at bottom before allowing "coming up" detection (200ms)
  
  // Static hold state
  private holdState: StaticHoldState = {
    isStable: false,
    duration: 0,
    startTime: null,
  };
  
  // Form rules
  private formRules: FormRules = {};
  private currentExercise: string = "";
  
  // Callbacks
  private onRepDetected: RepDetectedCallback | null = null;
  private onFormError: FormErrorCallback | null = null;
  private onDetectionUpdate: DetectionUpdateCallback | null = null;
  
  // Configuration
  private stabilityThreshold: number = 0.1;
  private isDetecting: boolean = false;

  /**
   * Initialize the CV detector with video and canvas elements
   * @param video - HTMLVideoElement from webcam
   * @param canvas - HTMLCanvasElement for drawing pose landmarks (optional)
   */
  async initialize(
    video: HTMLVideoElement,
    canvas?: HTMLCanvasElement
  ): Promise<void> {
    this.videoElement = video;
    this.canvasElement = canvas || null;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // Detect if we're on mobile and use CPU delegate for better compatibility
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const useGPU = !isMobile; // Use GPU on desktop, CPU on mobile for better compatibility
    
    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: useGPU ? "GPU" : "CPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });

    if (this.canvasElement) {
      this.drawingUtils = new DrawingUtils(this.canvasElement.getContext("2d")!);
    }
  }

  /**
   * Set form rules for the current exercise
   * @param rules - Form rules object (e.g., {elbow_angle: {min: 90, max: 180}})
   */
  setFormRules(rules: FormRules, exerciseName?: string): void {
    this.formRules = rules;
    if (exerciseName) {
      this.currentExercise = exerciseName;
    }
  }

  /**
   * Set callback for when a rep is detected
   */
  setRepCallback(callback: RepDetectedCallback): void {
    this.onRepDetected = callback;
  }

  /**
   * Set callback for form errors
   */
  setFormErrorCallback(callback: FormErrorCallback): void {
    this.onFormError = callback;
  }

  /**
   * Set callback for detection updates (called every frame)
   */
  setDetectionUpdateCallback(callback: DetectionUpdateCallback): void {
    this.onDetectionUpdate = callback;
  }

  /**
   * Start detection loop
   */
  startDetection(): void {
    if (!this.videoElement || !this.poseLandmarker) {
      throw new Error("CVDetector not initialized. Call initialize() first.");
    }

    if (this.isDetecting) {
      return; // Already detecting
    }

    this.isDetecting = true;

    const detect = async () => {
      if (!this.videoElement || !this.poseLandmarker || !this.isDetecting) {
        return;
      }

      // Check if video has valid dimensions
      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;
      
      if (!videoWidth || !videoHeight || videoWidth <= 0 || videoHeight <= 0) {
        // Video not ready yet, skip this frame
        if (this.isDetecting) {
          this.animationFrameId = requestAnimationFrame(detect);
        }
        return;
      }

      const canvasCtx = this.canvasElement?.getContext("2d");
      if (canvasCtx && this.canvasElement) {
        // Set canvas size to match video
        if (this.canvasElement.width !== videoWidth || 
            this.canvasElement.height !== videoHeight) {
          this.canvasElement.width = videoWidth;
          this.canvasElement.height = videoHeight;
        }
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      }

      try {
        const results = this.poseLandmarker.detectForVideo(
          this.videoElement,
          performance.now()
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = this.convertLandmarks(results.landmarks[0]);
          
          // Draw pose landmarks FIRST (always draw if landmarks are detected)
          // This ensures the pose overlay is visible even if validation fails
          if (this.drawingUtils && this.canvasElement && canvasCtx) {
            // Draw landmarks
            this.drawingUtils.drawLandmarks(results.landmarks[0], {
              radius: (data) => DrawingUtils.lerp(data.from!.z!, -0.15, 0.1, 5, 1),
            });
            // Draw connections
            this.drawingUtils.drawConnectors(
              results.landmarks[0],
              PoseLandmarker.POSE_CONNECTIONS
            );
          }
          
          // Check if landmarks are valid (person is visible in frame)
          const hasValidLandmarks = this.hasValidLandmarks(landmarks);
          
          if (!hasValidLandmarks) {
            // Person walked off screen or landmarks are invalid - reset rep state
            // But keep the pose overlay visible (already drawn above)
            this.resetRepStateForMissingPerson();
            // Continue detection loop but don't process this frame for rep counting
            if (this.isDetecting) {
              this.animationFrameId = requestAnimationFrame(detect);
            }
            return;
          }

          // Detect reps or static holds based on exercise type
          const isStaticHold = this.isStaticHoldExercise();
          if (isStaticHold) {
            this.detectStaticHold(landmarks);
          } else {
            this.detectRep(landmarks);
          }

          // Validate form
          const formValid = this.validateForm(landmarks);
          const formErrors = formValid ? [] : this.getFormErrors(landmarks);

          // Create detection result
          const result: CVDetectionResult = {
            landmarks,
            repState: { ...this.repState },
            holdState: { ...this.holdState },
            formValid,
            formErrors,
          };

          // Call update callback
          if (this.onDetectionUpdate) {
            this.onDetectionUpdate(result);
          }

          // Call form error callback if needed
          if (!formValid && this.onFormError && formErrors.length > 0) {
            this.onFormError(formErrors);
          }
        } else {
          // No pose detected - person walked off screen
          this.resetRepStateForMissingPerson();
          // Clear canvas if needed
          if (canvasCtx && this.canvasElement) {
            canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
          }
        }
      } catch (error) {
        console.error("Error in pose detection:", error);
        // Continue detection loop even if there's an error
      }

      if (canvasCtx) {
        canvasCtx.restore();
      }

      if (this.isDetecting) {
        this.animationFrameId = requestAnimationFrame(detect);
      }
    };

    detect();
  }

  /**
   * Stop detection loop
   */
  stopDetection(): void {
    this.isDetecting = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Reset rep count
   */
  resetRepCount(): void {
    this.repState = {
      repCount: 0,
      isDown: false,
      lastAngle: 0,
      lastHipY: undefined,
      startingHipY: undefined,
      bottomHipY: undefined,
    };
    this.hipPositionHistory = [];
    this.lastRepTime = 0;
    this.bottomReachedTime = 0;
  }

  /**
   * Reset hold timer
   */
  resetHoldTimer(): void {
    this.holdState = {
      isStable: false,
      duration: 0,
      startTime: null,
    };
  }

  /**
   * Get current rep count
   */
  getRepCount(): number {
    return this.repState.repCount;
  }

  /**
   * Get current hold duration
   */
  getHoldDuration(): number {
    return this.holdState.duration;
  }

  /**
   * Check if currently detecting
   */
  isActive(): boolean {
    return this.isDetecting;
  }

  // Private methods

  private convertLandmarks(landmarks: any[]): PoseLandmark[] {
    return landmarks.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
    }));
  }

  private isStaticHoldExercise(): boolean {
    // Check if current exercise is a static hold
    const staticHoldKeywords = ["plank", "wall sit", "wall-sit", "hold"];
    return staticHoldKeywords.some((keyword) =>
      this.currentExercise.toLowerCase().includes(keyword)
    );
  }

  private detectRep(landmarks: PoseLandmark[]): void {
    const exercise = this.currentExercise.toLowerCase();
    
    if (exercise.includes("push-up") || exercise.includes("pushup")) {
      this.detectPushUp(landmarks);
    } else if (exercise.includes("squat")) {
      this.detectSquat(landmarks);
    } else if (exercise.includes("sit-up") || exercise.includes("situp") || exercise.includes("crunch")) {
      this.detectSitUp(landmarks);
    } else {
      // Default to push-up detection
      this.detectPushUp(landmarks);
    }
  }

  private detectPushUp(landmarks: PoseLandmark[]): void {
    // First check if landmarks are valid (person is in frame)
    if (!this.hasValidLandmarks(landmarks)) {
      // Person not in frame - reset rep state
      this.resetRepStateForMissingPerson();
      return;
    }

    // Check if person is too close to camera - stop rep counting if so
    if (this.isPersonTooClose(landmarks)) {
      // Person too close - reset rep state and don't count reps
      this.resetRepStateForMissingPerson();
      return;
    }

    // Calculate elbow angle first to pass to form validation
    const elbowAngle = calculateElbowAngle(landmarks);
    if (elbowAngle === null) {
      // Can't calculate angle - person might be off screen
      this.resetRepStateForMissingPerson();
      return;
    }

    // Validate form with elbow angle for movement-aware leniency
    // More lenient during downward motion to allow natural movement
    const formValidation = validatePushupForm(landmarks, elbowAngle);
    if (!formValidation.isValid) {
      // Form is invalid - don't count reps, but still track angle for display
      this.repState.lastAngle = elbowAngle;
      return;
    }

    // Form is valid - proceed with rep detection

    // Use push-up specific parameters for rep detection
    // Going down: angle < BOTTOM_ANGLE_MAX (100°)
    // Coming up: angle > TOP_ANGLE_MIN (160°)
    const bottomAngle = PUSHUP_REP_PARAMS.BOTTOM_ANGLE_MAX; // 100° - going down threshold
    const topAngle = PUSHUP_REP_PARAMS.TOP_ANGLE_MIN; // 160° - coming up threshold

    // Detect rep cycle: 
    // 1. Start at top (angle > 160°)
    // 2. Go down (angle < 100°) -> set isDown = true
    // 3. Come back up (angle > 160°) -> count rep and set isDown = false
    
    if (!this.repState.isDown && elbowAngle < bottomAngle) {
      // Just went down - mark as down
      this.repState.isDown = true;
      console.log(`📉 Going down - angle: ${elbowAngle.toFixed(1)}°`);
    } else if (this.repState.isDown && elbowAngle > topAngle) {
      // Just came back up - count the rep!
      // Validate form at the top to ensure good form
      const topFormValidation = validatePushupForm(landmarks, elbowAngle);
      if (topFormValidation.isValid) {
        this.repState.isDown = false;
        this.repState.repCount++;
        console.log(`✅ Rep ${this.repState.repCount} completed!`);
        if (this.onRepDetected) {
          this.onRepDetected(this.repState.repCount);
        }
      } else {
        // Form became invalid at top - reset but don't count
        console.log(`⚠️ Form invalid at top - rep not counted`);
        this.repState.isDown = false;
      }
    }

    this.repState.lastAngle = elbowAngle;
  }

  private detectSquat(landmarks: PoseLandmark[]): void {
    // First check if landmarks are valid (person is in frame)
    if (!this.hasValidLandmarks(landmarks)) {
      // Person not in frame - reset rep state
      this.resetRepStateForMissingPerson();
      return;
    }

    // Check if person is too close to camera - stop rep counting if so
    if (this.isPersonTooClose(landmarks)) {
      // Person too close - reset rep state and don't count reps
      this.resetRepStateForMissingPerson();
      return;
    }

    // Get current hip Y position for tracking
    const currentHipY = getHipYPosition(landmarks);
    if (currentHipY === null) {
      // Can't get hip position - person might be off screen
      this.resetRepStateForMissingPerson();
      return;
    }

    // Track hip position history for stability checking
    this.hipPositionHistory.push(currentHipY);
    if (this.hipPositionHistory.length > this.STABILITY_HISTORY_SIZE) {
      this.hipPositionHistory.shift(); // Keep only last N positions
    }

    // Check for unstable/jittery landmarks (large sudden movements indicate tracking issues)
    if (this.hipPositionHistory.length >= 3) {
      const recentPositions = this.hipPositionHistory.slice(-3);
      const maxMovement = Math.max(
        ...recentPositions.slice(1).map((pos, i) => Math.abs(pos - recentPositions[i]))
      );
      
      // If hip position is jumping around too much, landmarks are unstable
      if (maxMovement > this.MAX_HIP_MOVEMENT_PER_FRAME) {
        // Unstable tracking - don't count reps, just update position
        this.repState.lastHipY = currentHipY;
        return;
      }
    }

    // Initialize starting hip Y if not set (first frame or reset)
    if (this.repState.startingHipY === undefined) {
      // Check if standing (valid starting form)
      const standingForm = checkStandingForm(landmarks);
      if (standingForm.isValid) {
        this.repState.startingHipY = currentHipY;
        this.repState.lastHipY = currentHipY;
        this.repState.bottomHipY = undefined; // Reset bottom tracking
        this.hipPositionHistory = [currentHipY]; // Reset history
        console.log(`🏁 Squat starting position set - hip Y: ${currentHipY.toFixed(3)}`);
      } else {
        // Not standing yet - wait for valid starting position
        return;
      }
    }

    // Calculate knee angle for form validation (optional, not used for rep detection)
    const kneeAngle = calculateKneeAngle(landmarks);
    
    // Validate form (simplified - just check if facing camera and basic alignment)
    const formValidation = validateSquatForm(landmarks, kneeAngle);
    if (!formValidation.isValid) {
      // Form is invalid - don't count reps, but still track hip position
      this.repState.lastHipY = currentHipY;
      if (kneeAngle !== null) {
        this.repState.lastAngle = kneeAngle;
      }
      return;
    }

    // Form is valid - proceed with rep detection using hip-to-knee tracking

    // Check if hip is close to knees
    const hipKneeCheck = isHipCloseToKnees(landmarks);
    const hipUpThreshold = SQUAT_REP_PARAMS.HIP_UP_THRESHOLD; // 8% of frame height (more lenient)
    const hipReturnThreshold = SQUAT_REP_PARAMS.HIP_RETURN_THRESHOLD; // 12% of frame height (more lenient)

    // Calculate how much hip has moved from starting position
    const hipMovementFromStart = currentHipY - (this.repState.startingHipY || currentHipY);
    // const hipMovementFromLast = this.repState.lastHipY !== undefined ? currentHipY - this.repState.lastHipY : 0; // Unused for now

    // Debug logging
    const distanceStr = hipKneeCheck.distance ? (hipKneeCheck.distance * 100).toFixed(1) : "N/A";
    const movementStr = (hipMovementFromStart * 100).toFixed(1);
    
    // Detect rep cycle (LENIENT - based on hip being close to knees):
    // 1. Start at top (standing - hip Y close to starting position)
    // 2. Go down until hip is close to knees -> set isDown = true
    // 3. Come back up (hip moves up from bottom) -> count rep when back near starting position
    
    if (!this.repState.isDown) {
      // Not in down position - check if hip is close to knees
      // Also ensure we're actually going down (hip Y increasing) to prevent false triggers
      const isGoingDown = this.repState.lastHipY !== undefined && currentHipY > this.repState.lastHipY;
      
      if (hipKneeCheck.isClose && isGoingDown) {
        // Hip is close to knees AND we're going down - mark as down
        this.repState.isDown = true;
        this.repState.bottomHipY = currentHipY; // Track when hip was close to knees
        this.bottomReachedTime = Date.now(); // Record when we reached bottom
        console.log(`📉 Squat going down - hip close to knees (distance: ${distanceStr}%, hip Y: ${currentHipY.toFixed(3)})`);
      } else {
        // Debug: log when not close yet or not going down
        if (hipKneeCheck.distance !== undefined && hipKneeCheck.distance < 0.30) {
          // Only log if getting close (within 30%) to avoid spam
          console.log(`🔍 Squat tracking - hip not close yet or not going down (distance: ${distanceStr}%, movement: ${movementStr}%, goingDown: ${isGoingDown})`);
        }
      }
    } else {
      // In down position - check face visibility before counting rep
      // This prevents false reps when walking towards camera
      if (!this.isFaceCompletelyVisible(landmarks)) {
        // Face not visible - don't count rep, but keep tracking
        this.repState.lastHipY = currentHipY;
        return;
      }
      
      // Track the deepest point (when hip was closest to knees)
      const wasGoingDeeper = this.repState.bottomHipY === undefined || currentHipY > this.repState.bottomHipY;
      
      if (wasGoingDeeper) {
        // Still going deeper - update bottom position and reset bottom time
        this.repState.bottomHipY = currentHipY;
        this.bottomReachedTime = Date.now(); // Reset bottom time since we're still going deeper
      }
      
      // Check if coming back up (hip moving up from bottom position)
      // CRITICAL: Only allow "coming up" detection if:
      // 1. We've been at the bottom for at least MIN_BOTTOM_TIME_MS
      // 2. Hip is actually moving up (currentHipY < bottomHipY, meaning movementFromBottom is negative)
      // 3. We're not still going down (hip Y is decreasing, not increasing)
      if (this.repState.bottomHipY !== undefined) {
        const now = Date.now();
        const timeAtBottom = now - this.bottomReachedTime;
        const movementFromBottom = currentHipY - this.repState.bottomHipY; // Negative = moving up
        const isActuallyMovingUp = movementFromBottom < -hipUpThreshold; // Hip has moved up significantly
        const isNotStillGoingDown = this.repState.lastHipY === undefined || currentHipY <= this.repState.lastHipY; // Hip Y is not increasing
        
        // Only proceed if we've been at bottom long enough AND we're actually moving up AND not still going down
        if (timeAtBottom >= this.MIN_BOTTOM_TIME_MS && isActuallyMovingUp && isNotStillGoingDown) {
          // Hip is moving up from bottom
          console.log(`📈 Squat coming up - moved up ${(Math.abs(movementFromBottom) * 100).toFixed(1)}% from bottom, movement from start: ${movementStr}%`);
          
          // Check if back near starting position (more lenient)
          if (Math.abs(hipMovementFromStart) < hipReturnThreshold) {
            // Back near starting position - count the rep!
            // Also check minimum time between reps to prevent false counts from jittery landmarks
            const timeSinceLastRep = now - this.lastRepTime;
            
            if (this.repState.isDown && timeSinceLastRep >= this.MIN_REP_INTERVAL_MS) {
              this.repState.isDown = false;
              this.repState.repCount++;
              this.lastRepTime = now;
              console.log(`✅ Squat rep ${this.repState.repCount} completed! (hip was close to knees and returned to start)`);
              if (this.onRepDetected) {
                this.onRepDetected(this.repState.repCount);
              }
              // Reset for next rep
              this.repState.startingHipY = currentHipY;
              this.repState.bottomHipY = undefined;
              this.bottomReachedTime = 0;
              this.hipPositionHistory = [currentHipY]; // Reset stability history
            } else if (timeSinceLastRep < this.MIN_REP_INTERVAL_MS) {
              // Too soon since last rep - likely false detection from jittery landmarks
              console.log(`⏸️ Ignoring potential rep - too soon since last rep (${timeSinceLastRep}ms < ${this.MIN_REP_INTERVAL_MS}ms)`);
            }
          } else {
            // Coming up but not back to start yet
            console.log(`⏳ Squat coming up but not at start yet (${Math.abs(hipMovementFromStart) * 100}% from start, need < ${hipReturnThreshold * 100}%)`);
          }
        } else {
          // Still going down or at bottom (not enough time at bottom yet)
          if (hipKneeCheck.isClose) {
            if (timeAtBottom < this.MIN_BOTTOM_TIME_MS) {
              console.log(`📉 Squat at bottom - waiting for stable bottom (${timeAtBottom}ms < ${this.MIN_BOTTOM_TIME_MS}ms)`);
            } else if (!isActuallyMovingUp) {
              console.log(`📉 Squat at bottom - hip still close to knees (distance: ${distanceStr}%)`);
            } else if (!isNotStillGoingDown) {
              console.log(`📉 Squat still going down - hip Y increasing (${currentHipY.toFixed(3)} > ${this.repState.lastHipY?.toFixed(3)})`);
            }
          }
        }
      }
    }

    // Update tracking
    this.repState.lastHipY = currentHipY;
    if (kneeAngle !== null) {
      this.repState.lastAngle = kneeAngle;
    }
  }

  private detectSitUp(landmarks: PoseLandmark[]): void {
    // First check if landmarks are valid (person is in frame)
    if (!this.hasValidLandmarks(landmarks)) {
      // Person not in frame - reset rep state
      this.resetRepStateForMissingPerson();
      return;
    }

    // Check if person is too close to camera - stop rep counting if so
    if (this.isPersonTooClose(landmarks)) {
      // Person too close - reset rep state and don't count reps
      this.resetRepStateForMissingPerson();
      return;
    }

    // MediaPipe pose landmark indices
    const LEFT_SHOULDER = 11;
    const LEFT_HIP = 23;
    const RIGHT_SHOULDER = 12;
    const RIGHT_HIP = 24;

    // Calculate angle between shoulders and hips (torso angle)
    const shoulderMidY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
    const hipMidY = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2;

    // Vertical distance from shoulders to hips
    // When lying down: shoulders and hips at similar Y (small torsoAngle)
    // When sitting up: shoulders higher than hips (large torsoAngle)
    const torsoAngle = Math.abs(shoulderMidY - hipMidY);

    // Get form rules (default thresholds)
    // When lying down: torsoAngle is small (< 0.05)
    // When sitting up: torsoAngle is large (> 0.15)
    const downThreshold = this.formRules.torso_angle?.max ?? 0.05; // Small angle = lying down
    const upThreshold = this.formRules.torso_angle?.min ?? 0.15; // Large angle = sitting up

    // Detect rep cycle: down (lying - small angle) -> up (sitting - large angle)
    if (!this.repState.isDown && torsoAngle < downThreshold) {
      // Lying down - small torso angle
      this.repState.isDown = true;
    } else if (this.repState.isDown && torsoAngle > upThreshold) {
      // Sitting up - large torso angle
      this.repState.isDown = false;
      this.repState.repCount++;
      if (this.onRepDetected) {
        this.onRepDetected(this.repState.repCount);
      }
    }

    this.repState.lastAngle = torsoAngle;
  }

  private detectStaticHold(landmarks: PoseLandmark[]): void {
    const exercise = this.currentExercise.toLowerCase();
    
    // Plank-specific detection
    if (exercise.includes("plank")) {
      // If timer is already running, only check for knee collapse
      if (this.holdState.startTime !== null) {
        // Timer is running - only stop if knees collapse
        const kneeCollapse = checkKneeCollapse(landmarks);
        if (kneeCollapse.isCollapsed) {
          // Knees collapsed - reset timer
          this.holdState.startTime = null;
          this.holdState.duration = 0;
          this.holdState.isStable = false;
          return;
        }
        
        // Knees still straight - continue timer
        this.holdState.duration = (Date.now() - this.holdState.startTime) / 1000; // Convert to seconds
        this.holdState.isStable = true;
        return;
      }
      
      // Timer not started yet - check if all initial conditions are met
      // Timer starts when: Side View ✅, Initial Setup ✅, Body Line ✅, Knees Straight ✅
      const initialSetup = checkPlankInitialSetup(landmarks);
      if (initialSetup.isValid) {
        // All conditions met - start timer
        this.holdState.startTime = Date.now();
        this.holdState.duration = 0;
        this.holdState.isStable = true;
      } else {
        // Conditions not met - don't start timer
        this.holdState.startTime = null;
        this.holdState.duration = 0;
        this.holdState.isStable = false;
      }
    } else {
      // Generic static hold detection (for wall sit, etc.)
      // Key points for stability check (shoulders, hips)
      const LEFT_SHOULDER = 11;
      const RIGHT_SHOULDER = 12;
      const LEFT_HIP = 23;
      const RIGHT_HIP = 24;

      const shoulderMidY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
      const hipMidY = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2;

      // Calculate vertical alignment (for plank/wall sit)
      const verticalAlignment = Math.abs(shoulderMidY - hipMidY);

      // Check if pose is stable (low movement)
      const isStable = verticalAlignment < this.stabilityThreshold;

      if (isStable) {
        if (this.holdState.startTime === null) {
          this.holdState.startTime = Date.now();
        }
        this.holdState.duration = (Date.now() - this.holdState.startTime) / 1000; // Convert to seconds
        this.holdState.isStable = true;
      } else {
        // Reset if not stable
        this.holdState.startTime = null;
        this.holdState.duration = 0;
        this.holdState.isStable = false;
      }
    }
  }

  private validateForm(landmarks: PoseLandmark[]): boolean {
    // Basic form validation - can be extended
    if (Object.keys(this.formRules).length === 0) {
      return true; // No rules = always valid
    }

    const exercise = this.currentExercise.toLowerCase();

    // Check elbow angle for push-ups
    if (this.formRules.elbow_angle && (exercise.includes("push-up") || exercise.includes("pushup"))) {
      const LEFT_ELBOW = 13;
      const RIGHT_ELBOW = 14;
      const LEFT_SHOULDER = 11;
      const LEFT_WRIST = 15;
      const RIGHT_SHOULDER = 12;
      const RIGHT_WRIST = 16;

      const leftAngle = this.calculateAngle(
        landmarks[LEFT_SHOULDER],
        landmarks[LEFT_ELBOW],
        landmarks[LEFT_WRIST]
      );
      const rightAngle = this.calculateAngle(
        landmarks[RIGHT_SHOULDER],
        landmarks[RIGHT_ELBOW],
        landmarks[RIGHT_WRIST]
      );
      const avgAngle = (leftAngle + rightAngle) / 2;

      const min = this.formRules.elbow_angle.min ?? 0;
      const max = this.formRules.elbow_angle.max ?? 180;

      if (avgAngle < min || avgAngle > max) {
        return false;
      }
    }

    // Check knee angle for squats
    if (this.formRules.knee_angle && exercise.includes("squat")) {
      const LEFT_HIP = 23;
      const LEFT_KNEE = 25;
      const LEFT_ANKLE = 27;
      const RIGHT_HIP = 24;
      const RIGHT_KNEE = 26;
      const RIGHT_ANKLE = 28;

      const leftAngle = this.calculateAngle(
        landmarks[LEFT_HIP],
        landmarks[LEFT_KNEE],
        landmarks[LEFT_ANKLE]
      );
      const rightAngle = this.calculateAngle(
        landmarks[RIGHT_HIP],
        landmarks[RIGHT_KNEE],
        landmarks[RIGHT_ANKLE]
      );
      const avgAngle = (leftAngle + rightAngle) / 2;

      const min = this.formRules.knee_angle.min ?? 0;
      const max = this.formRules.knee_angle.max ?? 180;

      if (avgAngle < min || avgAngle > max) {
        return false;
      }
    }

    // Check plank form (side view, body line and initial setup)
    if (exercise.includes("plank")) {
      const sideView = checkPlankSideView(landmarks);
      if (!sideView.isValid) {
        return false;
      }

      const setup = checkInitialSetup(landmarks);
      if (!setup.isValid) {
        return false;
      }

      const bodyLine = checkBodyLine(landmarks);
      if (!bodyLine.isValid) {
        return false;
      }

      const breakage = checkPlankBreakage(landmarks);
      if (breakage.isBroken) {
        return false;
      }
    }

    return true;
  }

  private getFormErrors(landmarks: PoseLandmark[]): string[] {
    const errors: string[] = [];
    const exercise = this.currentExercise.toLowerCase();

    if (this.formRules.elbow_angle && (exercise.includes("push-up") || exercise.includes("pushup"))) {
      const LEFT_ELBOW = 13;
      const RIGHT_ELBOW = 14;
      const LEFT_SHOULDER = 11;
      const LEFT_WRIST = 15;
      const RIGHT_SHOULDER = 12;
      const RIGHT_WRIST = 16;

      const leftAngle = this.calculateAngle(
        landmarks[LEFT_SHOULDER],
        landmarks[LEFT_ELBOW],
        landmarks[LEFT_WRIST]
      );
      const rightAngle = this.calculateAngle(
        landmarks[RIGHT_SHOULDER],
        landmarks[RIGHT_ELBOW],
        landmarks[RIGHT_WRIST]
      );
      const avgAngle = (leftAngle + rightAngle) / 2;

      const min = this.formRules.elbow_angle.min ?? 0;
      const max = this.formRules.elbow_angle.max ?? 180;

      if (avgAngle < min) {
        errors.push("Go deeper!");
      } else if (avgAngle > max) {
        errors.push("Not fully extended");
      }
    }

    if (this.formRules.knee_angle && exercise.includes("squat")) {
      const LEFT_HIP = 23;
      const LEFT_KNEE = 25;
      const LEFT_ANKLE = 27;
      const RIGHT_HIP = 24;
      const RIGHT_KNEE = 26;
      const RIGHT_ANKLE = 28;

      const leftAngle = this.calculateAngle(
        landmarks[LEFT_HIP],
        landmarks[LEFT_KNEE],
        landmarks[LEFT_ANKLE]
      );
      const rightAngle = this.calculateAngle(
        landmarks[RIGHT_HIP],
        landmarks[RIGHT_KNEE],
        landmarks[RIGHT_ANKLE]
      );
      const avgAngle = (leftAngle + rightAngle) / 2;

      const min = this.formRules.knee_angle.min ?? 0;
      const max = this.formRules.knee_angle.max ?? 180;

      if (avgAngle < min) {
        errors.push("Go deeper!");
      } else if (avgAngle > max) {
        errors.push("Stand up straight");
      }
    }

    // Check plank form errors
    if (exercise.includes("plank")) {
      const sideView = checkPlankSideView(landmarks);
      if (!sideView.isValid && sideView.error) {
        errors.push(sideView.error);
      }

      const setup = checkInitialSetup(landmarks);
      if (!setup.isValid && setup.error) {
        errors.push(setup.error);
      }

      const bodyLine = checkBodyLine(landmarks);
      if (!bodyLine.isValid && bodyLine.error) {
        errors.push(bodyLine.error);
      }

      const breakage = checkPlankBreakage(landmarks);
      if (breakage.isBroken && breakage.reason) {
        errors.push(breakage.reason);
      }
    }

    return errors;
  }

  private calculateAngle(point1: PoseLandmark, point2: PoseLandmark, point3: PoseLandmark): number {
    const radians =
      Math.atan2(point3.y - point2.y, point3.x - point2.x) -
      Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  /**
   * Check if landmarks are valid (person is visible in frame)
   * Returns false if person walked off screen or landmarks are invalid
   */
  private hasValidLandmarks(landmarks: PoseLandmark[]): boolean {
    if (!landmarks || landmarks.length === 0) {
      return false;
    }

    // Check if key landmarks are within valid bounds (0-1 for normalized coordinates)
    // We'll check a few critical landmarks to determine if person is in frame
    const criticalLandmarks = [
      11, // Left shoulder
      12, // Right shoulder
      23, // Left hip
      24, // Right hip
    ];

    let validCount = 0;
    for (const index of criticalLandmarks) {
      const landmark = landmarks[index];
      if (landmark && 
          landmark.x >= 0 && landmark.x <= 1 &&
          landmark.y >= 0 && landmark.y <= 1 &&
          !isNaN(landmark.x) && !isNaN(landmark.y)) {
        validCount++;
      }
    }

    // Need at least 3 out of 4 critical landmarks to be valid
    // This ensures person is still in frame
    return validCount >= 3;
  }

  /**
   * Check if face is completely visible (for squat detection)
   * Returns true if face is fully visible, false otherwise
   * Used to prevent false reps when walking towards camera
   * MediaPipe Pose landmark indices for face:
   * - Nose: 0
   * - Left eye: 2
   * - Right eye: 5
   * - Left ear: 7
   * - Right ear: 8
   */
  private isFaceCompletelyVisible(landmarks: PoseLandmark[]): boolean {
    if (!landmarks || landmarks.length === 0) {
      return false;
    }

    // Key face landmarks that must be visible
    const faceLandmarks = [
      { index: 0, name: "Nose" },
      { index: 2, name: "Left Eye" },
      { index: 5, name: "Right Eye" },
      { index: 7, name: "Left Ear" },
      { index: 8, name: "Right Ear" },
    ];

    let visibleCount = 0;
    for (const { index } of faceLandmarks) {
      const landmark = landmarks[index];
      if (landmark && 
          landmark.x >= 0 && landmark.x <= 1 &&
          landmark.y >= 0 && landmark.y <= 1 &&
          !isNaN(landmark.x) && !isNaN(landmark.y)) {
        visibleCount++;
      }
    }

    // All 5 key face landmarks must be visible
    return visibleCount === faceLandmarks.length;
  }

  /**
   * Check if person is too close to camera (landmarks become unstable)
   * Returns true if person is too close - should stop rep counting
   */
  private isPersonTooClose(landmarks: PoseLandmark[]): boolean {
    if (!landmarks || landmarks.length === 0) {
      return false;
    }

    // Check body size - if person is too close, body takes up too much of the frame
    // Calculate distance between shoulders and hips to estimate body size
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;

    const leftShoulder = landmarks[LEFT_SHOULDER];
    const rightShoulder = landmarks[RIGHT_SHOULDER];
    const leftHip = landmarks[LEFT_HIP];
    const rightHip = landmarks[RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return false; // Can't determine
    }

    // Calculate shoulder width
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    // Calculate body height (shoulder to hip)
    const bodyHeight = Math.abs(
      (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2
    );

    // If shoulders take up more than 80% of frame width, person is too close
    // If body height is more than 60% of frame height, person is too close
    const MAX_SHOULDER_WIDTH = 0.80; // 80% of frame width
    const MAX_BODY_HEIGHT = 0.60; // 60% of frame height

    const isTooClose = shoulderWidth > MAX_SHOULDER_WIDTH || bodyHeight > MAX_BODY_HEIGHT;

    if (isTooClose) {
      console.log(`⚠️ Person too close to camera - shoulderWidth: ${(shoulderWidth * 100).toFixed(1)}%, bodyHeight: ${(bodyHeight * 100).toFixed(1)}%`);
    }

    return isTooClose;
  }

  /**
   * Reset rep state when person walks off screen
   * This prevents false rep counts when landmarks become invalid
   */
  private resetRepStateForMissingPerson(): void {
    // Only reset if we were in the middle of a rep
    // This prevents losing progress if person briefly goes out of frame
    if (this.repState.isDown) {
      // Person was in the middle of a rep - reset to prevent false counts
      this.repState.isDown = false;
      this.repState.bottomHipY = undefined;
      this.bottomReachedTime = 0;
      this.hipPositionHistory = [];
      console.log("⚠️ Person left frame - resetting rep state to prevent false counts");
    }
    // Don't reset repCount or startingHipY - keep those for when person returns
  }
}

