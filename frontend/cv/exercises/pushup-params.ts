/**
 * Standard Push-up Exercise Parameters
 * 
 * Rep Detection: Based on elbow angle (90° at bottom, ~180° at top)
 * Form Check: Body line (shoulder-hip-ankle alignment)
 */

import type { PoseLandmark } from "../types/cv";

// MediaPipe Pose Landmark Indices
export const PUSHUP_LANDMARKS = {
  // Left side
  LEFT_SHOULDER: 11,
  LEFT_ELBOW: 13,
  LEFT_WRIST: 15,
  LEFT_HIP: 23,
  LEFT_KNEE: 25,
  LEFT_ANKLE: 27,
  
  // Right side
  RIGHT_SHOULDER: 12,
  RIGHT_ELBOW: 14,
  RIGHT_WRIST: 16,
  RIGHT_HIP: 24,
  RIGHT_KNEE: 26,
  RIGHT_ANKLE: 28,
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
    PUSHUP_LANDMARKS.LEFT_SHOULDER,
    PUSHUP_LANDMARKS.RIGHT_SHOULDER,
    PUSHUP_LANDMARKS.LEFT_ELBOW,
    PUSHUP_LANDMARKS.RIGHT_ELBOW,
    PUSHUP_LANDMARKS.LEFT_HIP,
    PUSHUP_LANDMARKS.RIGHT_HIP,
    PUSHUP_LANDMARKS.LEFT_KNEE,
    PUSHUP_LANDMARKS.RIGHT_KNEE,
    PUSHUP_LANDMARKS.LEFT_ANKLE,
    PUSHUP_LANDMARKS.RIGHT_ANKLE,
  ];
  
  const landmarkNames: { [key: number]: string } = {
    [PUSHUP_LANDMARKS.LEFT_SHOULDER]: "Left Shoulder",
    [PUSHUP_LANDMARKS.RIGHT_SHOULDER]: "Right Shoulder",
    [PUSHUP_LANDMARKS.LEFT_ELBOW]: "Left Elbow",
    [PUSHUP_LANDMARKS.RIGHT_ELBOW]: "Right Elbow",
    [PUSHUP_LANDMARKS.LEFT_HIP]: "Left Hip",
    [PUSHUP_LANDMARKS.RIGHT_HIP]: "Right Hip",
    [PUSHUP_LANDMARKS.LEFT_KNEE]: "Left Knee",
    [PUSHUP_LANDMARKS.RIGHT_KNEE]: "Right Knee",
    [PUSHUP_LANDMARKS.LEFT_ANKLE]: "Left Ankle",
    [PUSHUP_LANDMARKS.RIGHT_ANKLE]: "Right Ankle",
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
 * Calculate elbow angle for push-up rep detection
 * @param landmarks - Array of pose landmarks
 * @returns Average elbow angle (0-180 degrees) or null if landmarks not visible
 */
export function calculateElbowAngle(landmarks: PoseLandmark[]): number | null {
  // Check if required landmarks are visible
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return null;
  }
  
  try {
    const leftAngle = calculateAngle(
      landmarks[PUSHUP_LANDMARKS.LEFT_SHOULDER],
      landmarks[PUSHUP_LANDMARKS.LEFT_ELBOW],
      landmarks[PUSHUP_LANDMARKS.LEFT_WRIST]
    );
    
    const rightAngle = calculateAngle(
      landmarks[PUSHUP_LANDMARKS.RIGHT_SHOULDER],
      landmarks[PUSHUP_LANDMARKS.RIGHT_ELBOW],
      landmarks[PUSHUP_LANDMARKS.RIGHT_WRIST]
    );
    
    return (leftAngle + rightAngle) / 2;
  } catch (error) {
    return null;
  }
}

/**
 * Check if person is in side view (parallel to camera) for push-ups
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
    x: (landmarks[PUSHUP_LANDMARKS.LEFT_SHOULDER].x + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_SHOULDER].x) / 2,
    y: (landmarks[PUSHUP_LANDMARKS.LEFT_SHOULDER].y + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_SHOULDER].y) / 2,
  };
  const ankleMid = {
    x: (landmarks[PUSHUP_LANDMARKS.LEFT_ANKLE].x + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_ANKLE].x) / 2,
    y: (landmarks[PUSHUP_LANDMARKS.LEFT_ANKLE].y + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_ANKLE].y) / 2,
  };

  // For side view push-ups:
  // 1. Body should be oriented horizontally (shoulder-ankle line should be mostly horizontal)
  // 2. Shoulders should be at similar Y (both visible from side)
  // 3. Hips should be at similar Y
  // 4. The X difference between shoulder and ankle should be significant (body extends horizontally)

  // Check if shoulders are at similar Y (within 5% of frame height)
  const shoulderYDiff = Math.abs(
    landmarks[PUSHUP_LANDMARKS.LEFT_SHOULDER].y - 
    landmarks[PUSHUP_LANDMARKS.RIGHT_SHOULDER].y
  );
  const shoulderYThreshold = 0.05; // 5% of frame height

  // Check if hips are at similar Y
  const hipYDiff = Math.abs(
    landmarks[PUSHUP_LANDMARKS.LEFT_HIP].y - 
    landmarks[PUSHUP_LANDMARKS.RIGHT_HIP].y
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
 * Check body line alignment (shoulder-hip-ankle)
 * @param landmarks - Array of pose landmarks
 * @param isGoingDown - Optional flag to make validation more lenient during downward motion
 * @returns Object with alignment status and deviation angle
 */
export function checkBodyLine(
  landmarks: PoseLandmark[],
  isGoingDown: boolean = false
): {
  isValid: boolean;
  deviation: number; // degrees from straight line
  error?: string;
} {
  // First check if all landmarks are visible
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return {
      isValid: false,
      deviation: 999, // Large deviation to indicate invalid
      error: `Missing landmarks: ${visibility.missingLandmarks?.join(", ")}`,
    };
  }

  // Check side view first
  const sideView = checkSideView(landmarks);
  if (!sideView.isValid) {
    return {
      isValid: false,
      deviation: 999,
      error: sideView.error,
    };
  }
  // Calculate midpoints for symmetry
  const shoulderMid = {
    x: (landmarks[PUSHUP_LANDMARKS.LEFT_SHOULDER].x + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_SHOULDER].x) / 2,
    y: (landmarks[PUSHUP_LANDMARKS.LEFT_SHOULDER].y + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_SHOULDER].y) / 2,
  };
  const hipMid = {
    x: (landmarks[PUSHUP_LANDMARKS.LEFT_HIP].x + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_HIP].x) / 2,
    y: (landmarks[PUSHUP_LANDMARKS.LEFT_HIP].y + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_HIP].y) / 2,
  };
  const ankleMid = {
    x: (landmarks[PUSHUP_LANDMARKS.LEFT_ANKLE].x + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_ANKLE].x) / 2,
    y: (landmarks[PUSHUP_LANDMARKS.LEFT_ANKLE].y + 
        landmarks[PUSHUP_LANDMARKS.RIGHT_ANKLE].y) / 2,
  };
  
  // Calculate distance from hip to the line segment shoulder-ankle
  // Using perpendicular distance formula
  const distanceToLine = calculatePerpendicularDistance(
    hipMid,
    shoulderMid,
    ankleMid
  );
  
  // Calculate body length (shoulder to ankle distance)
  const bodyLength = Math.sqrt(
    Math.pow(ankleMid.x - shoulderMid.x, 2) + 
    Math.pow(ankleMid.y - shoulderMid.y, 2)
  );
  
  // Convert to relative deviation (percentage of body length)
  const relativeDeviation = bodyLength > 0.01 
    ? distanceToLine / bodyLength 
    : distanceToLine;
  
  // Threshold: hips should be within 30% of body length from straight line
  // More lenient during downward motion (40%) to allow natural movement
  // More lenient to account for natural body curvature and camera perspective
  const threshold = isGoingDown ? 0.40 : 0.30; // 40% when going down, 30% otherwise
  const isValid = relativeDeviation < threshold;
  
  // Convert to angle deviation for display (approximate)
  const deviation = Math.atan(relativeDeviation) * (180 / Math.PI);
  
  if (!isValid) {
    // Determine if hips are sagging or piking
    // Project hip onto shoulder-ankle line and check if hip is above or below
    const t = ((hipMid.x - shoulderMid.x) * (ankleMid.x - shoulderMid.x) + 
               (hipMid.y - shoulderMid.y) * (ankleMid.y - shoulderMid.y)) / 
              (Math.pow(ankleMid.x - shoulderMid.x, 2) + 
               Math.pow(ankleMid.y - shoulderMid.y, 2));
    
    const projectedY = shoulderMid.y + t * (ankleMid.y - shoulderMid.y);
    const error = hipMid.y > projectedY 
      ? "Hips sagging - keep body straight"
      : "Hips piking - keep body straight";
    return { isValid: false, deviation, error };
  }
  
  return { isValid: true, deviation };
}

/**
 * Check hip-knee-ankle alignment (lower body line)
 * For push-ups, the hip, knee, and ankle should form a straight line
 * @param landmarks - Array of pose landmarks
 * @param isGoingDown - Optional flag to make validation more lenient during downward motion
 * @returns Object with alignment status and deviation
 */
export function checkHipKneeAnkleAlignment(
  landmarks: PoseLandmark[],
  isGoingDown: boolean = false
): {
  isValid: boolean;
  deviation: number; // degrees from straight line
  error?: string;
} {
  // First check if all landmarks are visible
  const visibility = areAllLandmarksVisible(landmarks);
  if (!visibility.isValid) {
    return {
      isValid: false,
      deviation: 999,
      error: `Missing landmarks: ${visibility.missingLandmarks?.join(", ")}`,
    };
  }

  // Check both legs and use the average deviation
  const leftAlignment = checkLegAlignment(
    landmarks[PUSHUP_LANDMARKS.LEFT_HIP],
    landmarks[PUSHUP_LANDMARKS.LEFT_KNEE],
    landmarks[PUSHUP_LANDMARKS.LEFT_ANKLE],
    "left",
    isGoingDown
  );
  
  const rightAlignment = checkLegAlignment(
    landmarks[PUSHUP_LANDMARKS.RIGHT_HIP],
    landmarks[PUSHUP_LANDMARKS.RIGHT_KNEE],
    landmarks[PUSHUP_LANDMARKS.RIGHT_ANKLE],
    "right",
    isGoingDown
  );

  // Both legs must be aligned
  const isValid = leftAlignment.isValid && rightAlignment.isValid;
  const avgDeviation = (leftAlignment.deviation + rightAlignment.deviation) / 2;
  
  if (!isValid) {
    const errors: string[] = [];
    if (!leftAlignment.isValid) errors.push(`Left leg: ${leftAlignment.error}`);
    if (!rightAlignment.isValid) errors.push(`Right leg: ${rightAlignment.error}`);
    return {
      isValid: false,
      deviation: avgDeviation,
      error: errors.join("; "),
    };
  }

  return { isValid: true, deviation: avgDeviation };
}

/**
 * Check if three points (hip, knee, ankle) form a straight line
 * @param isGoingDown - Optional flag to make validation more lenient during downward motion
 */
function checkLegAlignment(
  hip: PoseLandmark,
  knee: PoseLandmark,
  ankle: PoseLandmark,
  side: "left" | "right",
  isGoingDown: boolean = false
): {
  isValid: boolean;
  deviation: number;
  error?: string;
} {
  // Calculate perpendicular distance from knee to hip-ankle line
  const distanceToLine = calculatePerpendicularDistance(
    { x: knee.x, y: knee.y },
    { x: hip.x, y: hip.y },
    { x: ankle.x, y: ankle.y }
  );

  // Calculate leg length (hip to ankle distance)
  const legLength = Math.sqrt(
    Math.pow(ankle.x - hip.x, 2) + 
    Math.pow(ankle.y - hip.y, 2)
  );

  // Convert to relative deviation (percentage of leg length)
  const relativeDeviation = legLength > 0.01 
    ? distanceToLine / legLength 
    : distanceToLine;

  // Threshold: knee must be within 8% of leg length from straight line (slightly more lenient)
  // More lenient during downward motion (12%) to allow natural movement
  // This ensures the hip-knee-ankle line is "completely straight" at rest
  const threshold = isGoingDown ? 0.12 : 0.08; // 12% when going down, 8% otherwise (increased for more leniency)
  const isValid = relativeDeviation < threshold;

  // Convert to angle deviation for display
  const deviation = Math.atan(relativeDeviation) * (180 / Math.PI);

  if (!isValid) {
    // Determine if knee is bent forward or backward
    const t = ((knee.x - hip.x) * (ankle.x - hip.x) + 
               (knee.y - hip.y) * (ankle.y - hip.y)) / 
              (Math.pow(ankle.x - hip.x, 2) + 
               Math.pow(ankle.y - hip.y, 2));
    
    const projectedY = hip.y + t * (ankle.y - hip.y);
    const error = knee.y > projectedY 
      ? `${side} knee bent - keep leg straight`
      : `${side} knee hyperextended - keep leg straight`;
    return { isValid: false, deviation, error };
  }

  return { isValid: true, deviation };
}

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function calculatePerpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Comprehensive form validation for push-ups
 * Returns true only if: all landmarks visible, side view, AND correct body line
 * @param landmarks - Array of pose landmarks
 * @param elbowAngle - Optional current elbow angle to adjust leniency during movement
 */
export function validatePushupForm(
  landmarks: PoseLandmark[],
  elbowAngle?: number | null
): {
  isValid: boolean;
  errors: string[];
  bodyLine?: { isValid: boolean; deviation: number; error?: string };
  sideView?: { isValid: boolean; error?: string };
  legAlignment?: { isValid: boolean; deviation: number; error?: string };
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

  // Determine if person is going down (between top and bottom)
  // More lenient during downward motion to allow natural movement
  const isGoingDown = elbowAngle !== null && elbowAngle !== undefined && 
                      elbowAngle < PUSHUP_REP_PARAMS.TOP_ANGLE_MIN && 
                      elbowAngle > PUSHUP_REP_PARAMS.BOTTOM_ANGLE_MAX;
  
  // Check upper body line (shoulder-hip-ankle)
  // More lenient during downward motion
  const bodyLine = checkBodyLine(landmarks, isGoingDown);
  if (!bodyLine.isValid) {
    errors.push(bodyLine.error || "Upper body line not straight");
  }

  // Check lower body line (hip-knee-ankle) - must be completely straight
  // Slightly more lenient during downward motion
  const legAlignment = checkHipKneeAnkleAlignment(landmarks, isGoingDown);
  if (!legAlignment.isValid) {
    errors.push(legAlignment.error || "Hip-knee-ankle not straight");
  }

  return {
    isValid: errors.length === 0,
    errors,
    bodyLine,
    sideView,
    legAlignment,
  };
}

/**
 * Rep detection parameters
 */
export const PUSHUP_REP_PARAMS = {
  // Start/End: Near full extension (~180°)
  // More lenient - allows slight bend at top (160°+ is acceptable)
  TOP_ANGLE_MIN: 160, // degrees (near full extension, more lenient)
  TOP_ANGLE_MAX: 180,
  
  // Depth: Elbow closes to 90° or less
  // More lenient - allows up to 100° for partial reps
  BOTTOM_ANGLE_MAX: 100, // degrees (slightly more lenient than 90°)
  BOTTOM_ANGLE_MIN: 0,
  
  // Form check threshold
  BODY_LINE_THRESHOLD: 0.30, // 30% of body length deviation allowed (more lenient for natural curvature)
} as const;

/**
 * Form validation rules
 */
export const PUSHUP_FORM_RULES = {
  elbow_angle: {
    min: PUSHUP_REP_PARAMS.BOTTOM_ANGLE_MIN,
    max: PUSHUP_REP_PARAMS.TOP_ANGLE_MAX,
  },
  body_line_deviation: {
    max: PUSHUP_REP_PARAMS.BODY_LINE_THRESHOLD,
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

