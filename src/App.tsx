import { RouterProvider } from "react-router";
import { router } from "./router";
import { QueryProvider } from "./lib/providers/query";
import "./index.css";
import {
	DeploymentInstanceInitialized,
	DeploymentInstanceInitializing,
	NavigateToSignin,
	SignedIn,
	SignedOut,
} from "@snipextt/wacht";
import { LoadingFallback } from "./components/loading-fallback";

function App() {
	return (
		<div className="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950 h-screen">
			{/* <DeploymentInstanceInitialized> */}
			<QueryProvider>
				<RouterProvider router={router} />
			</QueryProvider>
			{/* </DeploymentInstanceInitialized> */}
			{/* <DeploymentInstanceInitializing> */}
			{/* <LoadingFallback /> */}
			{/* </DeploymentInstanceInitializing> */}
		</div>
	);
}

export default App;
