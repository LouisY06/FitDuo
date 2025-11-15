/**
 * CV Detection Setup
 * 
 * This file contains the CV detection state and logic that can be used
 * in workout screens. It's kept separate from the main App component
 * so the landing page stays clean.
 */

import { useState, useRef } from "react";
import { useCVDetector } from "../hooks/useCVDetector";
import type { FormRules } from "../types/cv";

export type ExerciseType = "push-up" | "squat" | "plank" | "sit-up";

export function useCVSetup() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const [repCount, setRepCount] = useState(0);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [exercise, setExercise] = useState<ExerciseType>("push-up");

  // Form rules based on exercise type
  const getFormRules = (): FormRules => {
    switch (exercise) {
      case "push-up":
        return { elbow_angle: { min: 90, max: 180 } };
      case "squat":
        return { knee_angle: { min: 90, max: 180 } };
      case "sit-up":
        return { torso_angle: { min: 0.05, max: 0.15 } };
      case "plank":
        return { shoulder_alignment: { threshold: 0.1 } };
      default:
        return { elbow_angle: { min: 90, max: 180 } };
    }
  };

  const formRules = getFormRules();

  // Initialize CV detector
  const { detector, isReady, error } = useCVDetector({
    videoRef,
    canvasRef,
    formRules,
    exerciseName: exercise,
    onRepDetected: (count) => {
      setRepCount(count);
      console.log(`✅ Rep ${count} detected!`);
    },
    onFormError: (errors) => {
      setFormErrors(errors);
      if (errors.length > 0) {
        console.log("⚠️ Form errors:", errors);
      }
    },
  });

  const startDetection = () => {
    if (detector && isReady) {
      detector.startDetection();
      setIsDetecting(true);
      console.log("🎥 CV detection started");
    }
  };

  const stopDetection = () => {
    if (detector) {
      detector.stopDetection();
      setIsDetecting(false);
      console.log("⏹️ CV detection stopped");
    }
  };

  const resetReps = () => {
    if (detector) {
      detector.resetRepCount();
      setRepCount(0);
      setFormErrors([]);
      console.log("🔄 Rep count reset");
    }
  };

  const changeExercise = (newExercise: ExerciseType) => {
    setExercise(newExercise);
    resetReps();
    if (detector) {
      detector.setFormRules(getFormRules(), newExercise);
    }
  };

  return {
    // Refs
    canvasRef,
    videoRef,
    
    // State
    repCount,
    formErrors,
    isDetecting,
    exercise,
    
    // Detector
    detector,
    isReady,
    error,
    
    // Actions
    startDetection,
    stopDetection,
    resetReps,
    changeExercise,
    setExercise,
  };
}

