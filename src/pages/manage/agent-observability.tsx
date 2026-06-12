import { PageHead } from "@/components/ui/page-head";

export default function AgentObservabilityPage() {
    return (
        <div className="flex flex-col gap-4">
            <PageHead
                eyebrow="Manage"
                title="Agent Observability"
                sub="Runs, tool calls and errors across your agents."
            />
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <p className="text-sm font-medium text-foreground">Coming soon</p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-muted-foreground">
                    Tool-call traces (with purpose) and agent error logs are being
                    wired up. Token usage by model is already on the Overview
                    dashboard.
                </p>
            </div>
        </div>
    );
}
