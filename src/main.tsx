import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { DeploymentProvider } from "@snipextt/wacht";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeploymentProvider publicKey="aHR0cDovL2xvY2FsaG9zdDozMDAw">
      <App />
    </DeploymentProvider>
  </StrictMode>,
);
