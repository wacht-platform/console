import { RouterProvider } from "react-router";
import { router } from "./router";
import { QueryProvider } from "./lib/providers/query";
import "./index.css";

function App() {
	return (
		<QueryProvider>
			<div className="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950 h-screen">
				<RouterProvider router={router} />
			</div>
		</QueryProvider>
	);
}

export default App;
