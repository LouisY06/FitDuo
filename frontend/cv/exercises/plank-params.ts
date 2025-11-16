/**
 * Plank Hold Exercise Parameters (Static Hold)
 * 
 * Time Validation: Maintain body line alignment over time
 * Breakage: Hips rise (piking) or sag (arching) stops timer
 */

import type { PoseLandmark } from "../types/cv";

// MediaPipe Pose Landmark Indices
export const PLANK_LANDMARKS = {
  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  
  // Core
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  
  // Lower body
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

/**
 * Check initial setup: shoulders over elbows
 * @param landmarks - Array of pose landmarks
 * @returns Object with setup status
 */
export function checkInitialSetup(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  const shoulderMidX = (landmarks[PLANK_LANDMARKS.LEFT_SHOULDER].x + 
                         landmarks[PLANK_LANDMARKS.RIGHT_SHOULDER].x) / 2;
  const elbowMidX = (landmarks[PLANK_LANDMARKS.LEFT_ELBOW].x + 
                     landmarks[PLANK_LANDMARKS.RIGHT_ELBOW].x) / 2;
  
  // Shoulders should be positioned directly over elbows
  const alignment = Math.abs(shoulderMidX - elbowMidX);
  const threshold = 0.05; // 5% of screen width
  
  if (alignment > threshold) {
    return {
      isValid: false,
      error: "Position shoulders directly over elbows",
    };
  }
  
  return { isValid: true };
}

/**
 * Check body line alignment (shoulder-hip-ankle)
 * @param landmarks - Array of pose landmarks
 * @returns Object with alignment status and deviation
 */
export function checkBodyLine(landmarks: PoseLandmark[]): {
  isValid: boolean;
  deviation: number; // degrees from straight line
  error?: string;
  isPiking?: boolean; // hips too high
  isSagging?: boolean; // hips too low
} {
  // Calculate midpoints for symmetry
  const shoulderMidY = (landmarks[PLANK_LANDMARKS.LEFT_SHOULDER].y + 
                        landmarks[PLANK_LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipMidY = (landmarks[PLANK_LANDMARKS.LEFT_HIP].y + 
                   landmarks[PLANK_LANDMARKS.RIGHT_HIP].y) / 2;
  const ankleMidY = (landmarks[PLANK_LANDMARKS.LEFT_ANKLE].y + 
                     landmarks[PLANK_LANDMARKS.RIGHT_ANKLE].y) / 2;
  
  // Calculate deviation from straight line
  // In plank, shoulder-hip-ankle should form a straight line
  const shoulderAnkleDiff = Math.abs(shoulderMidY - ankleMidY);
  const hipDeviation = Math.abs(hipMidY - (shoulderMidY + ankleMidY) / 2);
  
  // Convert to angle deviation
  const deviation = (hipDeviation / shoulderAnkleDiff) * 90;
  
  // Threshold: hips should be within ~3% of shoulder-ankle line
  const threshold = 0.03;
  const isValid = (hipDeviation / shoulderAnkleDiff) < threshold;
  
  if (!isValid) {
    const isPiking = hipMidY < (shoulderMidY + ankleMidY) / 2;
    const isSagging = hipMidY > (shoulderMidY + ankleMidY) / 2;
    
    const error = isPiking 
      ? "Hips too high (piking) - lower hips to straight line"
      : "Hips sagging - raise hips to straight line";
    
    return { 
      isValid: false, 
      deviation, 
      error,
      isPiking,
      isSagging,
    };
  }
  
  return { isValid: true, deviation };
}

/**
 * Check if body line is maintained (for timer validation)
 * @param landmarks - Array of pose landmarks
 * @param previousHipY - Previous hip Y position for stability check
 * @returns Object with stability status
 */
export function checkBodyLineStability(
  landmarks: PoseLandmark[],
  previousHipY?: number
): {
  isStable: boolean;
  hipY: number;
} {
  const hipMidY = (landmarks[PLANK_LANDMARKS.LEFT_HIP].y + 
                   landmarks[PLANK_LANDMARKS.RIGHT_HIP].y) / 2;
  
  if (previousHipY === undefined) {
    return { isStable: true, hipY: hipMidY };
  }
  
  // Check if hip position is stable (not moving too much)
  const hipMovement = Math.abs(hipMidY - previousHipY);
  const stabilityThreshold = 0.01; // 1% movement allowed
  
  const isStable = hipMovement < stabilityThreshold;
  
  return { isStable, hipY: hipMidY };
}

/**
 * Determine if plank is broken (piking or sagging)
 * @param landmarks - Array of pose landmarks
 * @returns Object with breakage status
 */
export function checkPlankBreakage(landmarks: PoseLandmark[]): {
  isBroken: boolean;
  reason?: string;
} {
  const bodyLine = checkBodyLine(landmarks);
  
  if (!bodyLine.isValid) {
    return {
      isBroken: true,
      reason: bodyLine.error,
    };
  }
  
  return { isBroken: false };
}

/**
 * Static hold parameters
 */
export const PLANK_HOLD_PARAMS = {
  // Body line threshold
  BODY_LINE_THRESHOLD: 0.03, // 3% deviation allowed
  
  // Stability threshold (for timer validation)
  STABILITY_THRESHOLD: 0.01, // 1% movement allowed
  
  // Breakage thresholds
  PIKING_THRESHOLD: 0.05, // 5% above line = piking
  SAGGING_THRESHOLD: 0.05, // 5% below line = sagging
  
  // Initial setup
  SHOULDER_ELBOW_ALIGNMENT_THRESHOLD: 0.05, // 5% of screen width
} as const;

/**
 * Form validation rules
 */
export const PLANK_FORM_RULES = {
  body_line_deviation: {
    max: PLANK_HOLD_PARAMS.BODY_LINE_THRESHOLD,
  },
  shoulder_elbow_alignment: {
    max: PLANK_HOLD_PARAMS.SHOULDER_ELBOW_ALIGNMENT_THRESHOLD,
  },
} as const;

