import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DeploymentProvider } from "@wacht/react-router";
import "./index.css";
import App from "./App.tsx";

if (!import.meta.env.VITE_WACHT_PUBLISHABLE_KEY) {
  console.error("Wacht publishable key is not defined");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
      <App />
    </DeploymentProvider>
  </StrictMode>,
);
