import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useCVDetector } from "./hooks/useCVDetector";
import type { FormRules } from "./types/cv";
import "./App.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamRef = useRef<Webcam>(null);
  
  const [repCount, setRepCount] = useState(0);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [exercise] = useState("push-up");
  const [videoReady, setVideoReady] = useState(false);

  // Form rules for push-up (elbow angle should be between 90-180 degrees)
  const formRules: FormRules = {
    elbow_angle: { min: 90, max: 180 },
  };

  // Create a ref that points to the webcam's video element
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Update videoRef when webcam video is ready
  useEffect(() => {
    const checkVideo = () => {
      const webcamVideo = webcamRef.current?.video;
      if (webcamVideo) {
        videoRef.current = webcamVideo;
        // Check if video has dimensions or is ready
        if (webcamVideo.readyState >= 2 || webcamVideo.videoWidth > 0) {
          setVideoReady(true);
          return true;
        }
      }
      return false;
    };

    // Check immediately
    if (checkVideo()) {
      return;
    }

    // Check periodically until video is ready
    const interval = setInterval(() => {
      if (checkVideo()) {
        clearInterval(interval);
      }
    }, 100);

    // Also listen for loadedmetadata event
    const webcamVideo = webcamRef.current?.video;
    if (webcamVideo) {
      const handleLoadedMetadata = () => {
        videoRef.current = webcamVideo;
        setVideoReady(true);
        clearInterval(interval);
      };
      webcamVideo.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      webcamVideo.addEventListener('loadeddata', handleLoadedMetadata, { once: true });
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

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

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>CV Detection Test</h1>
      
      {error && (
        <div style={{ color: "red", padding: "10px", background: "#fee", borderRadius: "5px", marginBottom: "20px" }}>
          ❌ Error: {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "640px" }}>
          <h3>Webcam Feed with Pose Detection</h3>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={videoConstraints}
              style={{ 
                width: "100%", 
                maxWidth: "640px", 
                borderRadius: "10px",
                display: "block"
              }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                maxWidth: "640px",
                borderRadius: "10px",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
            {!videoReady && (
              <div style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                maxWidth: "640px",
                height: "480px", 
                background: "rgba(0,0,0,0.7)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                borderRadius: "10px",
                color: "white",
                zIndex: 5
              }}>
                Loading video...
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Controls</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={isDetecting ? stopDetection : startDetection}
            disabled={!isReady || !videoReady}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: isDetecting ? "#dc3545" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isReady && videoReady ? "pointer" : "not-allowed",
            }}
          >
            {isDetecting ? "⏹️ Stop Detection" : "▶️ Start Detection"}
          </button>
          
          <button
            onClick={resetReps}
            disabled={!detector}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: "5px",
              cursor: detector ? "pointer" : "not-allowed",
            }}
          >
            🔄 Reset Reps
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Status</h3>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <strong>CV Detector:</strong>{" "}
            <span style={{ color: isReady ? "green" : "orange" }}>
              {isReady ? "✅ Ready" : "⏳ Initializing..."}
            </span>
          </div>
          <div>
            <strong>Video:</strong>{" "}
            <span style={{ color: videoReady ? "green" : "orange" }}>
              {videoReady ? "✅ Ready" : "⏳ Loading..."}
            </span>
          </div>
          <div>
            <strong>Detection:</strong>{" "}
            <span style={{ color: isDetecting ? "green" : "gray" }}>
              {isDetecting ? "🟢 Active" : "⚪ Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Rep Count</h3>
        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#007bff" }}>
          {repCount}
        </div>
      </div>

      {formErrors.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Form Feedback</h3>
          <div style={{ 
            padding: "10px", 
            background: "#fff3cd", 
            borderRadius: "5px",
            border: "1px solid #ffc107"
          }}>
            {formErrors.map((error, idx) => (
              <div key={idx} style={{ color: "#856404", margin: "5px 0" }}>
                ⚠️ {error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px", padding: "15px", background: "#f8f9fa", borderRadius: "5px" }}>
        <h3>Instructions</h3>
        <ol style={{ lineHeight: "1.8" }}>
          <li>Allow camera access when prompted</li>
          <li>Wait for "CV Detector: ✅ Ready" and "Video: ✅ Ready"</li>
          <li>Click "▶️ Start Detection"</li>
          <li>Stand in front of the camera and do push-ups</li>
          <li>Watch the rep count increment when you complete a full rep</li>
          <li>Check form feedback if your form needs adjustment</li>
        </ol>
        <p style={{ marginTop: "10px", color: "#666" }}>
          <strong>Note:</strong> The pose detection overlay shows MediaPipe landmarks. 
          Make sure you're fully visible in the frame for best results.
        </p>
      </div>
    </div>
  );
}

export default App;
