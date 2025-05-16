import { RouterProvider } from "react-router";
import { router } from "./router";
import { QueryProvider } from "./lib/providers/query";
import {
  DeploymentInitialized,
  DeploymentInitializing,
  SignedIn,
  SignedOut,
  NavigateToSignIn,
  useSession,
} from "@snipextt/wacht";
import { LoadingFallback } from "./components/loading-fallback";
import { useEffect } from "react";
import { apiClient } from "./lib/api/client";

function SignedInRoutes() {
  const { getToken } = useSession();

  useEffect(() => {
    apiClient.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }, [getToken]);

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <div className="text-zinc-950 antialiased lg:bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950 h-screen">
      <DeploymentInitialized>
        <SignedIn>
          <QueryProvider>
            <SignedInRoutes />
          </QueryProvider>
        </SignedIn>
        <SignedOut>
          <NavigateToSignIn />
        </SignedOut>
      </DeploymentInitialized>
      <DeploymentInitializing>
        <LoadingFallback />
      </DeploymentInitializing>
    </div>
  );
}

export default App;
