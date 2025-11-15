import "./index.css";
import { VantaBackground } from "./components/VantaBackground";
import { LoginPage } from "./components/LoginPage";

function App() {
  return (
    <VantaBackground>
      <LoginPage />
    </VantaBackground>
  );
}

export default App;
