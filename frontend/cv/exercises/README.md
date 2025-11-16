# Exercise Parameters

This directory contains MediaPipe parameter definitions for each exercise type.

## Files

- **`pushup-params.ts`** - Standard Push-up parameters
- **`squat-params.ts`** - Bodyweight Squat parameters
- **`lunge-params.ts`** - Alternating Lunge parameters
- **`plank-params.ts`** - Plank Hold (static) parameters

## Usage

Each file exports:
- **Landmark indices** - MediaPipe pose landmark constants
- **Calculation functions** - Angle and alignment calculations
- **Form validation functions** - Form check helpers
- **Rep detection parameters** - Thresholds and rules
- **Form rules** - Configuration objects for CV detector

### Example: Using Push-up Parameters

```typescript
import { 
  PUSHUP_LANDMARKS,
  calculateElbowAngle,
  checkBodyLine,
  PUSHUP_REP_PARAMS,
  PUSHUP_FORM_RULES 
} from "../cv/exercises/pushup-params";

// In your CV detector:
const elbowAngle = calculateElbowAngle(landmarks);
const bodyLine = checkBodyLine(landmarks);

// Set form rules
detector.setFormRules(PUSHUP_FORM_RULES, "push-up");
```

## Exercise Details

### 1. Standard Push-up (Max Reps)

**Rep Detection:**
- Start/End: Arms near full extension (~180° elbow angle)
- Depth: Elbow closes to 90° or less at bottom

**Form Check:**
- Body line: Shoulder-Hip-Ankle must form straight line
- No sagging (hips dropping) or piking (hips rising)

### 2. Bodyweight Squat (Max Reps)

**Rep Detection:**
- Depth: Hip crease below knee joint
- Knee angle: Closes to 90° or less (thigh parallel to floor)

**Form Check:**
- Knee alignment: Knees track with toes (no valgus collapse)
- Torso posture: Neutral spine maintained
- Heel contact: Heels remain on floor

### 3. Lunge (Max Reps - Alternating)

**Rep Detection:**
- Depth: Both front and back knees reach 90° angle
- Back knee: 1-2 inches from ground

**Form Check:**
- Front shin: Remains mostly vertical (knee not past toe)
- Torso: Upright and perpendicular to floor

### 4. Plank Hold (Max Time)

**Time Validation:**
- Body line: Maintain straight line (Shoulder-Hip-Ankle)
- Initial setup: Shoulders over elbows

**Breakage (Timer Stops):**
- Hips rise significantly (piking)
- Hips sag significantly (arching/sagging)

## Integration with CV Detector

When your partner finishes the game screen, integrate these parameters:

```typescript
import { CVDetector } from "../services/cv-detector";
import { 
  PUSHUP_FORM_RULES,
  SQUAT_FORM_RULES,
  LUNGE_FORM_RULES,
  PLANK_FORM_RULES 
} from "./exercises";

const detector = new CVDetector();
await detector.initialize(videoElement, canvasElement);

// Set exercise-specific rules
switch (exerciseType) {
  case "push-up":
    detector.setFormRules(PUSHUP_FORM_RULES, "push-up");
    break;
  case "squat":
    detector.setFormRules(SQUAT_FORM_RULES, "squat");
    break;
  case "lunge":
    detector.setFormRules(LUNGE_FORM_RULES, "lunge");
    break;
  case "plank":
    detector.setFormRules(PLANK_FORM_RULES, "plank");
    break;
}

detector.startDetection();
```

## Testing

All parameters are self-contained and can be tested independently. The calculation functions accept `PoseLandmark[]` arrays and return validation results.

