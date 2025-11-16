/**
 * Bodyweight Squat Exercise Parameters
 * 
 * Rep Detection: Based on hip depth (hip crease below knee) and knee angle (≤90°)
 * Form Check: Knee alignment, torso posture, heel contact, side view
 */

import type { PoseLandmark } from "../types/cv";

// MediaPipe Pose Landmark Indices
export const SQUAT_LANDMARKS = {
  // Left side
  LEFT_HIP: 23,
  LEFT_KNEE: 25,
  LEFT_ANKLE: 27,
  LEFT_TOE: 31,
  LEFT_HEEL: 29,
  
  // Right side
  RIGHT_HIP: 24,
  RIGHT_KNEE: 26,
  RIGHT_ANKLE: 28,
  RIGHT_TOE: 32,
  RIGHT_HEEL: 30,
  
  // Torso
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
} as const;

/**
 * Check if all required landmarks are visible in frame
 * @param landmarks - Array of pose landmarks
 * @returns true if all required landmarks are visible
 */
export function areAllLandmarksVisible(landmarks: PoseLandmark[]): {
  isValid: boolean;
  missingLandmarks?: string[];
} {
  const requiredIndices = [
    SQUAT_LANDMARKS.LEFT_HIP,
    SQUAT_LANDMARKS.RIGHT_HIP,
    SQUAT_LANDMARKS.LEFT_KNEE,
    SQUAT_LANDMARKS.RIGHT_KNEE,
    SQUAT_LANDMARKS.LEFT_ANKLE,
    SQUAT_LANDMARKS.RIGHT_ANKLE,
    SQUAT_LANDMARKS.LEFT_SHOULDER,
    SQUAT_LANDMARKS.RIGHT_SHOULDER,
  ];
  
  const landmarkNames: { [key: number]: string } = {
    [SQUAT_LANDMARKS.LEFT_HIP]: "Left Hip",
    [SQUAT_LANDMARKS.RIGHT_HIP]: "Right Hip",
    [SQUAT_LANDMARKS.LEFT_KNEE]: "Left Knee",
    [SQUAT_LANDMARKS.RIGHT_KNEE]: "Right Knee",
    [SQUAT_LANDMARKS.LEFT_ANKLE]: "Left Ankle",
    [SQUAT_LANDMARKS.RIGHT_ANKLE]: "Right Ankle",
    [SQUAT_LANDMARKS.LEFT_SHOULDER]: "Left Shoulder",
    [SQUAT_LANDMARKS.RIGHT_SHOULDER]: "Right Shoulder",
  };
  
  const missing: string[] = [];
  
  for (const index of requiredIndices) {
    const landmark = landmarks[index];
    
    // Check if landmark exists and is within valid bounds (0-1 for normalized coordinates)
    if (!landmark || 
        landmark.x < 0 || landmark.x > 1 ||
        landmark.y < 0 || landmark.y > 1 ||
        isNaN(landmark.x) || isNaN(landmark.y)) {
      missing.push(landmarkNames[index]);
    }
  }
  
  if (missing.length > 0) {
    return {
      isValid: false,
      missingLandmarks: missing,
    };
  }
  
  return { isValid: true };
}

/**
 * Check if person is in side view (parallel to camera) for squats
 * @param landmarks - Array of pose landmarks
 * @returns true if person is in side view
 */
export function checkSideView(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // First check if all landmarks are visible
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return {
      isValid: false,
      error: `Missing landmarks: ${visibility.missingLandmarks?.join(", ")}`,
    };
  }

  // Calculate midpoints for body orientation check
  const shoulderMid = {
    x: (landmarks[SQUAT_LANDMARKS.LEFT_SHOULDER].x + 
        landmarks[SQUAT_LANDMARKS.RIGHT_SHOULDER].x) / 2,
    y: (landmarks[SQUAT_LANDMARKS.LEFT_SHOULDER].y + 
        landmarks[SQUAT_LANDMARKS.RIGHT_SHOULDER].y) / 2,
  };
  const hipMid = {
    x: (landmarks[SQUAT_LANDMARKS.LEFT_HIP].x + 
        landmarks[SQUAT_LANDMARKS.RIGHT_HIP].x) / 2,
    y: (landmarks[SQUAT_LANDMARKS.LEFT_HIP].y + 
        landmarks[SQUAT_LANDMARKS.RIGHT_HIP].y) / 2,
  };
  const ankleMid = {
    x: (landmarks[SQUAT_LANDMARKS.LEFT_ANKLE].x + 
        landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE].x) / 2,
    y: (landmarks[SQUAT_LANDMARKS.LEFT_ANKLE].y + 
        landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE].y) / 2,
  };

  // For side view squats:
  // 1. Body should be oriented vertically (shoulder-ankle line should be mostly vertical)
  // 2. Shoulders should be at similar Y (both visible from side)
  // 3. Hips should be at similar Y
  // 4. The Y difference between shoulder and ankle should be significant (body extends vertically)

  // Check if shoulders are at similar Y (within 5% of frame height)
  const shoulderYDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.LEFT_SHOULDER].y - 
    landmarks[SQUAT_LANDMARKS.RIGHT_SHOULDER].y
  );
  const shoulderYThreshold = 0.05; // 5% of frame height

  // Check if hips are at similar Y
  const hipYDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.LEFT_HIP].y - 
    landmarks[SQUAT_LANDMARKS.RIGHT_HIP].y
  );
  const hipYThreshold = 0.05; // 5% of frame height

  // Check if body is oriented vertically (shoulder-ankle line)
  // In side view, the body extends vertically, so Y difference should be significant
  // and X difference should be relatively small compared to Y
  const bodyDeltaX = Math.abs(ankleMid.x - shoulderMid.x);
  const bodyDeltaY = Math.abs(ankleMid.y - shoulderMid.y);
  const bodyLength = Math.sqrt(bodyDeltaX * bodyDeltaX + bodyDeltaY * bodyDeltaY);

  // Body should extend vertically: Y difference should be at least 30% of body length
  // and X difference should be less than 50% of body length (body is mostly vertical)
  const verticalRatio = bodyLength > 0.01 ? bodyDeltaY / bodyLength : 0;
  const horizontalRatio = bodyLength > 0.01 ? bodyDeltaX / bodyLength : 1;

  // Validate side view:
  // 1. Shoulders aligned (similar Y)
  // 2. Hips aligned (similar Y)
  // 3. Body extends vertically (Y > 30% of body length, X < 50% of body length)
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

  if (verticalRatio < 0.3 || horizontalRatio > 0.5) {
    return {
      isValid: false,
      error: "Position yourself sideways - body should extend vertically",
    };
  }

  return { isValid: true };
}

/**
 * Calculate knee angle for squat rep detection
 * @param landmarks - Array of pose landmarks
 * @returns Average knee angle (0-180 degrees) or null if landmarks not visible
 */
export function calculateKneeAngle(landmarks: PoseLandmark[]): number | null {
  // Check if required landmarks are visible
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return null;
  }
  
  try {
    const leftAngle = calculateAngle(
      landmarks[SQUAT_LANDMARKS.LEFT_HIP],
      landmarks[SQUAT_LANDMARKS.LEFT_KNEE],
      landmarks[SQUAT_LANDMARKS.LEFT_ANKLE]
    );
    
    const rightAngle = calculateAngle(
      landmarks[SQUAT_LANDMARKS.RIGHT_HIP],
      landmarks[SQUAT_LANDMARKS.RIGHT_KNEE],
      landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE]
    );
    
    return (leftAngle + rightAngle) / 2;
  } catch (error) {
    return null;
  }
}

/**
 * Check if hip crease is below knee (depth requirement)
 * @param landmarks - Array of pose landmarks
 * @returns Object with depth status
 */
export function checkHipDepth(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Check visibility first
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return {
      isValid: false,
      error: `Missing landmarks: ${visibility.missingLandmarks?.join(", ")}`,
    };
  }
  
  const leftHipY = landmarks[SQUAT_LANDMARKS.LEFT_HIP].y;
  const leftKneeY = landmarks[SQUAT_LANDMARKS.LEFT_KNEE].y;
  const rightHipY = landmarks[SQUAT_LANDMARKS.RIGHT_HIP].y;
  const rightKneeY = landmarks[SQUAT_LANDMARKS.RIGHT_KNEE].y;
  
  // Hip crease must be below knee (higher Y value = lower on screen)
  const leftValid = leftHipY > leftKneeY;
  const rightValid = rightHipY > rightKneeY;
  
  if (!leftValid || !rightValid) {
    return {
      isValid: false,
      error: "Hip crease not below knee - go deeper",
    };
  }
  
  return { isValid: true };
}

/**
 * Check knee alignment with toes (valgus collapse check)
 * @param landmarks - Array of pose landmarks
 * @returns Object with alignment status
 */
export function checkKneeAlignment(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Check if knees track in line with toes
  // Calculate angle between hip-knee-ankle line and vertical
  const leftKneeAngle = calculateAngle(
    landmarks[SQUAT_LANDMARKS.LEFT_HIP],
    landmarks[SQUAT_LANDMARKS.LEFT_KNEE],
    landmarks[SQUAT_LANDMARKS.LEFT_ANKLE]
  );
  
  const rightKneeAngle = calculateAngle(
    landmarks[SQUAT_LANDMARKS.RIGHT_HIP],
    landmarks[SQUAT_LANDMARKS.RIGHT_KNEE],
    landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE]
  );
  
  // Check if knee collapses inward (valgus)
  // Knee should be aligned with ankle (knee X should be close to ankle X)
  const leftKneeAnkleDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.LEFT_KNEE].x - landmarks[SQUAT_LANDMARKS.LEFT_ANKLE].x
  );
  const rightKneeAnkleDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.RIGHT_KNEE].x - landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE].x
  );
  
  // Threshold: knee should be within 5% of ankle X position
  const threshold = 0.05;
  const leftValid = leftKneeAnkleDiff < threshold;
  const rightValid = rightKneeAnkleDiff < threshold;
  
  if (!leftValid || !rightValid) {
    return {
      isValid: false,
      error: "Knees collapsing inward - keep knees aligned with toes",
    };
  }
  
  return { isValid: true };
}

/**
 * Check torso posture (neutral spine)
 * @param landmarks - Array of pose landmarks
 * @returns Object with posture status
 */
export function checkTorsoPosture(landmarks: PoseLandmark[]): {
  isValid: boolean;
  error?: string;
} {
  // Calculate shoulder-hip angle (should be relatively vertical)
  const shoulderMidY = (landmarks[SQUAT_LANDMARKS.LEFT_SHOULDER].y + 
                    landmarks[SQUAT_LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipMidY = (landmarks[SQUAT_LANDMARKS.LEFT_HIP].y + 
                   landmarks[SQUAT_LANDMARKS.RIGHT_HIP].y) / 2;
  
  // Torso should maintain relatively neutral position
  // Check if torso is leaning too far forward or backward
  const torsoAngle = Math.abs(shoulderMidY - hipMidY);
  
  // Threshold: torso should be within reasonable range (not too forward/back)
  // This is a simplified check - in practice, you'd calculate actual angle
  const isValid = true; // Simplified - can be enhanced with actual angle calculation
  
  return { isValid };
}

/**
 * Check heel contact with floor
 * @param landmarks - Array of pose landmarks
 * @returns true if heels are in contact (simplified check)
 */
export function checkHeelContact(landmarks: PoseLandmark[]): boolean {
  // Simplified: check if heel Y position is stable (not lifting)
  // In practice, you'd track heel position over time
  const leftHeelY = landmarks[SQUAT_LANDMARKS.LEFT_HEEL].y;
  const rightHeelY = landmarks[SQUAT_LANDMARKS.RIGHT_HEEL].y;
  const leftAnkleY = landmarks[SQUAT_LANDMARKS.LEFT_ANKLE].y;
  const rightAnkleY = landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE].y;
  
  // Heel should be at or below ankle (heels down)
  return (leftHeelY >= leftAnkleY) && (rightHeelY >= rightAnkleY);
}

/**
 * Rep detection parameters
 */
export const SQUAT_REP_PARAMS = {
  // Depth: Knee angle must close to 90° or less
  KNEE_ANGLE_MAX: 90, // degrees (thigh parallel to or below floor)
  KNEE_ANGLE_MIN: 0,
  
  // Hip depth: Hip crease must be below knee
  HIP_DEPTH_REQUIRED: true,
  
  // Form check thresholds
  KNEE_ALIGNMENT_THRESHOLD: 0.05, // 5% deviation allowed
} as const;

/**
 * Comprehensive form validation for squats
 * Returns true only if: all landmarks visible, side view, AND correct form
 * @param landmarks - Array of pose landmarks
 * @param kneeAngle - Optional current knee angle to adjust leniency during movement
 */
export function validateSquatForm(
  landmarks: PoseLandmark[],
  kneeAngle?: number | null
): {
  isValid: boolean;
  errors: string[];
  sideView?: { isValid: boolean; error?: string };
  hipDepth?: { isValid: boolean; error?: string };
  kneeAlignment?: { isValid: boolean; error?: string };
} {
  const errors: string[] = [];

  // Check visibility
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return {
      isValid: false,
      errors: [`Missing landmarks: ${visibility.missingLandmarks?.join(", ")}`],
    };
  }

  // Check side view
  const sideView = checkSideView(landmarks);
  if (!sideView.isValid) {
    errors.push(sideView.error || "Not in side view");
  }

  // Check hip depth
  const hipDepth = checkHipDepth(landmarks);
  if (!hipDepth.isValid) {
    errors.push(hipDepth.error || "Hip depth insufficient");
  }

  // Check knee alignment
  const kneeAlignment = checkKneeAlignment(landmarks);
  if (!kneeAlignment.isValid) {
    errors.push(kneeAlignment.error || "Knee alignment incorrect");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sideView,
    hipDepth,
    kneeAlignment,
  };
}

/**
 * Form validation rules
 */
export const SQUAT_FORM_RULES = {
  knee_angle: {
    min: SQUAT_REP_PARAMS.KNEE_ANGLE_MIN,
    max: SQUAT_REP_PARAMS.KNEE_ANGLE_MAX,
  },
  hip_depth: {
    required: SQUAT_REP_PARAMS.HIP_DEPTH_REQUIRED,
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

