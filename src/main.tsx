import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { FrontendDeploymentProvider } from "@snipextt/wacht";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FrontendDeploymentProvider publicKey="aHR0cHM6Ly9icmlsbGlhbnQtYWN0aXZpdHktMS5iYWNrZW5kLWFwaS5zZXJ2aWNlcw==">
      <App />
    </FrontendDeploymentProvider>
  </StrictMode>
);
