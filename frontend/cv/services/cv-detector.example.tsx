/**
 * Example Usage of CV Detector
 * 
 * This is an example showing how your frontend developer can integrate
 * the CV detector into their own UI components. They can use this as a reference.
 * 
 * This file is NOT meant to be used directly - it's just documentation.
 */

import { useRef, useState } from "react";
import { useCVDetector } from "../hooks/useCVDetector";
import type { FormRules } from "../types/cv";

// Example: How to use CV detector in a custom component
export function ExampleCVIntegration() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Form rules from backend (received via WebSocket)
  const formRules: FormRules = {
    elbow_angle: { min: 90, max: 180 },
    shoulder_alignment: { threshold: 0.1 },
  };

  // Initialize CV detector
  const { detector, isReady, error } = useCVDetector({
    videoRef,
    canvasRef,
    formRules,
    exerciseName: "push-up",
    onRepDetected: (count) => {
      setRepCount(count);
      // Send to backend via WebSocket
      // wsClient.sendRepIncrement(playerId, count);
    },
    onFormError: (errors) => {
      setFormErrors(errors);
    },
  });

  const startDetection = () => {
    if (detector && isReady) {
      detector.startDetection();
      setIsDetecting(true);
    }
  };

  const stopDetection = () => {
    if (detector) {
      detector.stopDetection();
      setIsDetecting(false);
    }
  };

  const resetReps = () => {
    if (detector) {
      detector.resetRepCount();
      setRepCount(0);
    }
  };

  return (
    <div>
      {/* Your frontend developer can style this however they want */}
      <video ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} />
      
      {error && <div>Error: {error}</div>}
      
      {isReady && (
        <>
          <button onClick={isDetecting ? stopDetection : startDetection}>
            {isDetecting ? "Stop" : "Start"} Detection
          </button>
          <button onClick={resetReps}>Reset Reps</button>
        </>
      )}
      
      <div>Reps: {repCount}</div>
      {formErrors.length > 0 && (
        <div>
          Form Errors: {formErrors.join(", ")}
        </div>
      )}
    </div>
  );
}

