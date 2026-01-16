import { useRouteError, useNavigate, isRouteErrorResponse } from "react-router";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Button } from "../components/ui/button";

export default function ErrorBoundaryPage() {
    const error = useRouteError();
    const navigate = useNavigate();

    let errorMessage = "An unexpected error occurred";
    let errorDetails = "";

    if (isRouteErrorResponse(error)) {
        errorMessage = error.statusText || errorMessage;
        errorDetails = error.data?.message || "";
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = import.meta.env.DEV ? error.stack || "" : "";
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-2xl mx-auto px-4">
                <div className="flex justify-center mb-6">
                    <ExclamationCircleIcon className="h-16 w-16 text-red-500 dark:text-red-400" />
                </div>

                <Heading level={1} className="mb-3">
                    Something Went Wrong
                </Heading>

                <Text className="mb-4 text-zinc-600 dark:text-zinc-400">
                    {errorMessage}
                </Text>

                {errorDetails && import.meta.env.DEV && (
                    <pre className="mb-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left text-xs overflow-auto max-h-64">
                        <code className="text-zinc-800 dark:text-zinc-200">
                            {errorDetails}
                        </code>
                    </pre>
                )}

                <div className="flex justify-center gap-3 mt-8">
                    <Button onClick={() => window.location.reload()} variant={"outline"}>
                        Reload Page
                    </Button>
                    <Button onClick={() => navigate("..")}>
                        Go to Overview
                    </Button>
                </div>
            </div>
        </div>
    );
}
