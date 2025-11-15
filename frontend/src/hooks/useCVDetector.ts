/**
 * React Hook for CV Detector
 * 
 * A simple hook wrapper that makes it easy to use the CV detector in React components.
 * Your frontend developer can use this hook in their own UI components.
 * 
 * Usage:
 *   const { detector, isReady, error } = useCVDetector(videoRef, canvasRef);
 *   detector?.setRepCallback((count) => setRepCount(count));
 *   detector?.startDetection();
 */

import { useEffect, useRef, useState } from "react";
import { CVDetector } from "../services/cv-detector";
import type { FormRules } from "../types/cv";

interface UseCVDetectorOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  formRules?: FormRules;
  exerciseName?: string;
  onRepDetected?: (count: number) => void;
  onFormError?: (errors: string[]) => void;
}

export const useCVDetector = ({
  videoRef,
  canvasRef,
  formRules,
  exerciseName,
  onRepDetected,
  onFormError,
}: UseCVDetectorOptions) => {
  const detectorRef = useRef<CVDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    const initDetector = async () => {
      try {
        const detector = new CVDetector();
        await detector.initialize(
          videoRef.current!,
          canvasRef?.current || undefined
        );

        if (formRules) {
          detector.setFormRules(formRules, exerciseName);
        }

        if (onRepDetected) {
          detector.setRepCallback(onRepDetected);
        }

        if (onFormError) {
          detector.setFormErrorCallback(onFormError);
        }

        detectorRef.current = detector;
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize CV detector");
        setIsReady(false);
      }
    };

    initDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stopDetection();
        detectorRef.current = null;
      }
    };
  }, [videoRef, canvasRef]);

  // Update form rules when they change
  useEffect(() => {
    if (detectorRef.current && formRules) {
      detectorRef.current.setFormRules(formRules, exerciseName);
    }
  }, [formRules, exerciseName]);

  // Update callbacks when they change
  useEffect(() => {
    if (detectorRef.current && onRepDetected) {
      detectorRef.current.setRepCallback(onRepDetected);
    }
  }, [onRepDetected]);

  useEffect(() => {
    if (detectorRef.current && onFormError) {
      detectorRef.current.setFormErrorCallback(onFormError);
    }
  }, [onFormError]);

  return {
    detector: detectorRef.current,
    isReady,
    error,
  };
};

