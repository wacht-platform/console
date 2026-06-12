import { useSearchParams } from "react-router";
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { PageHead } from "@/components/ui/page-head";
import { InlineLoader } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

export interface ManagedApp {
    app_slug: string;
    name: string;
    description?: string | null;
    is_active: boolean;
}

export function AppManager({
    kind,
    apps,
    loading,
    eyebrow,
    title,
    sub,
    emptyTitle,
    emptyMessage,
}: {
    kind: "api-auth" | "webhook";
    apps: ManagedApp[];
    loading: boolean;
    eyebrow: string;
    title: string;
    sub: string;
    emptyTitle: string;
    emptyMessage: string;
}) {
    const [params, setParams] = useSearchParams();
    const selected = params.get("app") || apps[0]?.app_slug || null;

    return (
        <div className="flex flex-col gap-4">
            <PageHead eyebrow={eyebrow} title={title} sub={sub} />
            {loading ? (
                <InlineLoader />
            ) : apps.length === 0 ? (
                <EmptyState
                    icon={<RectangleStackIcon className="h-12 w-12" />}
                    title={emptyTitle}
                    description={emptyMessage}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                    <div className="flex flex-col gap-1.5">
                        {apps.map((app) => {
                            const active = app.app_slug === selected;
                            return (
                                <button
                                    key={app.app_slug}
                                    type="button"
                                    onClick={() => setParams({ app: app.app_slug })}
                                    className={cn(
                                        "rounded-lg border px-3 py-2.5 text-left transition-colors",
                                        active
                                            ? "border-border bg-accent"
                                            : "border-transparent hover:bg-accent",
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {app.name}
                                        </span>
                                        {!app.is_active ? (
                                            <Pill tone="mute" className="shrink-0">
                                                inactive
                                            </Pill>
                                        ) : null}
                                    </div>
                                    <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                                        {app.app_slug}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="min-h-[600px] overflow-hidden rounded-lg border border-border">
                        {selected ? (
                            <VanityEmbedShell kind={kind} appSlug={selected} />
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
