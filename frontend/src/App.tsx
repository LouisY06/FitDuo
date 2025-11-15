import "./index.css";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VantaBackground } from "./components/VantaBackground";

// Lazy load LoginPage to prevent Firebase from blocking render
const LoginPage = lazy(() => 
  import("./components/LoginPage").then(module => ({ default: module.LoginPage }))
);

function App() {
  return (
    <ErrorBoundary>
      <VantaBackground>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                color: "white",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <h1>Loading...</h1>
              </div>
            </div>
          }
        >
          <LoginPage />
        </Suspense>
      </VantaBackground>
    </ErrorBoundary>
  );
}

export default App;
