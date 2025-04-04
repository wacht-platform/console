import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { FrontendDeploymentProvider } from "@snipextt/wacht";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<FrontendDeploymentProvider publicKey="pk_aHR0cHM6Ly9mYXBpLndhY2h0LnRlY2g=">
			<App />
		</FrontendDeploymentProvider>
	</StrictMode>,
);
