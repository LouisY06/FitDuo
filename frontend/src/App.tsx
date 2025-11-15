import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VantaBackground } from "./components/VantaBackground";
import { CyanLoadingDots } from "./components/CyanLoadingDots";

// Lazy load components
const LoginPage = lazy(() => 
  import("./components/LoginPage").then(module => ({ default: module.LoginPage }))
);
const WorkoutDiscovery = lazy(() => 
  import("./components/WorkoutDiscovery").then(module => ({ default: module.WorkoutDiscovery }))
);
const AppShell = lazy(() => 
  import("./components/AppShell").then(module => ({ default: module.AppShell }))
);

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("auth_token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      color: "white",
      padding: "4rem 2rem",
      boxSizing: "border-box",
    }}
  >
    <CyanLoadingDots size="large" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <VantaBackground>
                <Suspense fallback={<LoadingFallback />}>
                  <LoginPage />
                </Suspense>
              </VantaBackground>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <VantaBackground>
                  <Suspense fallback={<LoadingFallback />}>
                    <WorkoutDiscovery />
                  </Suspense>
                </VantaBackground>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <VantaBackground>
                  <Suspense fallback={<LoadingFallback />}>
                    <AppShell />
                  </Suspense>
                </VantaBackground>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
