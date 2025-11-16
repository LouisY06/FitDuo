/**
 * Plank Hold Exercise Parameters (Static Hold)
 * 
 * Time Validation: Maintain body line alignment over time
 * Breakage: Hips rise (piking) or sag (arching) stops timer
 * View: Side view required (parallel to camera)
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
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

/**
 * Check if person is in side view (parallel to camera) for planks
 * @param landmarks - Array of pose landmarks
 * @returns true if person is in side view
 */
export function checkSideView(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Calculate midpoints for body orientation check
  const shoulderMid = {
    x: (landmarks[PLANK_LANDMARKS.LEFT_SHOULDER].x + 
        landmarks[PLANK_LANDMARKS.RIGHT_SHOULDER].x) / 2,
    y: (landmarks[PLANK_LANDMARKS.LEFT_SHOULDER].y + 
        landmarks[PLANK_LANDMARKS.RIGHT_SHOULDER].y) / 2,
  };
  const ankleMid = {
    x: (landmarks[PLANK_LANDMARKS.LEFT_ANKLE].x + 
        landmarks[PLANK_LANDMARKS.RIGHT_ANKLE].x) / 2,
    y: (landmarks[PLANK_LANDMARKS.LEFT_ANKLE].y + 
        landmarks[PLANK_LANDMARKS.RIGHT_ANKLE].y) / 2,
  };

  // For side view planks:
  // 1. Body should be oriented horizontally (shoulder-ankle line should be mostly horizontal)
  // 2. Shoulders should be at similar Y (both visible from side)
  // 3. Hips should be at similar Y
  // 4. The X difference between shoulder and ankle should be significant (body extends horizontally)

  // Check if shoulders are at similar Y (within 5% of frame height)
  const shoulderYDiff = Math.abs(
    landmarks[PLANK_LANDMARKS.LEFT_SHOULDER].y - 
    landmarks[PLANK_LANDMARKS.RIGHT_SHOULDER].y
  );
  const shoulderYThreshold = 0.05; // 5% of frame height

  // Check if hips are at similar Y
  const hipYDiff = Math.abs(
    landmarks[PLANK_LANDMARKS.LEFT_HIP].y - 
    landmarks[PLANK_LANDMARKS.RIGHT_HIP].y
  );
  const hipYThreshold = 0.05; // 5% of frame height

  // Check if body is oriented horizontally (shoulder-ankle line)
  // In side view, the body extends horizontally, so X difference should be significant
  // and Y difference should be relatively small compared to X
  const bodyDeltaX = Math.abs(ankleMid.x - shoulderMid.x);
  const bodyDeltaY = Math.abs(ankleMid.y - shoulderMid.y);
  const bodyLength = Math.sqrt(bodyDeltaX * bodyDeltaX + bodyDeltaY * bodyDeltaY);

  // Body should extend horizontally: X difference should be at least 30% of body length
  // and Y difference should be less than 50% of body length (body is mostly horizontal)
  const horizontalRatio = bodyLength > 0.01 ? bodyDeltaX / bodyLength : 0;
  const verticalRatio = bodyLength > 0.01 ? bodyDeltaY / bodyLength : 1;

  // Validate side view:
  // 1. Shoulders aligned (similar Y)
  // 2. Hips aligned (similar Y)
  // 3. Body extends horizontally (X > 30% of body length, Y < 50% of body length)
  if (shoulderYDiff > shoulderYThreshold) {
    return {
      isValid: false,
      error: "Position yourself sideways - both shoulders should be visible",
    };
  }

  if (hipYDiff > hipYThreshold) {
    return {
      isValid: false,
      error: "Position yourself sideways - both hips should be visible",
    };
  }

  if (horizontalRatio < 0.3 || verticalRatio > 0.5) {
    return {
      isValid: false,
      error: "Position yourself sideways - body should extend horizontally",
    };
  }

  return { isValid: true };
}

/**
 * Check initial setup: shoulders somewhat over elbows (very lenient)
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
  
  // Shoulders should be somewhat positioned over elbows (very lenient - 20% threshold)
  const alignment = Math.abs(shoulderMidX - elbowMidX);
  const threshold = 0.20; // 20% of screen width (very lenient)
  
  if (alignment > threshold) {
    return {
      isValid: false,
      error: "Position shoulders somewhat over elbows",
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
  // First check side view
  const sideView = checkSideView(landmarks);
  if (!sideView.isValid) {
    return {
      isValid: false,
      deviation: 999,
      error: sideView.error,
    };
  }
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
  
  // Threshold: hips should be within ~35% of shoulder-ankle line (very lenient)
  // Note: This should match PLANK_HOLD_PARAMS.BODY_LINE_THRESHOLD
  // Only breaks if body line is significantly broken (knees bent or major sagging/piking)
  const threshold = 0.35; // 35% deviation allowed (very lenient - only breaks on major form issues)
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
 * Check if knees are bent (knees should be straight in plank)
 * @param landmarks - Array of pose landmarks
 * @returns Object with knee bend status
 */
export function checkKneeBend(landmarks: PoseLandmark[]): {
  isBent: boolean;
  reason?: string;
} {
  // Calculate knee angles for both legs
  const leftKneeAngle = calculateAngle(
    landmarks[PLANK_LANDMARKS.LEFT_HIP],
    landmarks[PLANK_LANDMARKS.LEFT_KNEE],
    landmarks[PLANK_LANDMARKS.LEFT_ANKLE]
  );
  const rightKneeAngle = calculateAngle(
    landmarks[PLANK_LANDMARKS.RIGHT_HIP],
    landmarks[PLANK_LANDMARKS.RIGHT_KNEE],
    landmarks[PLANK_LANDMARKS.RIGHT_ANKLE]
  );

  // In plank, knees should be straight (close to 180°)
  // Allow some bend (down to 160°) before considering it broken
  const minKneeAngle = 160; // degrees - very lenient
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  if (avgKneeAngle < minKneeAngle) {
    return {
      isBent: true,
      reason: `Knees bent (${avgKneeAngle.toFixed(1)}°) - keep legs straight`,
    };
  }

  return { isBent: false };
}

/**
 * Helper: Calculate angle between three points
 */
function calculateAngle(
  point1: PoseLandmark,
  point2: PoseLandmark,
  point3: PoseLandmark
): number {
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
 * Check if knees have collapsed (only check for stopping timer once it's running)
 * Timer stops only when knees bend significantly (< 160°)
 * @param landmarks - Array of pose landmarks
 * @returns Object with knee collapse status
 */
export function checkKneeCollapse(landmarks: PoseLandmark[]): {
  isCollapsed: boolean;
  reason?: string;
} {
  // Check if knees are bent (knee collapse - only reason to stop timer)
  const kneeCheck = checkKneeBend(landmarks);
  if (kneeCheck.isBent) {
    return {
      isCollapsed: true,
      reason: kneeCheck.reason,
    };
  }
  
  return { isCollapsed: false };
}

/**
 * Determine if plank initial setup is valid (for starting timer)
 * Timer starts when: Side View ✅, Initial Setup ✅, Body Line ✅, Knees Straight ✅
 * @param landmarks - Array of pose landmarks
 * @returns Object with initial setup status
 */
export function checkPlankInitialSetup(landmarks: PoseLandmark[]): {
  isValid: boolean;
  reason?: string;
} {
  // Check side view
  const sideView = checkSideView(landmarks);
  if (!sideView.isValid) {
    return {
      isValid: false,
      reason: sideView.error,
    };
  }

  // Check initial setup (shoulders over elbows)
  const setup = checkInitialSetup(landmarks);
  if (!setup.isValid) {
    return {
      isValid: false,
      reason: setup.error,
    };
  }

  // Check body line (shoulder-hip-ankle alignment)
  const bodyLine = checkBodyLine(landmarks);
  if (!bodyLine.isValid) {
    return {
      isValid: false,
      reason: bodyLine.error,
    };
  }

  // Check knees are straight (for initial setup)
  const kneeCheck = checkKneeBend(landmarks);
  if (kneeCheck.isBent) {
    return {
      isValid: false,
      reason: kneeCheck.reason,
    };
  }
  
  return { isValid: true };
}

/**
 * Determine if plank is broken (legacy function - kept for compatibility)
 * @deprecated Use checkKneeCollapse for stopping timer, checkPlankInitialSetup for starting
 */
export function checkPlankBreakage(landmarks: PoseLandmark[]): {
  isBroken: boolean;
  reason?: string;
} {
  // For backward compatibility, check knee collapse
  const kneeCollapse = checkKneeCollapse(landmarks);
  return {
    isBroken: kneeCollapse.isCollapsed,
    reason: kneeCollapse.reason,
  };
}

/**
 * Static hold parameters
 */
export const PLANK_HOLD_PARAMS = {
  // Body line threshold (very lenient - only breaks on major form issues)
  BODY_LINE_THRESHOLD: 0.35, // 35% deviation allowed (very lenient)
  
  // Stability threshold (for timer validation)
  STABILITY_THRESHOLD: 0.01, // 1% movement allowed
  
  // Breakage thresholds (only for significant breaks)
  PIKING_THRESHOLD: 0.35, // 35% above line = piking (major break)
  SAGGING_THRESHOLD: 0.35, // 35% below line = sagging (major break)
  
  // Initial setup (very lenient)
  SHOULDER_ELBOW_ALIGNMENT_THRESHOLD: 0.20, // 20% of screen width (very lenient)
  
  // Knee bend threshold
  MIN_KNEE_ANGLE: 160, // degrees - knees must be at least 160° (very lenient)
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

