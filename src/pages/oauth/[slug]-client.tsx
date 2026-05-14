import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import {
  useOAuthApps,
  useOAuthClients,
  useOAuthGrants,
  useRevokeOAuthGrant,
  useRotateOAuthClientSecret,
  useUpdateOAuthClient,
} from "@/lib/api/hooks/use-oauth-management";

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

type ClientMetadataDraft = {
  client_name: string;
  client_uri: string;
  logo_uri: string;
  tos_uri: string;
  policy_uri: string;
  contacts: string;
  software_id: string;
  software_version: string;
};

const emptyClientMetadataDraft: ClientMetadataDraft = {
  client_name: "",
  client_uri: "",
  logo_uri: "",
  tos_uri: "",
  policy_uri: "",
  contacts: "",
  software_id: "",
  software_version: "",
};

function metadataDisplayValue(value?: string | null): string {
  return value?.trim() || "Not set";
}

function splitMetadataList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ClientMetadataItem({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string | null;
}) {
  const displayValue = metadataDisplayValue(value);
  const hasValue = displayValue !== "Not set";

  return (
    <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr] sm:items-start sm:gap-4">
      <p className="text-xs text-zinc-500">{label}</p>
      {hasValue && href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="block break-all font-mono text-xs text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          {displayValue}
        </a>
      ) : (
        <p
          className={`break-all text-sm ${
            hasValue ? "text-zinc-800 dark:text-zinc-100" : "text-muted-foreground"
          }`}
        >
          {displayValue}
        </p>
      )}
    </div>
  );
}

export default function OAuthClientDetailsPage() {
  const { slug, clientId } = useParams();
  const oauthAppSlug = slug || "";
  const oauthClientId = clientId || "";
  const [activeTab, setActiveTab] = useState("configuration");
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  const [isEditRedirectUrisOpen, setIsEditRedirectUrisOpen] = useState(false);
  const [redirectUrisDraft, setRedirectUrisDraft] = useState("");
  const [isEditPostLogoutUrisOpen, setIsEditPostLogoutUrisOpen] = useState(false);
  const [postLogoutUrisDraft, setPostLogoutUrisDraft] = useState("");
  const [isEditMetadataOpen, setIsEditMetadataOpen] = useState(false);
  const [metadataDraft, setMetadataDraft] = useState<ClientMetadataDraft>(
    emptyClientMetadataDraft,
  );
  const [isEditOidcOpen, setIsEditOidcOpen] = useState(false);
  const [oidcDraft, setOidcDraft] = useState({
    access_token_format: "opaque" as "opaque" | "jwt",
    access_token_ttl_seconds: "3600",
    skip_consent: false,
  });

  const { data: oauthApps = [], isLoading: oauthAppsLoading } = useOAuthApps();
  const { data: oauthClients = [], isLoading: oauthClientsLoading } = useOAuthClients(oauthAppSlug);
  const { data: grants = [], isLoading: grantsLoading } = useOAuthGrants(
    oauthAppSlug,
    oauthClientId,
  );
  const revokeGrant = useRevokeOAuthGrant(oauthAppSlug, oauthClientId);
  const rotateSecret = useRotateOAuthClientSecret(oauthAppSlug, oauthClientId);
  const updateOAuthClient = useUpdateOAuthClient(oauthAppSlug, oauthClientId);

  const oauthApp = useMemo(
    () => oauthApps.find((app) => app.slug === oauthAppSlug),
    [oauthApps, oauthAppSlug],
  );
  const oauthClient = useMemo(
    () => oauthClients.find((client) => client.id === oauthClientId),
    [oauthClients, oauthClientId],
  );

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleRotateSecret = async () => {
    try {
      const result = await rotateSecret.mutateAsync();
      setRotatedSecret(result.client_secret);
    } catch {
      // handled in hook
    }
  };

  const handleOpenEditRedirectUris = () => {
    if (!oauthClient) return;
    setRedirectUrisDraft(oauthClient.redirect_uris.join("\n"));
    setIsEditRedirectUrisOpen(true);
  };

  const handleSaveRedirectUris = async () => {
    const redirectUris = redirectUrisDraft
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const deduped = [...new Set(redirectUris)];

    try {
      await updateOAuthClient.mutateAsync({ redirect_uris: deduped });
      setIsEditRedirectUrisOpen(false);
    } catch {
      // handled by hook
    }
  };

  const handleOpenEditMetadata = () => {
    if (!oauthClient) return;
    setMetadataDraft({
      client_name: oauthClient.client_name ?? "",
      client_uri: oauthClient.client_uri ?? "",
      logo_uri: oauthClient.logo_uri ?? "",
      tos_uri: oauthClient.tos_uri ?? "",
      policy_uri: oauthClient.policy_uri ?? "",
      contacts: (oauthClient.contacts ?? []).join("\n"),
      software_id: oauthClient.software_id ?? "",
      software_version: oauthClient.software_version ?? "",
    });
    setIsEditMetadataOpen(true);
  };

  const handleSaveMetadata = async () => {
    try {
      await updateOAuthClient.mutateAsync({
        client_name: metadataDraft.client_name.trim(),
        client_uri: metadataDraft.client_uri.trim(),
        logo_uri: metadataDraft.logo_uri.trim(),
        tos_uri: metadataDraft.tos_uri.trim(),
        policy_uri: metadataDraft.policy_uri.trim(),
        contacts: splitMetadataList(metadataDraft.contacts),
        software_id: metadataDraft.software_id.trim(),
        software_version: metadataDraft.software_version.trim(),
      });
      setIsEditMetadataOpen(false);
    } catch {
      // handled by hook
    }
  };

  const handleOpenEditPostLogoutUris = () => {
    if (!oauthClient) return;
    setPostLogoutUrisDraft(
      (oauthClient.post_logout_redirect_uris ?? []).join("\n"),
    );
    setIsEditPostLogoutUrisOpen(true);
  };

  const handleSavePostLogoutUris = async () => {
    const uris = postLogoutUrisDraft
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const deduped = [...new Set(uris)];

    try {
      await updateOAuthClient.mutateAsync({
        post_logout_redirect_uris: deduped,
      });
      setIsEditPostLogoutUrisOpen(false);
    } catch {
      // handled by hook
    }
  };

  const handleOpenEditOidc = () => {
    if (!oauthClient) return;
    const format = oauthClient.access_token_format === "jwt" ? "jwt" : "opaque";
    setOidcDraft({
      access_token_format: format,
      access_token_ttl_seconds: String(oauthClient.access_token_ttl_seconds ?? 3600),
      skip_consent: !!oauthClient.skip_consent,
    });
    setIsEditOidcOpen(true);
  };

  const handleSaveOidc = async () => {
    const ttl = Number(oidcDraft.access_token_ttl_seconds);
    if (!Number.isFinite(ttl) || ttl < 60 || ttl > 86400) {
      toast.error("Access token TTL must be between 60 and 86400 seconds");
      return;
    }
    try {
      await updateOAuthClient.mutateAsync({
        access_token_format: oidcDraft.access_token_format,
        access_token_ttl_seconds: ttl,
        skip_consent: oidcDraft.skip_consent,
      });
      setIsEditOidcOpen(false);
    } catch {
      // handled by hook
    }
  };

  if (oauthAppsLoading) {
    return <InlineLoader />;
  }

  if (!oauthApp) {
    return <p className="text-sm text-muted-foreground">OAuth app not found.</p>;
  }

  if (oauthClientsLoading) {
    return <InlineLoader />;
  }

  if (!oauthClient) {
    return <p className="text-sm text-muted-foreground">OAuth client not found.</p>;
  }

  const isSecretBased =
    oauthClient.client_auth_method === "client_secret_basic" ||
    oauthClient.client_auth_method === "client_secret_post" ||
    oauthClient.client_auth_method === "client_secret_jwt";

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-wide text-zinc-500">OAuth Client</p>
        <h1 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {oauthClient.client_id}
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          {oauthApp.name} ({oauthApp.slug})
        </p>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="grants">Grants</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-zinc-500">Auth Method</p>
              <p className="mt-1 text-sm">{formatClientAuthMethodLabel(oauthClient.client_auth_method)}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-zinc-500">Grant Types</p>
              <p className="mt-1 text-sm">
                {oauthClient.grant_types.map(formatGrantTypeLabel).join(", ")}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-zinc-500">Created</p>
              <p className="mt-1 text-sm">{format(new Date(oauthClient.created_at), "MMM d, yyyy")}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-zinc-500">Updated</p>
              <p className="mt-1 text-sm">{format(new Date(oauthClient.updated_at), "MMM d, yyyy")}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Client Metadata
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Displayed during consent and exposed through client registration metadata.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenEditMetadata}
              >
                Edit
              </Button>
            </div>
            <div className="divide-y rounded-md border">
              <ClientMetadataItem
                label="Client Name"
                value={oauthClient.client_name}
              />
              <ClientMetadataItem
                label="Logo URI"
                value={oauthClient.logo_uri}
                href={oauthClient.logo_uri}
              />
              <ClientMetadataItem
                label="Client URI"
                value={oauthClient.client_uri}
                href={oauthClient.client_uri}
              />
              <ClientMetadataItem
                label="Terms URI"
                value={oauthClient.tos_uri}
                href={oauthClient.tos_uri}
              />
              <ClientMetadataItem
                label="Privacy Policy URI"
                value={oauthClient.policy_uri}
                href={oauthClient.policy_uri}
              />
              <ClientMetadataItem
                label="Contacts"
                value={(oauthClient.contacts ?? []).join(", ")}
              />
              <ClientMetadataItem
                label="Software ID"
                value={oauthClient.software_id}
              />
              <ClientMetadataItem
                label="Software Version"
                value={oauthClient.software_version}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Redirect URIs</p>
              <Button type="button" variant="outline" size="sm" onClick={handleOpenEditRedirectUris}>
                Edit
              </Button>
            </div>
            <div className="divide-y rounded-md border">
              {oauthClient.redirect_uris.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No redirect URIs configured.</p>
              ) : (
                oauthClient.redirect_uris.map((uri) => (
                  <div key={uri} className="flex items-start justify-between gap-3 p-3">
                    <p className="font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">{uri}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copy("Redirect URI", uri)}
                    >
                      Copy
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Post-Logout Redirect URIs
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  OIDC RP-initiated logout will only redirect to these allowlisted URLs.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenEditPostLogoutUris}
              >
                Edit
              </Button>
            </div>
            <div className="divide-y rounded-md border">
              {!oauthClient.post_logout_redirect_uris ||
              oauthClient.post_logout_redirect_uris.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  None configured. RP-initiated logout will fall back to the hosted logout page.
                </p>
              ) : (
                oauthClient.post_logout_redirect_uris.map((uri) => (
                  <div key={uri} className="flex items-start justify-between gap-3 p-3">
                    <p className="font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                      {uri}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copy("Post-Logout Redirect URI", uri)}
                    >
                      Copy
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  OIDC Settings
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Access token format, TTL, and consent behavior for this client.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenEditOidc}
              >
                Edit
              </Button>
            </div>
            <div className="divide-y rounded-md border">
              <ClientMetadataItem
                label="Access Token Format"
                value={
                  oauthClient.access_token_format === "jwt"
                    ? "JWT (stateless, signed with deployment key)"
                    : "Opaque (default)"
                }
              />
              <ClientMetadataItem
                label="Access Token TTL"
                value={`${oauthClient.access_token_ttl_seconds ?? 3600} seconds`}
              />
              <ClientMetadataItem
                label="Skip Consent Screen"
                value={oauthClient.skip_consent ? "Yes (first-party client)" : "No"}
              />
            </div>
          </div>

          {oauthClient.client_auth_method === "private_key_jwt" ? (
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Key Material</p>
              <div className="mt-3 space-y-2">
                {oauthClient.jwks_uri ? (
                  <div className="rounded-lg border bg-zinc-50/60 p-3 dark:bg-zinc-900/40">
                    <p className="text-xs text-zinc-500">JWKS URI</p>
                    <p className="mt-1 font-mono text-xs break-all text-zinc-800 dark:text-zinc-100">
                      {oauthClient.jwks_uri}
                    </p>
                  </div>
                ) : null}
                {oauthClient.jwks ? (
                  <div className="rounded-lg border bg-zinc-50/60 p-3 dark:bg-zinc-900/40">
                    <p className="text-xs text-zinc-500">JWKS</p>
                    <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">
                      {oauthClient.jwks.keys.length} key(s) registered
                    </p>
                  </div>
                ) : null}
                {oauthClient.public_key_pem ? (
                  <div className="rounded-lg border bg-zinc-50/60 p-3 dark:bg-zinc-900/40">
                    <p className="text-xs text-zinc-500">Public Key PEM</p>
                    <p className="mt-1 font-mono text-xs text-zinc-800 dark:text-zinc-100">
                      Stored
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {isSecretBased ? (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    Client Secret
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    Existing secret cannot be viewed again. Rotate if needed.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={handleRotateSecret} disabled={rotateSecret.isPending}>
                  {rotateSecret.isPending ? "Rotating..." : "Rotate Secret"}
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="grants" className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Client Grants</p>
            <Badge variant="outline">{grants.length} total</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identity</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grantsLoading ? (
                <SkeletonTableRows rows={8} columns={6} withAvatar={false} />
              ) : grants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    No grants found for this client
                  </TableCell>
                </TableRow>
              ) : (
                grants.map((grant) => (
                  <TableRow key={grant.id}>
                    <TableCell className="font-mono text-xs">{grant.api_auth_app_slug}</TableCell>
                    <TableCell>{grant.resource}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {grant.scopes.join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{grant.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(grant.granted_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={grant.status !== "active" || revokeGrant.isPending}
                        onClick={() => revokeGrant.mutate(grant.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rotatedSecret} onOpenChange={(open) => !open && setRotatedSecret(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Secret Rotated</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 rounded border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-900">New Client Secret (shown once)</p>
            <p className="font-mono text-xs break-all text-amber-900">{rotatedSecret}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => rotatedSecret && copy("Client secret", rotatedSecret)}
            >
              Copy Secret
            </Button>
            <Button onClick={() => setRotatedSecret(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditMetadataOpen} onOpenChange={setIsEditMetadataOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Client Metadata</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Client Name</p>
              <Input
                value={metadataDraft.client_name}
                onChange={(e) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    client_name: e.target.value,
                  }))
                }
                placeholder="Acme Dashboard"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Logo URI</p>
              <Input
                value={metadataDraft.logo_uri}
                onChange={(e) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    logo_uri: e.target.value,
                  }))
                }
                placeholder="https://app.example.com/logo.png"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Client URI</p>
              <Input
                value={metadataDraft.client_uri}
                onChange={(e) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    client_uri: e.target.value,
                  }))
                }
                placeholder="https://app.example.com"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Terms URI</p>
                <Input
                  value={metadataDraft.tos_uri}
                  onChange={(e) =>
                    setMetadataDraft((draft) => ({
                      ...draft,
                      tos_uri: e.target.value,
                    }))
                  }
                  placeholder="https://app.example.com/terms"
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Privacy Policy URI
                </p>
                <Input
                  value={metadataDraft.policy_uri}
                  onChange={(e) =>
                    setMetadataDraft((draft) => ({
                      ...draft,
                      policy_uri: e.target.value,
                    }))
                  }
                  placeholder="https://app.example.com/privacy"
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Contacts</p>
              <Textarea
                value={metadataDraft.contacts}
                onChange={(e) =>
                  setMetadataDraft((draft) => ({
                    ...draft,
                    contacts: e.target.value,
                  }))
                }
                rows={3}
                placeholder="security@example.com"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Software ID</p>
                <Input
                  value={metadataDraft.software_id}
                  onChange={(e) =>
                    setMetadataDraft((draft) => ({
                      ...draft,
                      software_id: e.target.value,
                    }))
                  }
                  placeholder="com.example.app"
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Software Version
                </p>
                <Input
                  value={metadataDraft.software_version}
                  onChange={(e) =>
                    setMetadataDraft((draft) => ({
                      ...draft,
                      software_version: e.target.value,
                    }))
                  }
                  placeholder="1.0.0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditMetadataOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveMetadata}
              disabled={updateOAuthClient.isPending}
            >
              {updateOAuthClient.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRedirectUrisOpen} onOpenChange={setIsEditRedirectUrisOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Redirect URIs</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">One URI per line.</p>
            <Textarea
              value={redirectUrisDraft}
              onChange={(e) => setRedirectUrisDraft(e.target.value)}
              rows={8}
              placeholder="https://app.example.com/callback"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditRedirectUrisOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveRedirectUris}
              disabled={updateOAuthClient.isPending}
            >
              {updateOAuthClient.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditPostLogoutUrisOpen}
        onOpenChange={setIsEditPostLogoutUrisOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post-Logout Redirect URIs</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              One URI per line. RPs sending a user through `/oauth/logout` can
              only redirect back to entries in this list.
            </p>
            <Textarea
              value={postLogoutUrisDraft}
              onChange={(e) => setPostLogoutUrisDraft(e.target.value)}
              rows={8}
              placeholder="https://app.example.com/signed-out"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditPostLogoutUrisOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePostLogoutUris}
              disabled={updateOAuthClient.isPending}
            >
              {updateOAuthClient.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOidcOpen} onOpenChange={setIsEditOidcOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit OIDC Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Access Token Format</Label>
              <Select
                value={oidcDraft.access_token_format}
                onValueChange={(value) =>
                  setOidcDraft((draft) => ({
                    ...draft,
                    access_token_format: value === "jwt" ? "jwt" : "opaque",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opaque">
                    Opaque (verified via /oauth/introspect)
                  </SelectItem>
                  <SelectItem value="jwt">
                    JWT (stateless, verify locally via JWKS)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                JWT mode lets RPs verify access tokens without calling the
                gateway. Tokens are signed with the same key as id_tokens.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Access Token TTL (seconds)</Label>
              <Input
                type="number"
                min={60}
                max={86400}
                value={oidcDraft.access_token_ttl_seconds}
                onChange={(e) =>
                  setOidcDraft((draft) => ({
                    ...draft,
                    access_token_ttl_seconds: e.target.value,
                  }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Between 60 and 86400 seconds. Default 3600.
              </p>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div>
                <Label className="text-sm">Skip Consent Screen</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  First-party / trusted clients only. Bypasses the user-facing
                  consent prompt on every authorize request.
                </p>
              </div>
              <Switch
                checked={oidcDraft.skip_consent}
                onCheckedChange={(checked) =>
                  setOidcDraft((draft) => ({ ...draft, skip_consent: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOidcOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveOidc}
              disabled={updateOAuthClient.isPending}
            >
              {updateOAuthClient.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
