import { useNavigate } from "react-router";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto px-4">
                <div className="flex justify-center mb-6">
                    <ExclamationTriangleIcon className="h-16 w-16 text-amber-500 dark:text-amber-400" />
                </div>

                <Heading level={1} className="mb-3">
                    Page Not Found
                </Heading>

                <Text className="mb-8 text-zinc-600 dark:text-zinc-400">
                    Sorry, we couldn't find the page you're looking for. The page may have been
                    moved, deleted, or the URL might be incorrect.
                </Text>

                <div className="flex justify-center gap-3">
                    <Button onClick={() => navigate(-1)} variant="outline">
                        Go Back
                    </Button>
                    <Button onClick={() => navigate("..")}>
                        Go to Overview
                    </Button>
                </div>
            </div>
        </div>
    );
}
