import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { apiClient } from "@/lib/api/client";
import { useDeployment } from "@wacht/react-router";

type VanityKind = "webhook" | "api-auth";

interface VanityEmbedShellProps {
    kind: VanityKind;
}

interface TicketResponse {
    ticket: string;
    expires_at: number;
}

function createIframePath(kind: VanityKind, pathname: string): string {
    if (kind === "api-auth") return "/api-auth";
    return `/webhook${pathname.split("/webhooks")[1] ?? ""}`;
}

async function createSessionTicket(
    deploymentId: string,
    kind: VanityKind,
): Promise<TicketResponse> {
    const body =
        kind === "webhook"
            ? {
                  ticket_type: "webhook_app_access",
                  webhook_app_slug: `wh_${deploymentId}`,
              }
            : {
                  ticket_type: "api_auth_access",
                  api_auth_app_slug: `aa_${deploymentId}`,
              };

    const response = await apiClient.post<TicketResponse>(
        `/deployments/${deploymentId}/session/tickets`,
        body,
    );
    return response.data;
}

export function VanityEmbedShell({ kind }: VanityEmbedShellProps) {
    const { deploymentId } = useParams();
    const { pathname } = useLocation();
    const { deployment } = useDeployment();
    const [ticket, setTicket] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [nonce, setNonce] = useState(0);

    const vanityBaseUrl = deployment?.backend_host
        ? `${deployment.backend_host}/vanity`
        : null;
    const vanityPath = useMemo(
        () => createIframePath(kind, pathname),
        [kind, pathname],
    );

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!deploymentId || !vanityBaseUrl) {
                setLoading(true);
                return;
            }

            setLoading(true);
            setError(null);
            setTicket(null);

            try {
                const result = await createSessionTicket(deploymentId, kind);
                if (cancelled) return;
                setTicket(result.ticket);
            } catch (e) {
                if (cancelled) return;
                setError(
                    e instanceof Error
                        ? e.message
                        : "Failed to create session ticket",
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [deploymentId, kind, nonce, vanityBaseUrl, vanityPath]);

    if (loading || !ticket || !vanityBaseUrl) {
        return <InlineLoader />;
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                    className="w-fit"
                    variant="outline"
                    onClick={() => setNonce((n) => n + 1)}
                >
                    Retry
                </Button>
            </div>
        );
    }

    const src = `${vanityBaseUrl}${vanityPath}?ticket=${encodeURIComponent(ticket)}`;

    return (
        <div className="h-[calc(100vh-5.25rem)] w-full">
            <iframe
                key={`${kind}:${deploymentId ?? ""}:${vanityPath}:${ticket}`}
                src={src}
                title={kind === "webhook" ? "Webhook" : "API Auth"}
                className="h-full w-full border-0 outline-none"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    );
}
