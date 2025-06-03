import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DeploymentProvider } from "@snipextt/wacht";
import "./index.css";
import App from "./App.tsx";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<DeploymentProvider publicKey="aHR0cHM6Ly9kaW13aXR0ZWQtYXhpcy0xLmJhY2tlbmQtYXBpLnNlcnZpY2Vz">
			<App />
		</DeploymentProvider>
	</StrictMode>,
);
