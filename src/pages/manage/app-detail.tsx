import { useNavigate, useParams } from "react-router";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/ui/page-head";
import { VanityEmbedShell } from "@/components/vanity-embed-shell";

export function AppDetail({
    kind,
    backLabel,
}: {
    kind: "api-auth" | "webhook";
    backLabel: string;
}) {
    const navigate = useNavigate();
    const { slug } = useParams();

    return (
        <div className="flex flex-col gap-4">
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit gap-1.5 text-muted-foreground"
                onClick={() => navigate("..")}
            >
                <ArrowLeftIcon className="size-4" />
                Back to {backLabel}
            </Button>
            <PageHead
                className="mb-0"
                eyebrow="Manage"
                title={slug ?? "App"}
            />
            <div className="min-h-[600px] overflow-hidden rounded-lg border border-border">
                <VanityEmbedShell kind={kind} appSlug={slug} />
            </div>
        </div>
    );
}
