/**
 * Exercise Parameter Tester
 * 
 * Test component for validating exercise parameters with real webcam input.
 * This allows you to test each exercise's rep detection and form validation.
 */

import { useRef, useState, useEffect } from "react";
import { CVDetector } from "../services/cv-detector";
import type { CVDetectionResult } from "../types/cv";
import {
  PUSHUP_FORM_RULES,
  calculateElbowAngle,
  checkBodyLine as checkPushupBodyLine,
  checkSideView,
  validatePushupForm,
} from "./pushup-params";
import {
  SQUAT_FORM_RULES,
  calculateKneeAngle,
  checkHipDepth,
  checkKneeAlignment,
  checkSideView as checkSquatSideView,
  validateSquatForm,
} from "./squat-params";
import {
  LUNGE_FORM_RULES,
  determineFrontLeg,
  calculateFrontKneeAngle,
  calculateBackKneeAngle,
  checkBackKneeHeight,
  checkFrontShinAlignment,
} from "./lunge-params";
import {
  PLANK_FORM_RULES,
  checkInitialSetup,
  checkBodyLine as checkPlankBodyLine,
  checkPlankBreakage,
} from "./plank-params";

type ExerciseType = "push-up" | "squat" | "lunge" | "plank";

export function ExerciseTester() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<CVDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("push-up");
  const [result, setResult] = useState<CVDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize detector
  useEffect(() => {
    const init = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        // Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        videoRef.current.srcObject = stream;

        // Initialize CV detector
        const cvDetector = new CVDetector();
        await cvDetector.initialize(videoRef.current, canvasRef.current);

        // Set form rules based on selected exercise
        setFormRules(cvDetector, selectedExercise);

        // Set up callbacks
        cvDetector.setRepCallback((count) => {
          console.log(`✅ Rep detected! Count: ${count}`);
        });

        cvDetector.setFormErrorCallback((errors) => {
          console.warn("⚠️ Form errors:", errors);
        });

        cvDetector.setDetectionUpdateCallback((detectionResult) => {
          setResult(detectionResult);
        });

        setDetector(cvDetector);
        setIsReady(true);
      } catch (err) {
        setError(`Failed to initialize: ${err}`);
        console.error(err);
      }
    };

    init();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (detector) {
        detector.stopDetection();
      }
    };
  }, []);

  // Update form rules when exercise changes
  useEffect(() => {
    if (detector && isReady) {
      setFormRules(detector, selectedExercise);
    }
  }, [selectedExercise, detector, isReady]);

  const setFormRules = (cvDetector: CVDetector, exercise: ExerciseType) => {
    switch (exercise) {
      case "push-up":
        cvDetector.setFormRules(PUSHUP_FORM_RULES, "push-up");
        break;
      case "squat":
        cvDetector.setFormRules(SQUAT_FORM_RULES, "squat");
        break;
      case "lunge":
        cvDetector.setFormRules(LUNGE_FORM_RULES, "lunge");
        break;
      case "plank":
        cvDetector.setFormRules(PLANK_FORM_RULES, "plank");
        break;
    }
  };

  const startDetection = () => {
    if (detector && isReady) {
      detector.resetRepCount();
      detector.resetHoldTimer();
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

  const resetCounts = () => {
    if (detector) {
      detector.resetRepCount();
      detector.resetHoldTimer();
      setResult(null);
    }
  };

  // Calculate exercise-specific metrics for display
  const getExerciseMetrics = () => {
    if (!result?.landmarks) return null;

    const landmarks = result.landmarks;

    switch (selectedExercise) {
      case "push-up": {
        const elbowAngle = calculateElbowAngle(landmarks);
        // Pass elbow angle to form validation for movement-aware leniency
        const formValidation = validatePushupForm(landmarks, elbowAngle);
        const sideView = checkSideView(landmarks);
        // Determine if going down for body line check
        const isGoingDown = elbowAngle !== null && 
                           elbowAngle < 160 && 
                           elbowAngle > 100;
        const bodyLine = checkPushupBodyLine(landmarks, isGoingDown);
        
        return {
          "Elbow Angle": elbowAngle !== null ? `${elbowAngle.toFixed(1)}°` : "N/A (landmarks not visible)",
          "Side View": sideView.isValid ? "✅" : "❌",
          "Upper Body Line": bodyLine.isValid ? "✅" : "❌",
          "Upper Body Deviation": bodyLine.deviation !== 999 ? `${bodyLine.deviation.toFixed(2)}°` : "N/A",
          "Hip-Knee-Ankle": formValidation.legAlignment?.isValid ? "✅" : "❌",
          "Leg Deviation": formValidation.legAlignment?.deviation !== undefined && formValidation.legAlignment.deviation !== 999 
            ? `${formValidation.legAlignment.deviation.toFixed(2)}°` 
            : "N/A",
          "Form Valid": formValidation.isValid ? "✅" : "❌",
          ...(formValidation.errors.length > 0 && { Errors: formValidation.errors.join("; ") }),
        };
      }
      case "squat": {
        const kneeAngle = calculateKneeAngle(landmarks);
        // Pass knee angle to form validation for movement-aware leniency
        const formValidation = validateSquatForm(landmarks, kneeAngle);
        const sideView = checkSquatSideView(landmarks);
        const hipDepth = checkHipDepth(landmarks);
        const kneeAlign = checkKneeAlignment(landmarks);
        
        return {
          "Knee Angle": kneeAngle !== null ? `${kneeAngle.toFixed(1)}°` : "N/A (landmarks not visible)",
          "Side View": sideView.isValid ? "✅" : "❌",
          "Hip Depth": hipDepth.isValid ? "✅ Below Knee" : "❌ Above Knee",
          "Knee Alignment": kneeAlign.isValid ? "✅" : "❌",
          "Form Valid": formValidation.isValid ? "✅" : "❌",
          ...(kneeAlign.error && { "Knee Error": kneeAlign.error }),
          ...(formValidation.errors.length > 0 && { Errors: formValidation.errors.join("; ") }),
        };
      }
      case "lunge": {
        const frontLeg = determineFrontLeg(landmarks);
        if (!frontLeg) return { "Status": "Cannot determine front leg" };
        const frontAngle = calculateFrontKneeAngle(landmarks, frontLeg);
        const backAngle = calculateBackKneeAngle(landmarks, frontLeg);
        const backKneeHeight = checkBackKneeHeight(landmarks, frontLeg);
        const shinAlign = checkFrontShinAlignment(landmarks, frontLeg);
        return {
          "Front Leg": frontLeg,
          "Front Knee Angle": `${frontAngle.toFixed(1)}°`,
          "Back Knee Angle": `${backAngle.toFixed(1)}°`,
          "Back Knee Height": backKneeHeight ? "✅" : "❌",
          "Shin Alignment": shinAlign.isValid ? "✅" : "❌",
          ...(shinAlign.error && { Error: shinAlign.error }),
        };
      }
      case "plank": {
        const setup = checkInitialSetup(landmarks);
        const bodyLine = checkPlankBodyLine(landmarks);
        const breakage = checkPlankBreakage(landmarks);
        return {
          "Initial Setup": setup.isValid ? "✅" : "❌",
          "Body Line": bodyLine.isValid ? "✅" : "❌",
          "Plank Status": breakage.isBroken ? "❌ Broken" : "✅ Holding",
          "Deviation": `${bodyLine.deviation.toFixed(2)}°`,
          ...(breakage.reason && { "Break Reason": breakage.reason }),
        };
      }
    }
  };

  const metrics = getExerciseMetrics();

  return (
    <div style={{ padding: "2rem", color: "white", backgroundColor: "#020617" }}>
      <h1 style={{ marginBottom: "2rem" }}>Exercise Parameter Tester</h1>

      {/* Exercise Selection */}
      <div style={{ marginBottom: "2rem" }}>
        <label style={{ marginRight: "1rem" }}>Select Exercise:</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value as ExerciseType)}
          disabled={isDetecting}
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            backgroundColor: "#1e293b",
            color: "white",
            border: "1px solid #475569",
            borderRadius: "4px",
          }}
        >
          <option value="push-up">Push-up</option>
          <option value="squat">Squat</option>
          <option value="lunge">Lunge</option>
          <option value="plank">Plank</option>
        </select>
      </div>

      {/* Video and Canvas */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "640px",
              height: "480px",
              backgroundColor: "#000",
              borderRadius: "8px",
            }}
          />
        </div>
        <div>
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              width: "640px",
              height: "480px",
              backgroundColor: "#000",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: "2rem" }}>
        {error && (
          <div style={{ color: "#ef4444", marginBottom: "1rem" }}>Error: {error}</div>
        )}

        {isReady ? (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={isDetecting ? stopDetection : startDetection}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                backgroundColor: isDetecting ? "#ef4444" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isDetecting ? "Stop Detection" : "Start Detection"}
            </button>
            <button
              onClick={resetCounts}
              disabled={!isDetecting}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: isDetecting ? 1 : 0.5,
              }}
            >
              Reset
            </button>
          </div>
        ) : (
          <div>Initializing camera and CV detector...</div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Rep/Hold Info */}
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "1.5rem",
              borderRadius: "8px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>
              {selectedExercise === "plank" ? "Hold Timer" : "Rep Count"}
            </h2>
            {selectedExercise === "plank" ? (
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                {result.holdState.duration.toFixed(1)}s
              </div>
            ) : (
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                {result.repState.repCount} reps
              </div>
            )}
            <div style={{ marginTop: "1rem", fontSize: "0.875rem", opacity: 0.7 }}>
              Form Valid: {result.formValid ? "✅" : "❌"}
            </div>
            {result.formErrors.length > 0 && (
              <div style={{ marginTop: "0.5rem", color: "#ef4444" }}>
                Errors: {result.formErrors.join(", ")}
              </div>
            )}
          </div>

          {/* Exercise-Specific Metrics */}
          {metrics && (
            <div
              style={{
                backgroundColor: "#1e293b",
                padding: "1.5rem",
                borderRadius: "8px",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Metrics</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Object.entries(metrics).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.5rem",
                      backgroundColor: "#0f172a",
                      borderRadius: "4px",
                    }}
                  >
                    <span style={{ fontWeight: "500" }}>{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

