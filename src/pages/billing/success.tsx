import { useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "checkout_complete" },
        window.location.origin,
      );
      window.close();
      return;
    }

    const timer = setTimeout(() => {
      navigate("../billing");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="h-10 w-10" />
        </div>

        <h1 className="text-xl font-medium tracking-tight text-foreground">
          Payment successful
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your subscription has been activated successfully.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Thank you for subscribing to Wacht. Your account has been upgraded and
          you now have access to all premium features.
        </p>

        {window.opener ? (
          <p className="mt-6 text-sm text-muted-foreground">
            This window will close automatically…
          </p>
        ) : (
          <>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button onClick={() => navigate("../billing")}>
                View billing details
              </Button>
              <Button variant="outline" onClick={() => navigate("../..")}>
                Go to dashboard
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Redirecting to billing page in 3 seconds…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
