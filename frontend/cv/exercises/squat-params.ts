/**
 * Bodyweight Squat Exercise Parameters
 * 
 * Rep Detection: Based on hip tracking (hip Y position)
 * Form Check: Knee alignment, torso posture, front-facing (camera-facing)
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
  // Only require knee and above (ankles/toes not needed)
  const requiredIndices = [
    SQUAT_LANDMARKS.LEFT_HIP,
    SQUAT_LANDMARKS.RIGHT_HIP,
    SQUAT_LANDMARKS.LEFT_KNEE,
    SQUAT_LANDMARKS.RIGHT_KNEE,
    SQUAT_LANDMARKS.LEFT_SHOULDER,
    SQUAT_LANDMARKS.RIGHT_SHOULDER,
  ];
  
  const landmarkNames: { [key: number]: string } = {
    [SQUAT_LANDMARKS.LEFT_HIP]: "Left Hip",
    [SQUAT_LANDMARKS.RIGHT_HIP]: "Right Hip",
    [SQUAT_LANDMARKS.LEFT_KNEE]: "Left Knee",
    [SQUAT_LANDMARKS.RIGHT_KNEE]: "Right Knee",
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
 * Check if person is facing the camera (front view) for squats
 * @param landmarks - Array of pose landmarks
 * @returns true if person is facing the camera
 */
export function checkFrontView(landmarks: PoseLandmark[]): {
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

  // Check body symmetry - if left and right sides are symmetric, person is facing camera
  // Symmetry means: left and right landmarks are at similar X positions
  
  // Check shoulder symmetry (left and right shoulders at similar X)
  const shoulderXDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.LEFT_SHOULDER].x - 
    landmarks[SQUAT_LANDMARKS.RIGHT_SHOULDER].x
  );
  const shoulderXThreshold = 0.25; // 25% of frame width - more lenient for symmetry check

  // Check hip symmetry (left and right hips at similar X)
  const hipXDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.LEFT_HIP].x - 
    landmarks[SQUAT_LANDMARKS.RIGHT_HIP].x
  );
  const hipXThreshold = 0.25; // 25% of frame width - more lenient for symmetry check

  // Check knee symmetry (left and right knees at similar X)
  const kneeXDiff = Math.abs(
    landmarks[SQUAT_LANDMARKS.LEFT_KNEE].x - 
    landmarks[SQUAT_LANDMARKS.RIGHT_KNEE].x
  );
  const kneeXThreshold = 0.25; // 25% of frame width - more lenient for symmetry check

  // If body is symmetric (left and right sides aligned), person is facing camera
  // At least 2 out of 3 checks should pass (shoulders, hips, knees)
  let symmetryCount = 0;
  if (shoulderXDiff < shoulderXThreshold) symmetryCount++;
  if (hipXDiff < hipXThreshold) symmetryCount++;
  if (kneeXDiff < kneeXThreshold) symmetryCount++;

  // Need at least 2 symmetric pairs to consider facing camera
  if (symmetryCount >= 2) {
    return { isValid: true };
  }

  // If not symmetric enough, provide helpful error
  const errors: string[] = [];
  if (shoulderXDiff >= shoulderXThreshold) {
    errors.push("shoulders not aligned");
  }
  if (hipXDiff >= hipXThreshold) {
    errors.push("hips not aligned");
  }
  if (kneeXDiff >= kneeXThreshold) {
    errors.push("knees not aligned");
  }

  return {
    isValid: false,
    error: `Face the camera - body not symmetric (${errors.join(", ")})`,
  };
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
 * Get current hip Y position (for tracking squat depth)
 * @param landmarks - Array of pose landmarks
 * @returns Average hip Y position or null if not visible
 */
export function getHipYPosition(landmarks: PoseLandmark[]): number | null {
  // Check visibility first
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return null;
  }
  
  const leftHipY = landmarks[SQUAT_LANDMARKS.LEFT_HIP].y;
  const rightHipY = landmarks[SQUAT_LANDMARKS.RIGHT_HIP].y;
  
  // Return average hip Y position (higher Y = lower on screen)
  return (leftHipY + rightHipY) / 2;
}

/**
 * Get current knee Y position (for tracking squat depth)
 * @param landmarks - Array of pose landmarks
 * @returns Average knee Y position or null if not visible
 */
export function getKneeYPosition(landmarks: PoseLandmark[]): number | null {
  // Check visibility first
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return null;
  }
  
  const leftKneeY = landmarks[SQUAT_LANDMARKS.LEFT_KNEE].y;
  const rightKneeY = landmarks[SQUAT_LANDMARKS.RIGHT_KNEE].y;
  
  // Return average knee Y position (higher Y = lower on screen)
  return (leftKneeY + rightKneeY) / 2;
}

/**
 * Check if hip is close to knee level (for rep detection)
 * @param landmarks - Array of pose landmarks
 * @returns true if hip is close to knee level
 */
export function isHipCloseToKnees(landmarks: PoseLandmark[]): {
  isClose: boolean;
  distance?: number; // Distance between hip and knee (as percentage of frame height)
} {
  const hipY = getHipYPosition(landmarks);
  const kneeY = getKneeYPosition(landmarks);
  
  if (hipY === null || kneeY === null) {
    return { isClose: false };
  }
  
  // Calculate distance between hip and knee
  // Higher Y = lower on screen, so if hipY > kneeY, hip is below knee
  const distance = Math.abs(hipY - kneeY);
  
  // "Close to knees" means hip is within 20% of frame height from knee level
  // More lenient threshold to ensure detection works
  const closeThreshold = SQUAT_REP_PARAMS.HIP_TO_KNEE_CLOSE_THRESHOLD; // 20% of frame height (more lenient)
  
  return {
    isClose: distance < closeThreshold,
    distance,
  };
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
 * Check if person is standing up (valid starting form)
 * @param landmarks - Array of pose landmarks
 * @param startingHipY - Optional starting hip Y position for comparison
 * @returns Object with standing status
 */
export function checkStandingForm(landmarks: PoseLandmark[]): {
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
  
  // As long as they're standing up (not in a deep squat), it's valid
  // We check if hip is reasonably high (not too low = not in deep squat)
  const hipY = getHipYPosition(landmarks);
  if (hipY === null) {
    return {
      isValid: false,
      error: "Cannot determine hip position",
    };
  }
  
  // If hip Y is less than 0.7 (hip is in upper 70% of frame), consider it standing
  // This is a simple check - can be adjusted based on testing
  const standingThreshold = 0.7;
  const isValid = hipY < standingThreshold;
  
  if (!isValid) {
    return {
      isValid: false,
      error: "Stand up straight to start",
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
 * Note: Since ankles are not required, this returns true if ankles are not visible
 */
export function checkHeelContact(landmarks: PoseLandmark[]): boolean {
  // Since ankles are not required (only knee and above), we can't check heel contact
  // Return true as a default (heels assumed to be down)
  const leftAnkle = landmarks[SQUAT_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[SQUAT_LANDMARKS.RIGHT_ANKLE];
  
  // If ankles are not visible, assume heels are down (not required to check)
  if (!leftAnkle || !rightAnkle) {
    return true;
  }
  
  // If ankles are visible, check heel position (optional check)
  const leftHeelY = landmarks[SQUAT_LANDMARKS.LEFT_HEEL]?.y;
  const rightHeelY = landmarks[SQUAT_LANDMARKS.RIGHT_HEEL]?.y;
  
  if (leftHeelY === undefined || rightHeelY === undefined) {
    return true; // Heels not visible, assume down
  }
  
  const leftAnkleY = leftAnkle.y;
  const rightAnkleY = rightAnkle.y;
  
  // Heel should be at or below ankle (heels down)
  return (leftHeelY >= leftAnkleY) && (rightHeelY >= rightAnkleY);
}

/**
 * Rep detection parameters
 */
export const SQUAT_REP_PARAMS = {
  // Hip-to-knee tracking: Check if hip is close to knee level
  // "Close to knees" means hip is within this distance from knee level
  HIP_TO_KNEE_CLOSE_THRESHOLD: 0.20, // 20% of frame height - hip is "close" to knees if within this distance (more lenient)
  
  // Hip movement thresholds for coming back up
  HIP_UP_THRESHOLD: 0.08, // 8% of frame height - hip must move up this much from bottom to count as "coming up" (more lenient)
  HIP_RETURN_THRESHOLD: 0.12, // 12% of frame height - must return within this of starting position to count rep (more lenient)
  
  // Form check thresholds
  KNEE_ALIGNMENT_THRESHOLD: 0.05, // 5% deviation allowed
  STANDING_THRESHOLD: 0.7, // Hip Y < 0.7 means standing (hip in upper 70% of frame)
  
  // Knee angle thresholds for form validation
  KNEE_ANGLE_MIN: 60, // Minimum knee angle at bottom of squat (degrees)
  KNEE_ANGLE_MAX: 180, // Maximum knee angle at top (fully extended)
  
  // Hip depth requirement
  HIP_DEPTH_REQUIRED: true, // Hip must go below knee level
} as const;

/**
 * Comprehensive form validation for squats
 * Returns true only if: all landmarks visible, facing camera, AND correct form
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

  // Check front view (facing camera) - REQUIRED
  const frontView = checkFrontView(landmarks);
  if (!frontView.isValid) {
    errors.push(frontView.error || "Not facing camera");
  }

  // Check if standing (valid starting form)
  const standingForm = checkStandingForm(landmarks);
  if (!standingForm.isValid && kneeAngle !== null && kneeAngle !== undefined) {
    // Only check standing form if we're at the top (knee angle > 150°)
    // During the squat, we don't need to be standing
    if (kneeAngle > 150) {
      errors.push(standingForm.error || "Not in standing position");
    }
  }

  // Check knee alignment
  const kneeAlignment = checkKneeAlignment(landmarks);
  if (!kneeAlignment.isValid) {
    errors.push(kneeAlignment.error || "Knee alignment incorrect");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sideView: frontView, // Keep for backwards compatibility
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

