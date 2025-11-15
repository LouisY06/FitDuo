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
    // MediaPipe pose landmark indices
    const LEFT_SHOULDER = 11;
    const LEFT_ELBOW = 13;
    const LEFT_WRIST = 15;
    const RIGHT_SHOULDER = 12;
    const RIGHT_ELBOW = 14;
    const RIGHT_WRIST = 16;

    // Calculate elbow angle for both arms (use average)
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

    // Get form rules (default: min 90 degrees for down position)
    const minAngle = this.formRules.elbow_angle?.min ?? 90;
    const maxAngle = this.formRules.elbow_angle?.max ?? 180;

    // Detect rep cycle: down (angle < min) -> up (angle > max)
    if (!this.repState.isDown && avgAngle < minAngle) {
      this.repState.isDown = true;
    } else if (this.repState.isDown && avgAngle > maxAngle) {
      this.repState.isDown = false;
      this.repState.repCount++;
      if (this.onRepDetected) {
        this.onRepDetected(this.repState.repCount);
      }
    }

    this.repState.lastAngle = avgAngle;
  }

  private detectSquat(landmarks: PoseLandmark[]): void {
    // MediaPipe pose landmark indices
    const LEFT_HIP = 23;
    const LEFT_KNEE = 25;
    const LEFT_ANKLE = 27;
    const RIGHT_HIP = 24;
    const RIGHT_KNEE = 26;
    const RIGHT_ANKLE = 28;

    // Calculate knee angle for both legs (use average)
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

    // Get form rules (default: min 90 degrees for down position in squat)
    const minAngle = this.formRules.knee_angle?.min ?? 90;
    const maxAngle = this.formRules.knee_angle?.max ?? 180;

    // Detect rep cycle: down (angle < min) -> up (angle > max)
    if (!this.repState.isDown && avgAngle < minAngle) {
      this.repState.isDown = true;
    } else if (this.repState.isDown && avgAngle > maxAngle) {
      this.repState.isDown = false;
      this.repState.repCount++;
      if (this.onRepDetected) {
        this.onRepDetected(this.repState.repCount);
      }
    }

    this.repState.lastAngle = avgAngle;
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

