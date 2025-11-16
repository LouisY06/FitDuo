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
import { validateSquatForm, calculateKneeAngle, getHipYPosition, getKneeYPosition, isHipCloseToKnees, checkStandingForm, SQUAT_REP_PARAMS } from "../exercises/squat-params";

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

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU",
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
          
          // Draw pose landmarks if canvas is available
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
          // No pose detected - clear canvas if needed
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
    // Calculate elbow angle first to pass to form validation
    const elbowAngle = calculateElbowAngle(landmarks);
    if (elbowAngle === null) {
      return; // Can't calculate angle
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
    // Get current hip Y position for tracking
    const currentHipY = getHipYPosition(landmarks);
    if (currentHipY === null) {
      return; // Can't get hip position
    }

    // Initialize starting hip Y if not set (first frame or reset)
    if (this.repState.startingHipY === undefined) {
      // Check if standing (valid starting form)
      const standingForm = checkStandingForm(landmarks);
      if (standingForm.isValid) {
        this.repState.startingHipY = currentHipY;
        this.repState.lastHipY = currentHipY;
        this.repState.bottomHipY = undefined; // Reset bottom tracking
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
    const hipMovementFromLast = this.repState.lastHipY !== undefined 
      ? currentHipY - this.repState.lastHipY 
      : 0;

    // Debug logging
    const distanceStr = hipKneeCheck.distance ? (hipKneeCheck.distance * 100).toFixed(1) : "N/A";
    const movementStr = (hipMovementFromStart * 100).toFixed(1);
    
    // Detect rep cycle (LENIENT - based on hip being close to knees):
    // 1. Start at top (standing - hip Y close to starting position)
    // 2. Go down until hip is close to knees -> set isDown = true
    // 3. Come back up (hip moves up from bottom) -> count rep when back near starting position
    
    if (!this.repState.isDown) {
      // Not in down position - check if hip is close to knees
      if (hipKneeCheck.isClose) {
        // Hip is close to knees - mark as down
        this.repState.isDown = true;
        this.repState.bottomHipY = currentHipY; // Track when hip was close to knees
        console.log(`📉 Squat going down - hip close to knees (distance: ${distanceStr}%, hip Y: ${currentHipY.toFixed(3)})`);
      } else {
        // Debug: log when not close yet
        if (hipKneeCheck.distance !== undefined && hipKneeCheck.distance < 0.30) {
          // Only log if getting close (within 30%) to avoid spam
          console.log(`🔍 Squat tracking - hip not close yet (distance: ${distanceStr}%, movement: ${movementStr}%)`);
        }
      }
    } else {
      // In down position - track the deepest point (when hip was closest to knees)
      if (this.repState.bottomHipY === undefined || currentHipY > this.repState.bottomHipY) {
        // Update bottom position if we've gone deeper
        this.repState.bottomHipY = currentHipY;
      }
      
      // Check if coming back up (hip moving up from bottom position)
      // More lenient: just check if hip is moving up significantly
      if (this.repState.bottomHipY !== undefined) {
        const movementFromBottom = currentHipY - this.repState.bottomHipY; // Negative = moving up
        
        // Check if hip has moved up from bottom
        if (movementFromBottom < -hipUpThreshold) {
          // Hip is moving up from bottom
          console.log(`📈 Squat coming up - moved up ${(Math.abs(movementFromBottom) * 100).toFixed(1)}% from bottom, movement from start: ${movementStr}%`);
          
          // Check if back near starting position (more lenient)
          if (Math.abs(hipMovementFromStart) < hipReturnThreshold) {
            // Back near starting position - count the rep!
            this.repState.isDown = false;
            this.repState.repCount++;
            console.log(`✅ Squat rep ${this.repState.repCount} completed! (hip was close to knees and returned to start)`);
            if (this.onRepDetected) {
              this.onRepDetected(this.repState.repCount);
            }
            // Reset for next rep
            this.repState.startingHipY = currentHipY;
            this.repState.bottomHipY = undefined;
          } else {
            // Coming up but not back to start yet
            console.log(`⏳ Squat coming up but not at start yet (${Math.abs(hipMovementFromStart) * 100}% from start, need < ${hipReturnThreshold * 100}%)`);
          }
        } else {
          // Still going down or at bottom
          if (hipKneeCheck.isClose) {
            console.log(`📉 Squat at bottom - hip still close to knees (distance: ${distanceStr}%)`);
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
    // MediaPipe pose landmark indices
    const LEFT_SHOULDER = 11;
    const LEFT_HIP = 23;
    const RIGHT_SHOULDER = 12;
    const RIGHT_HIP = 24;

    // Calculate angle between shoulders and hips (torso angle)
    const shoulderMidY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
    const hipMidY = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2;

    // Vertical distance from shoulders to hips (smaller = more upright)
    const torsoAngle = Math.abs(shoulderMidY - hipMidY);

    // Get form rules (default thresholds)
    const downThreshold = this.formRules.torso_angle?.max ?? 0.15; // More horizontal
    const upThreshold = this.formRules.torso_angle?.min ?? 0.05; // More vertical

    // Detect rep cycle: down (torso more horizontal) -> up (torso more vertical)
    if (!this.repState.isDown && torsoAngle > downThreshold) {
      this.repState.isDown = true;
    } else if (this.repState.isDown && torsoAngle < upThreshold) {
      this.repState.isDown = false;
      this.repState.repCount++;
      if (this.onRepDetected) {
        this.onRepDetected(this.repState.repCount);
      }
    }

    this.repState.lastAngle = torsoAngle;
  }

  private detectStaticHold(landmarks: PoseLandmark[]): void {
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
}

