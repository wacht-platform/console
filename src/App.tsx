import { RouterProvider } from "react-router";
import { router } from "./router";
import { QueryProvider } from "./lib/providers/query";
import { ThemeProvider } from "./lib/providers/theme";
import {
  DeploymentInitialized,
  DeploymentInitializing,
  SignedIn,
  SignedOut,
  NavigateToSignIn,
  useSession,
} from "@snipextt/wacht";
import { Spinner } from "./components/ui/spinner";
import { useEffect } from "react";
import { apiClient } from "./lib/api/client";
import { Toaster } from "sonner";
import { useTheme } from "./lib/providers/theme";

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

function AppContent() {
  const { actualTheme } = useTheme();
  
  return (
    <div className="text-zinc-950 antialiased lg:bg-zinc-50 dark:bg-zinc-900 dark:text-white h-screen">
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
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Initializing deployment
            </span>
          </div>
        </div>
      </DeploymentInitializing>
      <Toaster 
        theme={actualTheme}
        toastOptions={{
          style: {
            background: actualTheme === 'dark' ? '#262626' : '#ffffff',
            color: actualTheme === 'dark' ? '#fafafa' : '#171717',
            border: actualTheme === 'dark' ? '1px solid #404040' : '1px solid #e5e5e5',
          }
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
