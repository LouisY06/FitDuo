# CV Detector Service - Integration Guide

This CV detection service is **UI-agnostic** - it only handles the computer vision logic. Your frontend developer can integrate it into their own UI design.

## Files

- `src/services/cv-detector.ts` - Main CV detector class
- `src/hooks/useCVDetector.ts` - React hook wrapper (optional, for convenience)
- `src/types/cv.ts` - TypeScript types
- `src/services/cv-detector.example.tsx` - Example usage (reference only)

## Quick Start

### Option 1: Using the Hook (Easiest)

```tsx
import { useRef, useState } from "react";
import { useCVDetector } from "../hooks/useCVDetector";

function YourComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [repCount, setRepCount] = useState(0);

  const { detector, isReady } = useCVDetector({
    videoRef,
    canvasRef,
    formRules: { elbow_angle: { min: 90, max: 180 } },
    exerciseName: "push-up",
    onRepDetected: (count) => setRepCount(count),
  });

  return (
    <div>
      {/* Your UI here */}
      <video ref={videoRef} />
      <canvas ref={canvasRef} />
      <button onClick={() => detector?.startDetection()}>Start</button>
      <div>Reps: {repCount}</div>
    </div>
  );
}
```

### Option 2: Direct Class Usage (More Control)

```tsx
import { useRef, useEffect } from "react";
import { CVDetector } from "../services/cv-detector";

function YourComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<CVDetector | null>(null);

  useEffect(() => {
    const init = async () => {
      if (videoRef.current) {
        const detector = new CVDetector();
        await detector.initialize(videoRef.current, canvasRef.current || undefined);
        detector.setRepCallback((count) => console.log("Rep:", count));
        detectorRef.current = detector;
      }
    };
    init();
  }, []);

  return (
    <div>
      {/* Your UI here */}
      <video ref={videoRef} />
      <canvas ref={canvasRef} />
    </div>
  );
}
```

## API Reference

### CVDetector Class

#### Methods

- `initialize(video, canvas?)` - Initialize with video and optional canvas
- `setFormRules(rules, exerciseName?)` - Set form validation rules
- `setRepCallback(callback)` - Callback when rep is detected
- `setFormErrorCallback(callback)` - Callback for form errors
- `setDetectionUpdateCallback(callback)` - Callback for every frame update
- `startDetection()` - Start detection loop
- `stopDetection()` - Stop detection loop
- `resetRepCount()` - Reset rep counter
- `resetHoldTimer()` - Reset static hold timer
- `getRepCount()` - Get current rep count
- `getHoldDuration()` - Get current hold duration (for static holds)
- `isActive()` - Check if currently detecting

### Form Rules Format

```typescript
const formRules = {
  elbow_angle: { min: 90, max: 180 },
  shoulder_alignment: { threshold: 0.1 },
  back_straight: { min: 0.95 },
};
```

### Callbacks

```typescript
// Rep detected
detector.setRepCallback((count: number) => {
  console.log(`Rep ${count} detected!`);
});

// Form errors
detector.setFormErrorCallback((errors: string[]) => {
  console.log("Form errors:", errors);
});

// Detection update (every frame)
detector.setDetectionUpdateCallback((result: CVDetectionResult) => {
  console.log("Current state:", result);
});
```

## Integration Points

1. **Video Element**: Your developer provides a `<video>` element (from webcam)
2. **Canvas Element** (optional): For drawing pose landmarks
3. **Form Rules**: Received from backend via WebSocket (`FORM_RULES` message)
4. **Rep Count**: Send to backend via WebSocket (`REP_INCREMENT` message)

## What This Service Does

✅ Detects reps using MediaPipe Pose
✅ Validates form based on rules
✅ Detects static holds (plank, wall sit)
✅ Provides callbacks for UI updates
✅ Draws pose landmarks on canvas (if provided)

## What This Service Does NOT Do

❌ Create UI components
❌ Handle styling
❌ Manage WebSocket connections
❌ Handle authentication
❌ Create layouts

Your frontend developer has full control over the UI design!

