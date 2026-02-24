import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { format } from "date-fns";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/table";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import {
  useOAuthApps,
  useOAuthClients,
  useOAuthGrants,
  useRevokeOAuthGrant,
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

export default function OAuthAppGrantsPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const oauthAppSlug = slug || "";
  const clientFromQuery = searchParams.get("client") || undefined;

  const [selectedClientId, setSelectedClientId] = useState<string>();

  const { data: oauthApps = [], isLoading: oauthAppsLoading } = useOAuthApps();
  const { data: oauthClients = [], isLoading: oauthClientsLoading } = useOAuthClients(oauthAppSlug);
  const { data: grants = [], isLoading: grantsLoading } = useOAuthGrants(
    oauthAppSlug,
    selectedClientId,
  );
  const revokeGrant = useRevokeOAuthGrant(oauthAppSlug, selectedClientId);

  const oauthApp = useMemo(
    () => oauthApps.find((app) => app.slug === oauthAppSlug),
    [oauthApps, oauthAppSlug],
  );

  const selectedClient = useMemo(
    () => oauthClients.find((client) => client.id === selectedClientId),
    [oauthClients, selectedClientId],
  );

  useEffect(() => {
    if (oauthClients.length === 0) return;

    if (clientFromQuery && oauthClients.some((client) => client.id === clientFromQuery)) {
      setSelectedClientId(clientFromQuery);
      return;
    }

    if (!selectedClientId) {
      setSelectedClientId(oauthClients[0].id);
    }
  }, [oauthClients, selectedClientId, clientFromQuery]);

  useEffect(() => {
    if (!selectedClientId) return;
    if (searchParams.get("client") === selectedClientId) return;

    const next = new URLSearchParams(searchParams);
    next.set("client", selectedClientId);
    setSearchParams(next, { replace: true });
  }, [selectedClientId, searchParams, setSearchParams]);

  if (oauthAppsLoading) return <InlineLoader />;

  if (!oauthApp) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">OAuth app not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-normal">OAuth Grants</h1>
          <p className="text-sm text-zinc-500">{oauthApp.name} ({oauthApp.slug})</p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Delegated grants by client</span>
          </div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[340px]">
              <SelectValue placeholder="Select OAuth client" />
            </SelectTrigger>
            <SelectContent>
              {oauthClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.client_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClient && (
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              Auth: <span className="text-foreground">{formatClientAuthMethodLabel(selectedClient.client_auth_method)}</span>
            </span>
            <span>•</span>
            <span>
              Grants: <span className="text-foreground">{grants.length}</span>
            </span>
          </div>
        )}

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
            {oauthClientsLoading ? (
              <SkeletonTableRows rows={8} columns={6} withAvatar={false} />
            ) : oauthClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  No OAuth clients available
                </TableCell>
              </TableRow>
            ) : !selectedClientId ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  Select OAuth client
                </TableCell>
              </TableRow>
            ) : grantsLoading ? (
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
      </div>
    </div>
  );
}
