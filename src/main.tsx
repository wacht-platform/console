import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DeploymentProvider } from "@wacht/react-router";
import "./index.css";
import App from "./App.tsx";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";

if (!import.meta.env.VITE_WACHT_PUBLISHABLE_KEY) {
  console.error("Wacht publishable key is not defined");
}

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
        <App />
      </DeploymentProvider>
    </PostHogProvider>
  </StrictMode>,
);
