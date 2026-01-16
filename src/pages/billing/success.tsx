import { useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <Heading className="mb-2">Payment Successful!</Heading>
        <Subheading className="mb-6">
          Your subscription has been activated successfully.
        </Subheading>

        <Text className="mb-8">
          Thank you for subscribing to Wacht. Your account has been upgraded and
          you now have access to all premium features.
        </Text>

        {window.opener ? (
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            This window will close automatically...
          </Text>
        ) : (
          <>
            <div className="space-y-3">
              <Button onClick={() => navigate("../billing")}>
                View Billing Details
              </Button>
              <Button variant="outline" onClick={() => navigate("../..")}>
                Go to Dashboard
              </Button>
            </div>

            <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-6">
              Redirecting to billing page in 3 seconds...
            </Text>
          </>
        )}
      </div>
    </div>
  );
}
