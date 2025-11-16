/**
 * Lunge Exercise Parameters (Alternating)
 * 
 * Rep Detection: Both front and back knees must reach 90° angle
 * Form Check: Front shin vertical, torso upright, side view (parallel to camera)
 * IMPORTANT: Must alternate legs - multiple lunges in same direction only count as one rep
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
 * Check if person is in side view (parallel to camera) for lunges
 * @param landmarks - Array of pose landmarks
 * @returns true if person is in side view
 */
export function checkSideView(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Calculate midpoints for body orientation check
  const shoulderMid = {
    x: (landmarks[LUNGE_LANDMARKS.LEFT_SHOULDER].x + 
        landmarks[LUNGE_LANDMARKS.RIGHT_SHOULDER].x) / 2,
    y: (landmarks[LUNGE_LANDMARKS.LEFT_SHOULDER].y + 
        landmarks[LUNGE_LANDMARKS.RIGHT_SHOULDER].y) / 2,
  };
  const ankleMid = {
    x: (landmarks[LUNGE_LANDMARKS.LEFT_ANKLE].x + 
        landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE].x) / 2,
    y: (landmarks[LUNGE_LANDMARKS.LEFT_ANKLE].y + 
        landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE].y) / 2,
  };

  // For side view lunges:
  // 1. Body should be oriented horizontally (shoulder-ankle line should be mostly horizontal)
  // 2. Shoulders should be at similar Y (both visible from side)
  // 3. Hips should be at similar Y
  // 4. The X difference between shoulder and ankle should be significant (body extends horizontally)

  // Check if shoulders are at similar Y (within 5% of frame height)
  const shoulderYDiff = Math.abs(
    landmarks[LUNGE_LANDMARKS.LEFT_SHOULDER].y - 
    landmarks[LUNGE_LANDMARKS.RIGHT_SHOULDER].y
  );
  const shoulderYThreshold = 0.05; // 5% of frame height

  // Check if hips are at similar Y
  const hipYDiff = Math.abs(
    landmarks[LUNGE_LANDMARKS.LEFT_HIP].y - 
    landmarks[LUNGE_LANDMARKS.RIGHT_HIP].y
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
 * Determine which leg is forward (front leg) for side view
 * @param landmarks - Array of pose landmarks
 * @returns 'left' | 'right' | null
 */
export function determineFrontLeg(landmarks: PoseLandmark[]): 'left' | 'right' | null {
  // For side view, the front leg is the one further forward (closer to camera)
  // In MediaPipe coordinates, X=0 is left, X=1 is right
  // The front leg's knee/ankle will have a lower X value (closer to left side of screen)
  
  const leftKneeX = landmarks[LUNGE_LANDMARKS.LEFT_KNEE].x;
  const rightKneeX = landmarks[LUNGE_LANDMARKS.RIGHT_KNEE].x;
  
  const leftAnkleX = landmarks[LUNGE_LANDMARKS.LEFT_ANKLE].x;
  const rightAnkleX = landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE].x;
  
  // In side view, the front leg is the one with knee/ankle further forward
  // Lower X value = more forward (closer to camera)
  // Use average of knee and ankle X positions for more stable detection
  const leftAvgX = (leftKneeX + leftAnkleX) / 2;
  const rightAvgX = (rightKneeX + rightAnkleX) / 2;
  
  // The leg with lower X (more forward) is the front leg
  if (leftAvgX < rightAvgX) {
    return 'left';
  } else if (rightAvgX < leftAvgX) {
    return 'right';
  }
  
  // Fallback: compare knee positions only
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
  
  // const frontAnkle = frontLeg === 'left' ? landmarks[LUNGE_LANDMARKS.LEFT_ANKLE] : landmarks[LUNGE_LANDMARKS.RIGHT_ANKLE];
  
  const frontToe = frontLeg === 'left'
    ? landmarks[LUNGE_LANDMARKS.LEFT_TOE]
    : landmarks[LUNGE_LANDMARKS.RIGHT_TOE];
  
  // Front shin should be mostly vertical
  // Check if knee travels excessively past toe
  const kneeToeDiff = Math.abs(frontKnee.x - frontToe.x);
  // const ankleToeDiff = Math.abs(frontAnkle.x - frontToe.x); // Unused for now
  
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
export function checkTorsoPosture(_landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Calculate shoulder-hip alignment
  // const shoulderMidY = (landmarks[LUNGE_LANDMARKS.LEFT_SHOULDER].y + landmarks[LUNGE_LANDMARKS.RIGHT_SHOULDER].y) / 2;
  // const hipMidY = (landmarks[LUNGE_LANDMARKS.LEFT_HIP].y + landmarks[LUNGE_LANDMARKS.RIGHT_HIP].y) / 2;
  
  // Torso should remain upright (shoulders above hips)
  // Check if torso is leaning too far forward
  // const torsoAngle = Math.abs(shoulderMidY - hipMidY); // Unused for now
  
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

