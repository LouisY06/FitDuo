/**
 * CV Detection Types
 * These types define the interface for the CV detection service.
 * Your frontend developer can use these to integrate CV into their UI.
 */

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FormRules {
  [key: string]: {
    min?: number;
    max?: number;
    threshold?: number;
  };
}

export type ExerciseType = "push-up" | "squat" | "plank" | "wall-sit" | "pull-up" | "sit-up";

export interface RepDetectionState {
  repCount: number;
  isDown: boolean;
  lastAngle: number;
}

export interface StaticHoldState {
  isStable: boolean;
  duration: number; // in seconds
  startTime: number | null;
}

export interface CVDetectionResult {
  landmarks: PoseLandmark[];
  repState: RepDetectionState;
  holdState: StaticHoldState;
  formValid: boolean;
  formErrors: string[];
}

export type RepDetectedCallback = (repCount: number) => void;
export type FormErrorCallback = (errors: string[]) => void;
export type DetectionUpdateCallback = (result: CVDetectionResult) => void;

