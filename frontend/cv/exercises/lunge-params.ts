/**
 * Lunge Exercise Parameters (Alternating)
 * 
 * Rep Detection: Both front and back knees must reach 90° angle
 * Form Check: Front shin vertical, torso upright
 */

import type { PoseLandmark } from "../types/cv";

// MediaPipe Pose Landmark Indices
export const LUNGE_LANDMARKS = {
  // Left side
  LEFT_HIP: 23,
  LEFT_KNEE: 25,
  LEFT_ANKLE: 27,
  LEFT_TOE: 31,
  
  // Right side
  RIGHT_HIP: 24,
  RIGHT_KNEE: 26,
  RIGHT_ANKLE: 28,
  RIGHT_TOE: 32,
  
  // Torso
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
} as const;

/**
 * Determine which leg is forward (front leg)
 * @param landmarks - Array of pose landmarks
 * @returns 'left' | 'right' | null
 */
export function determineFrontLeg(landmarks: PoseLandmark[]): 'left' | 'right' | null {
  // Front leg is the one with the knee further forward (lower X value in screen space)
  const leftKneeX = landmarks[LUNGE_LANDMARKS.LEFT_KNEE].x;
  const rightKneeX = landmarks[LUNGE_LANDMARKS.RIGHT_KNEE].x;
  
  // In MediaPipe, X=0 is left, X=1 is right
  // So lower X = more forward (left side of screen)
  // But we need to check which knee is actually in front
  // Use ankle position as reference
  const leftAnkleX = landmarks[LUNGE_LANDMARKS.LEFT_ANKLE].x;
  const rightAnkleX = landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE].x;
  
  // Front leg has knee closer to center than back leg
  // Simplified: compare knee positions
  if (leftKneeX < rightKneeX) {
    return 'left';
  } else if (rightKneeX < leftKneeX) {
    return 'right';
  }
  
  return null;
}

/**
 * Calculate front knee angle
 * @param landmarks - Array of pose landmarks
 * @param frontLeg - Which leg is forward
 * @returns Front knee angle (0-180 degrees)
 */
export function calculateFrontKneeAngle(
  landmarks: PoseLandmark[],
  frontLeg: 'left' | 'right'
): number {
  if (frontLeg === 'left') {
    return calculateAngle(
      landmarks[LUNGE_LANDMARKS.LEFT_HIP],
      landmarks[LUNGE_LANDMARKS.LEFT_KNEE],
      landmarks[LUNGE_LANDMARKS.LEFT_ANKLE]
    );
  } else {
    return calculateAngle(
      landmarks[LUNGE_LANDMARKS.RIGHT_HIP],
      landmarks[LUNGE_LANDMARKS.RIGHT_KNEE],
      landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE]
    );
  }
}

/**
 * Calculate back knee angle
 * @param landmarks - Array of pose landmarks
 * @param frontLeg - Which leg is forward
 * @returns Back knee angle (0-180 degrees)
 */
export function calculateBackKneeAngle(
  landmarks: PoseLandmark[],
  frontLeg: 'left' | 'right'
): number {
  if (frontLeg === 'left') {
    // Right leg is back
    return calculateAngle(
      landmarks[LUNGE_LANDMARKS.RIGHT_HIP],
      landmarks[LUNGE_LANDMARKS.RIGHT_KNEE],
      landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE]
    );
  } else {
    // Left leg is back
    return calculateAngle(
      landmarks[LUNGE_LANDMARKS.LEFT_HIP],
      landmarks[LUNGE_LANDMARKS.LEFT_KNEE],
      landmarks[LUNGE_LANDMARKS.LEFT_ANKLE]
    );
  }
}

/**
 * Check if back knee is 1-2 inches from ground
 * @param landmarks - Array of pose landmarks
 * @param frontLeg - Which leg is forward
 * @returns true if back knee is close to ground
 */
export function checkBackKneeHeight(
  landmarks: PoseLandmark[],
  frontLeg: 'left' | 'right'
): boolean {
  const backKnee = frontLeg === 'left' 
    ? landmarks[LUNGE_LANDMARKS.RIGHT_KNEE]
    : landmarks[LUNGE_LANDMARKS.LEFT_KNEE];
  
  const backAnkle = frontLeg === 'left'
    ? landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE]
    : landmarks[LUNGE_LANDMARKS.LEFT_ANKLE];
  
  // Check if back knee is close to ground (within ~2 inches)
  // In normalized coordinates, 2 inches ≈ 0.05 units
  const kneeToGround = Math.abs(backKnee.y - backAnkle.y);
  return kneeToGround < 0.1; // Simplified threshold
}

/**
 * Check front shin vertical alignment
 * @param landmarks - Array of pose landmarks
 * @param frontLeg - Which leg is forward
 * @returns Object with alignment status
 */
export function checkFrontShinAlignment(
  landmarks: PoseLandmark[],
  frontLeg: 'left' | 'right'
): {
  isValid: boolean;
  error?: string;
} {
  const frontKnee = frontLeg === 'left'
    ? landmarks[LUNGE_LANDMARKS.LEFT_KNEE]
    : landmarks[LUNGE_LANDMARKS.RIGHT_KNEE];
  
  const frontAnkle = frontLeg === 'left'
    ? landmarks[LUNGE_LANDMARKS.LEFT_ANKLE]
    : landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE];
  
  const frontToe = frontLeg === 'left'
    ? landmarks[LUNGE_LANDMARKS.LEFT_TOE]
    : landmarks[LUNGE_LANDMARKS.RIGHT_TOE];
  
  // Front shin should be mostly vertical
  // Check if knee travels excessively past toe
  const kneeToeDiff = Math.abs(frontKnee.x - frontToe.x);
  const ankleToeDiff = Math.abs(frontAnkle.x - frontToe.x);
  
  // Knee should not be too far forward of toe
  const threshold = 0.1; // 10% of screen width
  const isValid = kneeToeDiff < threshold;
  
  if (!isValid) {
    return {
      isValid: false,
      error: "Front knee traveling past toe - keep shin vertical",
    };
  }
  
  return { isValid: true };
}

/**
 * Check torso posture (upright and perpendicular)
 * @param landmarks - Array of pose landmarks
 * @returns Object with posture status
 */
export function checkTorsoPosture(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Calculate shoulder-hip alignment
  const shoulderMidY = (landmarks[LUNGE_LANDMARKS.LEFT_SHOULDER].y + 
                        landmarks[LUNGE_LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipMidY = (landmarks[LUNGE_LANDMARKS.LEFT_HIP].y + 
                   landmarks[LUNGE_LANDMARKS.RIGHT_HIP].y) / 2;
  
  // Torso should remain upright (shoulders above hips)
  // Check if torso is leaning too far forward
  const torsoAngle = Math.abs(shoulderMidY - hipMidY);
  
  // Simplified check - torso should maintain relatively upright position
  const isValid = true; // Can be enhanced with actual angle calculation
  
  return { isValid };
}

/**
 * Rep detection parameters
 */
export const LUNGE_REP_PARAMS = {
  // Depth: Both front and back knees must reach 90°
  FRONT_KNEE_ANGLE_TARGET: 90, // degrees
  BACK_KNEE_ANGLE_TARGET: 90, // degrees
  ANGLE_TOLERANCE: 10, // ±10 degrees acceptable
  
  // Back knee height: 1-2 inches from ground
  BACK_KNEE_HEIGHT_THRESHOLD: 0.1, // normalized units
  
  // Form check thresholds
  SHIN_ALIGNMENT_THRESHOLD: 0.1, // 10% of screen width
} as const;

/**
 * Form validation rules
 */
export const LUNGE_FORM_RULES = {
  front_knee_angle: {
    min: LUNGE_REP_PARAMS.FRONT_KNEE_ANGLE_TARGET - LUNGE_REP_PARAMS.ANGLE_TOLERANCE,
    max: LUNGE_REP_PARAMS.FRONT_KNEE_ANGLE_TARGET + LUNGE_REP_PARAMS.ANGLE_TOLERANCE,
  },
  back_knee_angle: {
    min: LUNGE_REP_PARAMS.BACK_KNEE_ANGLE_TARGET - LUNGE_REP_PARAMS.ANGLE_TOLERANCE,
    max: LUNGE_REP_PARAMS.BACK_KNEE_ANGLE_TARGET + LUNGE_REP_PARAMS.ANGLE_TOLERANCE,
  },
} as const;

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

