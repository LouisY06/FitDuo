# Exercise Parameter Testing Guide

## Overview

Four exercise parameter files have been created in `frontend/cv/exercises/`:
1. `pushup-params.ts` - Standard Push-up
2. `squat-params.ts` - Bodyweight Squat  
3. `lunge-params.ts` - Alternating Lunge
4. `plank-params.ts` - Plank Hold

## Testing Each Exercise

### 1. Standard Push-up

**Test Cases:**
- ✅ **Valid Rep**: Elbow extends to ~180° at top, closes to ≤90° at bottom
- ✅ **Body Line Valid**: Shoulder-Hip-Ankle form straight line
- ❌ **Form Error - Sagging**: Hips drop below shoulder-ankle line
- ❌ **Form Error - Piking**: Hips rise above shoulder-ankle line

**How to Test:**
```typescript
import { calculateElbowAngle, checkBodyLine } from "./exercises/pushup-params";

// Get landmarks from MediaPipe
const elbowAngle = calculateElbowAngle(landmarks);
const bodyLine = checkBodyLine(landmarks);

console.log("Elbow angle:", elbowAngle);
console.log("Body line valid:", bodyLine.isValid);
if (!bodyLine.isValid) {
  console.log("Error:", bodyLine.error);
}
```

### 2. Bodyweight Squat

**Test Cases:**
- ✅ **Valid Rep**: Hip crease below knee, knee angle ≤90°
- ✅ **Knee Alignment**: Knees track with toes (no valgus collapse)
- ✅ **Heel Contact**: Heels remain on floor
- ❌ **Form Error**: Knees collapse inward
- ❌ **Form Error**: Heels lift off floor

**How to Test:**
```typescript
import { 
  calculateKneeAngle, 
  checkHipDepth,
  checkKneeAlignment,
  checkHeelContact 
} from "./exercises/squat-params";

const kneeAngle = calculateKneeAngle(landmarks);
const hipDepth = checkHipDepth(landmarks);
const kneeAlign = checkKneeAlignment(landmarks);
const heelContact = checkHeelContact(landmarks);

console.log("Knee angle:", kneeAngle);
console.log("Hip depth valid:", hipDepth);
console.log("Knee alignment:", kneeAlign.isValid);
console.log("Heel contact:", heelContact);
```

### 3. Alternating Lunge

**Test Cases:**
- ✅ **Valid Rep**: Both front and back knees reach 90°
- ✅ **Back Knee Height**: Back knee 1-2 inches from ground
- ✅ **Front Shin**: Remains vertical (knee not past toe)
- ✅ **Torso**: Upright and perpendicular
- ❌ **Form Error**: Front knee travels past toe
- ❌ **Form Error**: Torso leans too far forward

**How to Test:**
```typescript
import { 
  determineFrontLeg,
  calculateFrontKneeAngle,
  calculateBackKneeAngle,
  checkBackKneeHeight,
  checkFrontShinAlignment 
} from "./exercises/lunge-params";

const frontLeg = determineFrontLeg(landmarks);
if (frontLeg) {
  const frontAngle = calculateFrontKneeAngle(landmarks, frontLeg);
  const backAngle = calculateBackKneeAngle(landmarks, frontLeg);
  const backKneeHeight = checkBackKneeHeight(landmarks, frontLeg);
  const shinAlign = checkFrontShinAlignment(landmarks, frontLeg);
  
  console.log("Front leg:", frontLeg);
  console.log("Front knee angle:", frontAngle);
  console.log("Back knee angle:", backAngle);
  console.log("Back knee height valid:", backKneeHeight);
  console.log("Shin alignment:", shinAlign.isValid);
}
```

### 4. Plank Hold

**Test Cases:**
- ✅ **Initial Setup**: Shoulders over elbows
- ✅ **Body Line Valid**: Straight line (Shoulder-Hip-Ankle)
- ✅ **Timer Running**: Body line maintained
- ❌ **Timer Stops - Piking**: Hips rise above line
- ❌ **Timer Stops - Sagging**: Hips drop below line

**How to Test:**
```typescript
import { 
  checkInitialSetup,
  checkBodyLine,
  checkPlankBreakage 
} from "./exercises/plank-params";

const setup = checkInitialSetup(landmarks);
const bodyLine = checkBodyLine(landmarks);
const breakage = checkPlankBreakage(landmarks);

console.log("Initial setup valid:", setup.isValid);
console.log("Body line valid:", bodyLine.isValid);
console.log("Plank broken:", breakage.isBroken);
if (breakage.isBroken) {
  console.log("Reason:", breakage.reason);
}
```

## Integration Checklist

When your partner finishes the game screen, integrate these parameters:

- [ ] Import exercise parameters in game screen component
- [ ] Set form rules based on selected exercise
- [ ] Connect rep detection callbacks to game state
- [ ] Display form errors to user in real-time
- [ ] Handle static hold timer for plank
- [ ] Test each exercise with real webcam input
- [ ] Verify rep counting accuracy
- [ ] Verify form validation accuracy

## MediaPipe Landmark Reference

All exercises use MediaPipe Pose landmarks. Key indices:
- Shoulders: 11 (left), 12 (right)
- Elbows: 13 (left), 14 (right)
- Hips: 23 (left), 24 (right)
- Knees: 25 (left), 26 (right)
- Ankles: 27 (left), 28 (right)
- Toes: 31 (left), 32 (right)
- Heels: 29 (left), 30 (right)

## Notes

- All angle calculations return values in degrees (0-180)
- All position checks use normalized coordinates (0-1)
- Thresholds are tuned for typical webcam distances
- Form validation is real-time and provides user feedback
- Rep detection uses state machine (isDown/isUp tracking)

