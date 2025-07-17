import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DeploymentProvider } from "@snipextt/wacht";
import { createReactRouterAdapter } from "@snipextt/wacht-react-router";
import "./index.css";
import App from "./App.tsx";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeploymentProvider
      publicKey="pk_test_aHR0cHM6Ly9kaW13aXR0ZWQtYXhpcy0xLmZyb250ZW5kLWFwaS5zZXJ2aWNlcw=="
      adapter={createReactRouterAdapter()}
    >
      <App />
    </DeploymentProvider>
  </StrictMode>,
);
