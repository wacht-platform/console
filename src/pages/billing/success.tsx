import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const { projectId, deploymentId } = useParams();

  useEffect(() => {
    // Auto-redirect to billing page after 5 seconds
    const timer = setTimeout(() => {
      navigate(`/project/${projectId}/deployment/${deploymentId}/billing`);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, projectId, deploymentId]);

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
          <CardDescription>
            Your subscription has been successfully activated. You now have access to all premium features.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You will be redirected to the billing page in a few seconds...
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              outline
              onClick={() => navigate(`/project/${projectId}/deployment/${deploymentId}/`)}
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate(`/project/${projectId}/deployment/${deploymentId}/billing`)}
            >
              View Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}