import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
    </div>
  );
}
