import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { apiClient } from "@/lib/api/client";
import { useTheme } from "@/lib/providers/theme";
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
    const { actualTheme } = useTheme();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [ticket, setTicket] = useState<string | null>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [nonce, setNonce] = useState(0);

    // Snapshot the theme at mint time so the initial iframe URL is correct
    // without forcing a reload (and re-redeem of the one-time ticket) on toggle —
    // later theme changes are pushed over postMessage, never via the src.
    const themeRef = useRef(actualTheme);
    themeRef.current = actualTheme;

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
            setSrc(null);

            try {
                const result = await createSessionTicket(deploymentId, kind);
                if (cancelled) return;
                setTicket(result.ticket);
                setSrc(
                    `${vanityBaseUrl}${vanityPath}?ticket=${encodeURIComponent(result.ticket)}&theme=${themeRef.current}`,
                );
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

    return (
        <VanityEmbedFrame
            loading={loading}
            error={error}
            src={src}
            kind={kind}
            deploymentId={deploymentId}
            vanityPath={vanityPath}
            ticket={ticket}
            actualTheme={actualTheme}
            iframeRef={iframeRef}
            onRetry={() => setNonce((n) => n + 1)}
        />
    );
}

interface VanityEmbedFrameProps {
    loading: boolean;
    error: string | null;
    src: string | null;
    kind: VanityKind;
    deploymentId?: string;
    vanityPath: string;
    ticket: string | null;
    actualTheme: "light" | "dark";
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    onRetry: () => void;
}

function VanityEmbedFrame({
    loading,
    error,
    src,
    kind,
    deploymentId,
    vanityPath,
    ticket,
    actualTheme,
    iframeRef,
    onRetry,
}: VanityEmbedFrameProps) {
    // Push theme changes to the embedded surface over postMessage instead of
    // re-navigating the iframe — the session ticket is one-time-redeemable, so a
    // reload would break the session.
    useEffect(() => {
        iframeRef.current?.contentWindow?.postMessage(
            { type: "wacht:theme", theme: actualTheme },
            "*",
        );
    }, [actualTheme, src, iframeRef]);

    // The vanity surface posts `wacht:ready` once it can receive messages;
    // answer with the current theme to cover the initial handshake race.
    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const data = event.data;
            if (!data || typeof data !== "object") return;
            if (data.type !== "wacht:ready") return;
            iframeRef.current?.contentWindow?.postMessage(
                { type: "wacht:theme", theme: actualTheme },
                "*",
            );
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [actualTheme, iframeRef]);

    if (error) {
        return (
            <div className="p-6 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button className="w-fit" variant="outline" onClick={onRetry}>
                    Retry
                </Button>
            </div>
        );
    }

    if (loading || !src || !ticket) {
        return <InlineLoader />;
    }

    return (
        <div className="h-[calc(100vh-5.25rem)] w-full">
            <iframe
                ref={iframeRef}
                key={`${kind}:${deploymentId ?? ""}:${vanityPath}:${ticket}`}
                src={src}
                title={kind === "webhook" ? "Webhook" : "API Auth"}
                className="h-full w-full border-0 outline-none"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    );
}
