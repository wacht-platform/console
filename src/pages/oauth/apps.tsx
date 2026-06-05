import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import {
    MagnifyingGlassIcon,
    PhotoIcon,
    Squares2X2Icon,
    FunnelIcon,
    PlusIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/ui/pill";
import { PageHead } from "@/components/ui/page-head";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, Label } from "@/components/ui/fieldset";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { toast } from "sonner";
import { useTour } from "@/lib/tour";
import {
    useCreateOAuthApp,
    useOAuthApps,
} from "@/lib/api/hooks/use-oauth-management";
import { useProjects } from "@/lib/api/hooks/use-projects";

function CreateOAuthAppDialog({
    open,
    onClose,
    onCreated,
    isProduction,
    rootDomain,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (slug: string) => void;
    isProduction: boolean;
    rootDomain: string;
}) {
    const createOAuthApp = useCreateOAuthApp();
    const [slug, setSlug] = useState("");
    const [name, setName] = useState("");
    const [fqdn, setFqdn] = useState("");
    const [description, setDescription] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleClose = () => {
        setSlug("");
        setName("");
        setFqdn("");
        setDescription("");
        setLogoFile(null);
        setLogoPreview("");
        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
        onClose();
    };

    const handleLogoSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview("");
        if (logoInputRef.current) {
            logoInputRef.current.value = "";
        }
    };

    const handleCreate = async () => {
        if (!slug.trim() || !name.trim()) {
            toast.error("Slug and name are required");
            return;
        }
        if (isProduction && !fqdn.trim()) {
            toast.error("FQDN is required for production deployments");
            return;
        }

        const created = await createOAuthApp.mutateAsync({
            slug: slug.trim(),
            name: name.trim(),
            fqdn: isProduction ? fqdn.trim() : undefined,
            description: description.trim() || undefined,
            logo_file: logoFile || undefined,
        });
        onCreated(created.slug);
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent
                className="sm:max-w-lg"
                onPointerDownOutside={(e) => {
                    if (
                        (e.target as HTMLElement | null)?.closest(
                            "[data-tour-overlay]",
                        )
                    ) {
                        e.preventDefault();
                    }
                }}
                onInteractOutside={(e) => {
                    if (
                        (e.target as HTMLElement | null)?.closest(
                            "[data-tour-overlay]",
                        )
                    ) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Create OAuth App</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="flex flex-col items-center pb-1">
                        <div
                            className="relative size-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary transition-colors hover:border-input hover:bg-accent"
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="OAuth app logo preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <PhotoIcon className="size-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                            >
                                {logoPreview ? "Change photo" : "Add photo"}
                            </button>
                            {logoPreview ? (
                                <>
                                    <span className="text-muted-foreground/40">
                                        ·
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                                    >
                                        Remove
                                    </button>
                                </>
                            ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            PNG, JPG, GIF, WEBP, ICO up to 2MB
                        </p>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoSelect}
                        />
                    </div>

                    <Field data-tour-id="oauth-app-slug">
                        <Label>Slug</Label>
                        <Input
                            placeholder="mcp-auth"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </Field>
                    <Field data-tour-id="oauth-app-name">
                        <Label>Name</Label>
                        <Input
                            placeholder="MCP Auth Server"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Field>
                    {isProduction ? (
                        <Field>
                            <Label>OAuth Domain</Label>
                            <div className="flex items-center rounded-md border bg-background">
                                <Input
                                    placeholder={`oauth.${rootDomain}`}
                                    value={fqdn}
                                    onChange={(e) =>
                                        setFqdn(e.target.value.toLowerCase())
                                    }
                                    className="border-0 shadow-none focus-visible:ring-0"
                                />
                            </div>
                        </Field>
                    ) : null}
                    <Field>
                        <Label>
                            Description
                            <span className="ml-1 font-normal text-muted-foreground">
                                · optional
                            </span>
                        </Label>
                        <Textarea
                            placeholder="Short description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </Field>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        data-tour-id="oauth-app-submit"
                        onClick={handleCreate}
                        disabled={createOAuthApp.isPending}
                    >
                        {createOAuthApp.isPending
                            ? "Creating..."
                            : "Create OAuth App"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function OAuthAppsIndexPage() {
    const navigate = useNavigate();
    const { projectId, deploymentId } = useParams();
    const { selectedDeployment } = useProjects();
    const [search, setSearch] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { data: oauthApps = [], isLoading } = useOAuthApps();
    useTour("first-oauth-apps", !isLoading);
    const isProduction = selectedDeployment?.mode === "production";
    const rootDomain = useMemo(() => {
        if (!selectedDeployment) return "";
        if (selectedDeployment.frontend_host.startsWith("accounts.")) {
            return selectedDeployment.frontend_host.slice("accounts.".length);
        }
        if (selectedDeployment.backend_host.startsWith("frontend.")) {
            return selectedDeployment.backend_host.slice("frontend.".length);
        }
        return selectedDeployment.frontend_host;
    }, [selectedDeployment]);

    const filteredApps = useMemo(() => {
        const term = search.trim().toLowerCase();
        return oauthApps.filter((app) => {
            if (!term) return true;
            return `${app.name} ${app.slug} ${app.description ?? ""}`
                .toLowerCase()
                .includes(term);
        });
    }, [oauthApps, search]);

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Configuration"
                title="OAuth apps"
                sub="OAuth app servers for this deployment."
                actions={
                    <>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <FunnelIcon className="size-4" />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 p-3">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search OAuth apps…"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="h-8 bg-secondary pl-8 text-[13px]"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            data-tour-id="oauth-create-button"
                            className="gap-1.5"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <PlusIcon className="size-4" />
                            Create OAuth app
                        </Button>
                    </>
                }
            />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>OAuth app</TableHead>
                        <TableHead>FQDN</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <SkeletonTableRows
                            rows={10}
                            columns={5}
                            withAvatar={false}
                        />
                    ) : filteredApps.length === 0 ? (
                        <TableEmptyRow
                            colSpan={5}
                            icon={
                                <Squares2X2Icon className="h-8 w-8 text-muted-foreground/50" />
                            }
                            title={
                                search ? "No OAuth apps found" : "No OAuth apps yet"
                            }
                            description={
                                search
                                    ? "Try adjusting your search."
                                    : "Create an OAuth app to let other apps sign in with this deployment."
                            }
                        />
                    ) : (
                        filteredApps.map((app) => (
                            <TableRow
                                key={app.id}
                                className="cursor-pointer"
                                onClick={() =>
                                    navigate(
                                        `/project/${projectId}/deployment/${deploymentId}/oauth/${app.slug}`,
                                    )
                                }
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-6 w-6 border border-border">
                                            <AvatarImage src={app.logo_url} />
                                            <AvatarFallback className="text-[10px]">
                                                {app.name
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate font-medium text-foreground">
                                            {app.name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {app.fqdn || "—"}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {format(
                                        new Date(app.updated_at),
                                        "MMM d, yyyy",
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Pill tone={app.is_active ? "ok" : "mute"}>
                                        {app.is_active ? "active" : "inactive"}
                                    </Pill>
                                </TableCell>
                                <TableCell className="w-10 text-muted-foreground">
                                    <ChevronRightIcon className="size-4" />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <CreateOAuthAppDialog
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                isProduction={isProduction}
                rootDomain={rootDomain}
                onCreated={(slug) =>
                    navigate(
                        `/project/${projectId}/deployment/${deploymentId}/oauth/${slug}`,
                    )
                }
            />
        </div>
    );
}
