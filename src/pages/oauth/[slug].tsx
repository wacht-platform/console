import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useArchiveOAuthScope,
    useCreateOAuthClient,
    useSetOAuthScopeMapping,
    useUnarchiveOAuthScope,
    useOAuthApps,
    useOAuthClients,
    useUpdateOAuthApp,
    useUpdateOAuthScope,
    useVerifyOAuthAppDomain,
} from "@/lib/api/hooks/use-oauth-management";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useProjects } from "@/lib/api/hooks/use-projects";
import type {
    JwksDocument,
    OAuthClient,
    OAuthScopeDefinition,
} from "@/types/oauth-management";

function splitCsv(value: string): string[] {
    return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
}

function formatClientAuthMethodLabel(method: string): string {
    const labels: Record<string, string> = {
        client_secret_basic: "Client Secret Basic",
        client_secret_post: "Client Secret Post",
        client_secret_jwt: "Client Secret JWT",
        private_key_jwt: "Private Key JWT",
        none: "No Client Authentication",
    };
    return labels[method] ?? method;
}

function formatGrantTypeLabel(grantType: string): string {
    const labels: Record<string, string> = {
        authorization_code: "Authorization Code",
        refresh_token: "Refresh Token",
        client_credentials: "Client Credentials",
    };
    return labels[grantType] ?? grantType;
}

const REQUIRED_OAUTH_SCOPES = ["read", "write"] as const;

function defaultScopeDisplayName(scope: string): string {
    return scope
        .split(/[_:.-]/g)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function defaultScopeDescription(scope: string): string {
    return `Access for ${scope}.`;
}

function normalizeScopeDefinitions(
    scopes: string[],
    definitions: OAuthScopeDefinition[],
): OAuthScopeDefinition[] {
    const byScope = new Map(
        definitions.map((definition) => [definition.scope, definition]),
    );

    return scopes.map((scope) => {
        const existing = byScope.get(scope);

        return {
            scope,
            display_name:
                existing?.display_name?.trim() ||
                defaultScopeDisplayName(scope),
            description:
                existing?.description?.trim() || defaultScopeDescription(scope),
            archived: !!existing?.archived,
            category: existing?.category || "",
            organization_permission:
                existing?.organization_permission || undefined,
            workspace_permission: existing?.workspace_permission || undefined,
        };
    });
}

function PillInput({
    values,
    onChange,
    placeholder,
    onEdit,
    getMeta,
}: {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    onEdit?: (value: string) => void;
    getMeta?: (value: string) => { archived?: boolean };
}) {
    const [draft, setDraft] = useState("");

    const commit = (raw: string) => {
        const incoming = splitCsv(raw);
        if (incoming.length === 0) return;
        const merged = [...values];
        for (const value of incoming) {
            if (!merged.includes(value)) merged.push(value);
        }
        onChange(merged);
    };

    return (
        <div className="space-y-2">
            {values.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    {values.map((value) => (
                        <div
                            key={value}
                            className="inline-flex h-9 items-center gap-1 rounded-full border bg-background px-3"
                        >
                            <p className="text-sm">{value}</p>
                            {getMeta?.(value)?.archived ? (
                                <span className="text-[10px] text-zinc-500">
                                    archived
                                </span>
                            ) : null}
                            {onEdit ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 h-2 w-2 p-0 text-zinc-500 hover:text-zinc-700"
                                    onClick={() => onEdit(value)}
                                    title="Edit scope details"
                                >
                                    <Pencil width={4} height={4} />
                                </Button>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}
            <Input
                placeholder={placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commit(draft);
                        setDraft("");
                    }
                }}
                onBlur={() => {
                    commit(draft);
                    setDraft("");
                }}
            />
        </div>
    );
}

function CreateOAuthClientDialog({
    open,
    onClose,
    oauthAppSlug,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    oauthAppSlug: string;
    onCreated: (client: OAuthClient) => void;
}) {
    const createOAuthClient = useCreateOAuthClient(oauthAppSlug);
    const [clientAuthMethod, setClientAuthMethod] = useState(
        "client_secret_basic",
    );
    const [allowRefreshToken, setAllowRefreshToken] = useState(true);
    const [redirectUris, setRedirectUris] = useState("");
    const [tokenSigningAlg, setTokenSigningAlg] = useState("");
    const [keyMaterialMode, setKeyMaterialMode] = useState<
        "jwks_uri" | "jwks" | "pem"
    >("jwks_uri");
    const [jwksUri, setJwksUri] = useState("");
    const [jwksJson, setJwksJson] = useState("");
    const [publicKeyPem, setPublicKeyPem] = useState("");

    const handleClose = () => {
        setClientAuthMethod("client_secret_basic");
        setAllowRefreshToken(true);
        setRedirectUris("");
        setTokenSigningAlg("");
        setKeyMaterialMode("jwks_uri");
        setJwksUri("");
        setJwksJson("");
        setPublicKeyPem("");
        onClose();
    };

    const handleCreate = async () => {
        const request: {
            client_auth_method: string;
            grant_types: string[];
            redirect_uris: string[];
            token_endpoint_auth_signing_alg?: string;
            jwks_uri?: string;
            jwks?: JwksDocument;
            public_key_pem?: string;
        } = {
            client_auth_method: clientAuthMethod,
            grant_types: allowRefreshToken
                ? ["authorization_code", "refresh_token"]
                : ["authorization_code"],
            redirect_uris: splitCsv(redirectUris),
        };

        const signingAlg = tokenSigningAlg.trim();
        if (signingAlg) {
            request.token_endpoint_auth_signing_alg = signingAlg;
        }

        if (clientAuthMethod === "private_key_jwt") {
            if (keyMaterialMode === "jwks_uri") {
                const trimmedJwksUri = jwksUri.trim();
                if (!trimmedJwksUri) {
                    toast.error("JWKS URI is required for private_key_jwt");
                    return;
                }
                request.jwks_uri = trimmedJwksUri;
            } else if (keyMaterialMode === "jwks") {
                const trimmedJwksJson = jwksJson.trim();
                if (!trimmedJwksJson) {
                    toast.error("JWKS JSON is required for private_key_jwt");
                    return;
                }
                try {
                    const parsed = JSON.parse(trimmedJwksJson) as JwksDocument;
                    if (
                        !Array.isArray(parsed.keys) ||
                        parsed.keys.length === 0
                    ) {
                        toast.error(
                            "JWKS JSON must include a non-empty keys array",
                        );
                        return;
                    }
                    request.jwks = parsed;
                } catch {
                    toast.error("JWKS JSON is invalid");
                    return;
                }
            } else {
                const trimmedPem = publicKeyPem.trim();
                if (!trimmedPem) {
                    toast.error(
                        "Public key PEM is required for private_key_jwt",
                    );
                    return;
                }
                request.public_key_pem = trimmedPem;
            }
        }

        const created = await createOAuthClient.mutateAsync(request);

        onCreated(created);
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create OAuth Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            Client Authentication Method
                        </p>
                        <Select
                            value={clientAuthMethod}
                            onValueChange={setClientAuthMethod}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="client_secret_basic">
                                    Client Secret Basic
                                </SelectItem>
                                <SelectItem value="client_secret_post">
                                    Client Secret Post
                                </SelectItem>
                                <SelectItem value="client_secret_jwt">
                                    Client Secret JWT
                                </SelectItem>
                                <SelectItem value="none">
                                    No Client Authentication
                                </SelectItem>
                                <SelectItem value="private_key_jwt">
                                    Private Key JWT
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            Grant Types
                        </p>
                        <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm">
                                        Authorization Code
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Required
                                    </p>
                                </div>
                                <Switch checked disabled />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm">Refresh Token</p>
                                    <p className="text-xs text-muted-foreground">
                                        Optional
                                    </p>
                                </div>
                                <Switch
                                    checked={allowRefreshToken}
                                    onCheckedChange={setAllowRefreshToken}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            Redirect URIs
                        </p>
                        <Textarea
                            placeholder="https://app.example.com/callback"
                            value={redirectUris}
                            onChange={(e) => setRedirectUris(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {(clientAuthMethod === "client_secret_jwt" ||
                        clientAuthMethod === "private_key_jwt") && (
                        <div>
                            <p className="mb-2 text-sm text-muted-foreground">
                                Token Endpoint Signing Algorithm
                            </p>
                            <Input
                                placeholder={
                                    clientAuthMethod === "private_key_jwt"
                                        ? "RS256"
                                        : "HS256"
                                }
                                value={tokenSigningAlg}
                                onChange={(e) =>
                                    setTokenSigningAlg(e.target.value)
                                }
                            />
                        </div>
                    )}

                    {clientAuthMethod === "private_key_jwt" && (
                        <div className="space-y-3">
                            <div>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    Public Key Source
                                </p>
                                <Select
                                    value={keyMaterialMode}
                                    onValueChange={(value) =>
                                        setKeyMaterialMode(
                                            value as
                                                | "jwks_uri"
                                                | "jwks"
                                                | "pem",
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="jwks_uri">
                                            JWKS URI
                                        </SelectItem>
                                        <SelectItem value="jwks">
                                            Inline JWKS JSON
                                        </SelectItem>
                                        <SelectItem value="pem">
                                            Public Key PEM
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {keyMaterialMode === "jwks_uri" ? (
                                <div>
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        JWKS URI
                                    </p>
                                    <Input
                                        placeholder="https://client.example.com/.well-known/jwks.json"
                                        value={jwksUri}
                                        onChange={(e) =>
                                            setJwksUri(e.target.value)
                                        }
                                    />
                                </div>
                            ) : keyMaterialMode === "jwks" ? (
                                <div>
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        JWKS JSON
                                    </p>
                                    <Textarea
                                        placeholder='{"keys":[{"kty":"RSA","kid":"my-key","n":"...","e":"AQAB"}]}'
                                        value={jwksJson}
                                        onChange={(e) =>
                                            setJwksJson(e.target.value)
                                        }
                                        rows={5}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        Public Key PEM
                                    </p>
                                    <Textarea
                                        placeholder={
                                            "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
                                        }
                                        value={publicKeyPem}
                                        onChange={(e) =>
                                            setPublicKeyPem(e.target.value)
                                        }
                                        rows={6}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={createOAuthClient.isPending}
                    >
                        {createOAuthClient.isPending
                            ? "Creating..."
                            : "Create OAuth Client"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OAuthClientCreatedDialog({
    client,
    open,
    onClose,
}: {
    client?: OAuthClient;
    open: boolean;
    onClose: () => void;
}) {
    if (!client) return null;
    const clientSecret = client.client_secret;

    const copy = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error(`Failed to copy ${label.toLowerCase()}`);
        }
    };

    const downloadDetails = () => {
        const payload = {
            client_id: client.client_id,
            client_secret: client.client_secret ?? null,
            grant_types: client.grant_types,
            redirect_uris: client.redirect_uris,
            token_endpoint_auth_signing_alg:
                client.token_endpoint_auth_signing_alg ?? null,
            jwks_uri: client.jwks_uri ?? null,
            jwks: client.jwks ?? null,
            public_key_pem: client.public_key_pem ?? null,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${client.client_id}-credentials.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const isSecretBased =
        client.client_auth_method === "client_secret_basic" ||
        client.client_auth_method === "client_secret_post" ||
        client.client_auth_method === "client_secret_jwt";

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>OAuth Client Created</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-1">
                    <div className="space-y-2">
                        <div className="rounded border px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-zinc-500">
                                    Client ID
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() =>
                                        copy(client.client_id, "Client ID")
                                    }
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="font-mono text-xs break-all">
                                {client.client_id}
                            </p>
                        </div>
                    </div>

                    {isSecretBased && (
                        <div className="space-y-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-amber-900">
                                    Client Secret (shown once)
                                </p>
                                {clientSecret ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-amber-900 hover:text-amber-900"
                                        onClick={() =>
                                            copy(clientSecret, "Client secret")
                                        }
                                    >
                                        Copy
                                    </Button>
                                ) : null}
                            </div>
                            <p className="font-mono text-xs break-all text-amber-900">
                                {clientSecret ?? "Secret was not returned"}
                            </p>
                        </div>
                    )}

                    {client.client_auth_method === "none" && (
                        <p className="text-sm text-muted-foreground">
                            This is a public client. Use only{" "}
                            <code>client_id</code> in token/authorization
                            requests.
                        </p>
                    )}

                    {client.client_auth_method === "private_key_jwt" && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                This client authenticates using signed JWT
                                assertions with its private key.
                            </p>
                            {client.jwks_uri && (
                                <div className="rounded border px-3 py-2">
                                    <p className="text-xs text-zinc-500">
                                        Registered JWKS URI
                                    </p>
                                    <p className="font-mono text-xs break-all">
                                        {client.jwks_uri}
                                    </p>
                                </div>
                            )}
                            {client.jwks && (
                                <div className="rounded border px-3 py-2">
                                    <p className="text-xs text-zinc-500">
                                        Registered JWKS
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {client.jwks.keys.length} key(s)
                                    </p>
                                </div>
                            )}
                            {client.public_key_pem && (
                                <div className="rounded border px-3 py-2">
                                    <p className="text-xs text-zinc-500">
                                        Registered Public Key (PEM)
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Stored for later parsing/normalization.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={downloadDetails}
                    >
                        Download Details
                    </Button>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function OAuthAppDetailsPage() {
    const navigate = useNavigate();
    const { slug } = useParams();
    const oauthAppSlug = slug || "";

    const [activeTab, setActiveTab] = useState("clients");
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const [createdClient, setCreatedClient] = useState<OAuthClient>();
    const [clientSearch, setClientSearch] = useState("");
    const [domainVerified, setDomainVerified] = useState<boolean | null>(null);

    const { data: oauthApps = [], isLoading: oauthAppsLoading } =
        useOAuthApps();
    const { deploymentSettings } = useCurrentDeployemnt();
    const { selectedDeployment } = useProjects();
    const verifyOAuthAppDomain = useVerifyOAuthAppDomain(oauthAppSlug);
    const { data: oauthClients = [], isLoading: oauthClientsLoading } =
        useOAuthClients(oauthAppSlug);
    const updateOAuthApp = useUpdateOAuthApp(oauthAppSlug);

    const oauthApp = useMemo(
        () => oauthApps.find((app) => app.slug === oauthAppSlug),
        [oauthApps, oauthAppSlug],
    );
    const filteredOAuthClients = useMemo(() => {
        const term = clientSearch.trim().toLowerCase();
        if (!term) return oauthClients;
        return oauthClients.filter((client) => {
            return `${client.client_id} ${client.client_auth_method} ${client.grant_types.join(" ")}`
                .toLowerCase()
                .includes(term);
        });
    }, [oauthClients, clientSearch]);

    const [settingsName, setSettingsName] = useState("");
    const [settingsDescription, setSettingsDescription] = useState("");
    const [settingsScopes, setSettingsScopes] = useState<string[]>([]);
    const [settingsScopeDefinitions, setSettingsScopeDefinitions] = useState<
        OAuthScopeDefinition[]
    >([]);
    const [editingScope, setEditingScope] =
        useState<OAuthScopeDefinition | null>(null);
    const updateOAuthScope = useUpdateOAuthScope(
        oauthAppSlug,
        editingScope?.scope,
    );
    const archiveOAuthScope = useArchiveOAuthScope(
        oauthAppSlug,
        editingScope?.scope,
    );
    const unarchiveOAuthScope = useUnarchiveOAuthScope(
        oauthAppSlug,
        editingScope?.scope,
    );
    const setOAuthScopeMapping = useSetOAuthScopeMapping(
        oauthAppSlug,
        editingScope?.scope,
    );
    const [
        settingsAllowDynamicRegistration,
        setSettingsAllowDynamicRegistration,
    ] = useState(false);
    const [settingsActive, setSettingsActive] = useState(true);
    const organizationPermissions =
        deploymentSettings?.b2b_settings?.organization_permissions || [];
    const workspacePermissions =
        deploymentSettings?.b2b_settings?.workspace_permissions || [];

    useEffect(() => {
        if (!oauthApp) return;
        setSettingsName(oauthApp.name);
        setSettingsDescription(oauthApp.description || "");
        const merged = [...(oauthApp.supported_scopes || [])];
        for (const scope of REQUIRED_OAUTH_SCOPES) {
            if (!merged.includes(scope)) merged.push(scope);
        }
        setSettingsScopes(merged);
        setSettingsScopeDefinitions(
            normalizeScopeDefinitions(merged, oauthApp.scope_definitions || []),
        );
        setSettingsAllowDynamicRegistration(
            !!oauthApp.allow_dynamic_client_registration,
        );
        setSettingsActive(!!oauthApp.is_active);
    }, [oauthApp]);

    useEffect(() => {
        setSettingsScopeDefinitions((previous) =>
            normalizeScopeDefinitions(settingsScopes, previous),
        );
    }, [settingsScopes]);

    if (oauthAppsLoading) return <InlineLoader />;

    if (!oauthApp) {
        return (
            <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                    OAuth app not found.
                </p>
            </div>
        );
    }

    const handleSaveSettings = async () => {
        await updateOAuthApp.mutateAsync({
            name: settingsName.trim(),
            description: settingsDescription.trim() || undefined,
            supported_scopes: settingsScopes,
            allow_dynamic_client_registration: settingsAllowDynamicRegistration,
            is_active: settingsActive,
        });
    };

    const updateScopeDefinition = (
        scope: string,
        update: Partial<OAuthScopeDefinition>,
    ) => {
        setSettingsScopeDefinitions((previous) =>
            previous.map((definition) =>
                definition.scope === scope
                    ? { ...definition, ...update, scope: definition.scope }
                    : definition,
            ),
        );
    };

    const openScopeEditor = (scope: string) => {
        const definition = settingsScopeDefinitions.find(
            (d) => d.scope === scope,
        );
        if (!definition) return;
        setEditingScope({ ...definition });
    };

    const saveScopeEditor = async () => {
        if (!editingScope) return;
        const original = settingsScopeDefinitions.find(
            (d) => d.scope === editingScope.scope,
        );
        if (!original) return;

        await updateOAuthScope.mutateAsync({
            display_name: editingScope.display_name,
            description: editingScope.description,
        });

        const mappingChanged =
            original.category !== editingScope.category ||
            original.organization_permission !==
                editingScope.organization_permission ||
            original.workspace_permission !== editingScope.workspace_permission;
        if (mappingChanged && editingScope.category) {
            await setOAuthScopeMapping.mutateAsync({
                category:
                    editingScope.category as
                        | "personal"
                        | "organization"
                        | "workspace",
                organization_permission: editingScope.organization_permission,
                workspace_permission: editingScope.workspace_permission,
            });
        }

        if (original.archived !== editingScope.archived) {
            if (editingScope.archived) {
                await archiveOAuthScope.mutateAsync();
            } else {
                await unarchiveOAuthScope.mutateAsync();
            }
        }

        updateScopeDefinition(editingScope.scope, {
            display_name: editingScope.display_name,
            description: editingScope.description,
            archived: editingScope.archived,
            category: editingScope.category,
            organization_permission: editingScope.organization_permission,
            workspace_permission: editingScope.workspace_permission,
        });
        setEditingScope(null);
    };

    const editingScopeOriginal = editingScope
        ? settingsScopeDefinitions.find((d) => d.scope === editingScope.scope)
        : null;
    const isCategoryLocked = !!editingScopeOriginal?.category;
    const isOrganizationPermissionLocked =
        !!editingScopeOriginal?.organization_permission;
    const isWorkspacePermissionLocked =
        !!editingScopeOriginal?.workspace_permission;
    const isScopeSavePending =
        updateOAuthScope.isPending ||
        setOAuthScopeMapping.isPending ||
        archiveOAuthScope.isPending ||
        unarchiveOAuthScope.isPending;

    const copyRuntimeValue = async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error(`Failed to copy ${label.toLowerCase()}`);
        }
    };

    const issuerUrl = `https://${oauthApp.fqdn}`;
    const authorizationEndpoint = `${issuerUrl}/oauth/authorize`;
    const tokenEndpoint = `${issuerUrl}/oauth/token`;
    const revocationEndpoint = `${issuerUrl}/oauth/revoke`;
    const introspectionEndpoint = `${issuerUrl}/oauth/introspect`;
    const registrationEndpoint = `${issuerUrl}/oauth/register`;
    const metadataEndpoint = `${issuerUrl}/.well-known/oauth-authorization-server`;
    const connectorMapTarget = "oauth.wacht.services";
    const runtimeEndpoints = [
        { label: "Authorization", value: authorizationEndpoint },
        { label: "Token", value: tokenEndpoint },
        { label: "Revocation", value: revocationEndpoint },
        { label: "Introspection", value: introspectionEndpoint },
        { label: "Dynamic Registration", value: registrationEndpoint },
    ];
    const discoveryEndpoints = [
        { label: "OAuth Metadata", value: metadataEndpoint },
    ];
    const isProductionDeployment = selectedDeployment?.mode === "production";

    const handleCheckDomain = async () => {
        try {
            const result = await verifyOAuthAppDomain.mutateAsync();
            setDomainVerified(result.verified);
            if (result.verified) {
                toast.success("Domain verified");
            } else {
                toast.error(
                    "Domain not verified yet. Ensure your CNAME points to oauth.wacht.services.",
                );
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to check domain";
            toast.error(message);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <section>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={oauthApp.logo_url} />
                                <AvatarFallback>
                                    {oauthApp.name.slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-xl font-normal tracking-tight">
                                    {oauthApp.name}
                                </h1>
                                <p className="mt-1 text-xs text-zinc-500">
                                    {oauthApp.slug}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="clients">Clients</TabsTrigger>
                        <TabsTrigger value="runtime">Runtime</TabsTrigger>
                        <TabsTrigger value="settings">App Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="clients" className="mt-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-base font-normal">
                                OAuth Clients
                            </h2>
                            <Button onClick={() => setIsCreateClientOpen(true)}>
                                Create OAuth Client
                            </Button>
                        </div>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <Input
                                className="max-w-sm"
                                placeholder="Search client ID, auth method, grant type"
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500">
                                {oauthClients.length} total
                            </p>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client ID</TableHead>
                                    <TableHead>Auth Method</TableHead>
                                    <TableHead>Grant Types</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {oauthClientsLoading ? (
                                    <SkeletonTableRows
                                        rows={8}
                                        columns={4}
                                        withAvatar={false}
                                    />
                                ) : filteredOAuthClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-20 text-center text-muted-foreground"
                                        >
                                            {oauthClients.length === 0
                                                ? "No OAuth clients yet"
                                                : "No OAuth clients match your search"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOAuthClients.map((client) => (
                                        <TableRow
                                            key={client.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                navigate(
                                                    `clients/${client.id}`,
                                                )
                                            }
                                        >
                                            <TableCell className="font-mono text-xs">
                                                {client.client_id}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatClientAuthMethodLabel(
                                                    client.client_auth_method,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {client.grant_types
                                                    .map(formatGrantTypeLabel)
                                                    .join(", ")}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(
                                                    new Date(client.created_at),
                                                    "MMM d, yyyy",
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    <TabsContent value="runtime" className="mt-4">
                        <div className="space-y-6">
                            <section className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                                            Runtime Profile
                                        </p>
                                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                            OAuth Runtime
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                copyRuntimeValue(
                                                    "OAuth Domain",
                                                    oauthApp.fqdn,
                                                )
                                            }
                                        >
                                            Copy Domain
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                copyRuntimeValue(
                                                    "Issuer URL",
                                                    issuerUrl,
                                                )
                                            }
                                        >
                                            Copy Issuer
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="rounded-lg border bg-background p-3">
                                        <p className="text-xs text-zinc-500">
                                            Runtime Domain (FQDN)
                                        </p>
                                        <p className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                                            {oauthApp.fqdn}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border bg-background p-3">
                                        <p className="text-xs text-zinc-500">
                                            Issuer
                                        </p>
                                        <p className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                                            {issuerUrl}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {isProductionDeployment ? (
                                <section className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                                Domain Verification
                                            </p>
                                            <p className="text-sm text-emerald-900 dark:text-emerald-100">
                                                Map your connector domain with a
                                                CNAME record and verify DNS.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleCheckDomain}
                                            disabled={
                                                verifyOAuthAppDomain.isPending
                                            }
                                        >
                                            {verifyOAuthAppDomain.isPending
                                                ? "Checking..."
                                                : "Check Domain"}
                                        </Button>
                                    </div>
                                    <div className="mt-4 rounded-lg border bg-background p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs text-zinc-500">
                                                Map Connector Domain To
                                            </p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs"
                                                onClick={() =>
                                                    copyRuntimeValue(
                                                        "Connector Map Target",
                                                        connectorMapTarget,
                                                    )
                                                }
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                        <p className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                                            {connectorMapTarget}
                                        </p>
                                    </div>
                                    {domainVerified !== null ? (
                                        <p
                                            className={`mt-3 text-xs ${domainVerified ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}
                                        >
                                            {domainVerified
                                                ? "Domain is verified."
                                                : "Domain is not verified yet."}
                                        </p>
                                    ) : null}
                                </section>
                            ) : null}

                            <section>
                                <p className="text-xs uppercase tracking-wide text-zinc-500">
                                    OAuth Endpoints
                                </p>
                                <div className="mt-3 space-y-2">
                                    {runtimeEndpoints.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-start justify-between gap-3 rounded-lg border bg-zinc-50/60 p-3 dark:bg-zinc-900/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs text-zinc-500">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                                                    {item.value}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs"
                                                onClick={() =>
                                                    copyRuntimeValue(
                                                        item.label,
                                                        item.value,
                                                    )
                                                }
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <p className="text-xs uppercase tracking-wide text-zinc-500">
                                    Discovery
                                </p>
                                <div className="mt-3 space-y-2">
                                    {discoveryEndpoints.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-start justify-between gap-3 rounded-lg border bg-zinc-50/60 p-3 dark:bg-zinc-900/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs text-zinc-500">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                                                    {item.value}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs"
                                                onClick={() =>
                                                    copyRuntimeValue(
                                                        item.label,
                                                        item.value,
                                                    )
                                                }
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-base font-medium">
                                OAuth App Settings
                            </h2>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={updateOAuthApp.isPending}
                            >
                                {updateOAuthApp.isPending
                                    ? "Saving..."
                                    : "Save Settings"}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    App Name
                                </p>
                                <Input
                                    value={settingsName}
                                    onChange={(e) =>
                                        setSettingsName(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    Description
                                </p>
                                <Textarea
                                    value={settingsDescription}
                                    onChange={(e) =>
                                        setSettingsDescription(e.target.value)
                                    }
                                    rows={3}
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    Supported Scopes
                                </p>
                                <PillInput
                                    values={settingsScopes}
                                    onChange={setSettingsScopes}
                                    placeholder="Type scope and press Enter"
                                    onEdit={openScopeEditor}
                                    getMeta={(scope) => {
                                        const definition =
                                            settingsScopeDefinitions.find(
                                                (d) => d.scope === scope,
                                            );
                                        return {
                                            archived: !!definition?.archived,
                                        };
                                    }}
                                />
                                <p className="mt-1 text-xs text-zinc-500">
                                    Scopes are append-only. Added scopes cannot
                                    be removed.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm">
                                        Allow Dynamic Client Registration
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        Allow clients to self-register via OAuth
                                        registration APIs.
                                    </p>
                                </div>
                                <Switch
                                    checked={settingsAllowDynamicRegistration}
                                    onCheckedChange={
                                        setSettingsAllowDynamicRegistration
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm">App Active</p>
                                    <p className="text-xs text-zinc-500">
                                        Disable to block app usage.
                                    </p>
                                </div>
                                <Switch
                                    checked={settingsActive}
                                    onCheckedChange={setSettingsActive}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <CreateOAuthClientDialog
                open={isCreateClientOpen}
                onClose={() => setIsCreateClientOpen(false)}
                oauthAppSlug={oauthAppSlug}
                onCreated={(client) => {
                    setCreatedClient(client);
                }}
            />

            <OAuthClientCreatedDialog
                client={createdClient}
                open={!!createdClient}
                onClose={() => setCreatedClient(undefined)}
            />

            <Dialog
                open={!!editingScope}
                onOpenChange={(open) => !open && setEditingScope(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Scope</DialogTitle>
                    </DialogHeader>
                    {editingScope ? (
                        <div className="space-y-3 py-1">
                            <div>
                                <p className="mb-2 text-xs text-zinc-500">
                                    Scope key
                                </p>
                                <div className="rounded-md border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
                                    {editingScope.scope}
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-xs text-zinc-500">
                                    Display name
                                </p>
                                <Input
                                    value={editingScope.display_name}
                                    onChange={(e) =>
                                        setEditingScope({
                                            ...editingScope,
                                            display_name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <p className="mb-2 text-xs text-zinc-500">
                                    Description
                                </p>
                                <Textarea
                                    value={editingScope.description}
                                    onChange={(e) =>
                                        setEditingScope({
                                            ...editingScope,
                                            description: e.target.value,
                                        })
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm">Archived</p>
                                <Switch
                                    checked={editingScope.archived}
                                    onCheckedChange={(checked) =>
                                        setEditingScope({
                                            ...editingScope,
                                            archived: checked,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-xs text-zinc-500">
                                    Category
                                </p>
                                <Select
                                    value={editingScope.category || "__unset__"}
                                    disabled={isCategoryLocked}
                                    onValueChange={(value) =>
                                        setEditingScope({
                                            ...editingScope,
                                            category:
                                                value === "__unset__"
                                                    ? ""
                                                    : (value as OAuthScopeDefinition["category"]),
                                            organization_permission:
                                                value === "organization"
                                                    ? editingScope.organization_permission
                                                    : undefined,
                                            workspace_permission:
                                                value === "workspace"
                                                    ? editingScope.workspace_permission
                                                    : undefined,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__unset__">
                                            Unset
                                        </SelectItem>
                                        <SelectItem value="personal">
                                            Personal
                                        </SelectItem>
                                        <SelectItem value="organization">
                                            Organization
                                        </SelectItem>
                                        <SelectItem value="workspace">
                                            Workspace
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editingScope.category === "organization" ? (
                                <div>
                                    <p className="mb-2 text-xs text-zinc-500">
                                        Required Organization Permission
                                    </p>
                                    <Select
                                        value={
                                            editingScope.organization_permission ||
                                            "__none__"
                                        }
                                        disabled={isOrganizationPermissionLocked}
                                        onValueChange={(value) =>
                                            setEditingScope({
                                                ...editingScope,
                                                organization_permission:
                                                    value === "__none__"
                                                        ? undefined
                                                        : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="No permission required" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">
                                                No permission required
                                            </SelectItem>
                                            {organizationPermissions.map(
                                                (permission) => (
                                                    <SelectItem
                                                        key={permission}
                                                        value={permission}
                                                    >
                                                        {permission}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            {editingScope.category === "workspace" ? (
                                <div>
                                    <p className="mb-2 text-xs text-zinc-500">
                                        Attach Workspace Permission
                                    </p>
                                    <Select
                                        value={
                                            editingScope.workspace_permission ||
                                            "__none__"
                                        }
                                        disabled={isWorkspacePermissionLocked}
                                        onValueChange={(value) =>
                                            setEditingScope({
                                                ...editingScope,
                                                workspace_permission:
                                                    value === "__none__"
                                                        ? undefined
                                                        : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="No workspace permission attached" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">
                                                No workspace permission attached
                                            </SelectItem>
                                            {workspacePermissions.map(
                                                (permission) => (
                                                    <SelectItem
                                                        key={permission}
                                                        value={permission}
                                                    >
                                                        {permission}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isScopeSavePending}
                            onClick={() => setEditingScope(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={saveScopeEditor}
                            disabled={isScopeSavePending}
                        >
                            {isScopeSavePending ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
