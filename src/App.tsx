import React, { useEffect } from "react";
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
} from "@wacht/react-router";
import { AppLoading } from "./components/ui/loading-screen";
import { apiClient } from "./lib/api/client";
import { Toaster } from "sonner";
import { useTheme } from "./lib/providers/theme";

function SignedInRoutes() {
  const { getToken, session, loading } = useSession();
  const [interceptorReady, setInterceptorReady] = React.useState(false);

  useEffect(() => {
    const interceptorId = apiClient.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    setInterceptorReady(true);

    return () => {
      apiClient.interceptors.request.eject(interceptorId);
    };
  }, [getToken]);

  const activeSignInId = session?.active_signin?.id;
  const activeOrgMembershipId = session?.active_signin?.active_organization_membership_id;

  useEffect(() => {
    if (loading) return;
    if (!session) return;

    const storedSignInId = sessionStorage.getItem("wacht_prev_signin_id");
    const storedOrgMembershipId = sessionStorage.getItem("wacht_prev_org_membership_id");
    const hasInitialized = sessionStorage.getItem("wacht_session_initialized") === "true";

    sessionStorage.setItem("wacht_prev_signin_id", activeSignInId || "");
    sessionStorage.setItem("wacht_prev_org_membership_id", activeOrgMembershipId || "");

    if (!hasInitialized) {
      sessionStorage.setItem("wacht_session_initialized", "true");
      return;
    }

    const signInChanged = storedSignInId !== (activeSignInId || "");
    const orgChanged = storedOrgMembershipId !== (activeOrgMembershipId || "");

    if (signInChanged || orgChanged) {
      router.navigate("/");
    }
  }, [activeSignInId, activeOrgMembershipId, loading, session]);

  if (!interceptorReady || loading) {
    return <AppLoading />;
  }

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

function AppContent() {
  const { actualTheme } = useTheme();

  return (
    <div className="text-zinc-950 antialiased dark:text-zinc-100 h-screen">
      <DeploymentInitialized>
        <SignedIn>
          <SignedInRoutes />
        </SignedIn>
        <SignedOut>
          <NavigateToSignIn />
        </SignedOut>
      </DeploymentInitialized>
      <DeploymentInitializing>
        <AppLoading />
      </DeploymentInitializing>
      <Toaster
        theme={actualTheme}
        toastOptions={{
          style: {
            background: actualTheme === "dark" ? "#262626" : "#ffffff",
            color: actualTheme === "dark" ? "#fafafa" : "#171717",
            border:
              actualTheme === "dark"
                ? "1px solid #404040"
                : "1px solid #e5e5e5",
          },
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
