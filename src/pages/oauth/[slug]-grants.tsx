import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { format } from "date-fns";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
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
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
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
      <section>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          OAuth app
        </p>
        <h1 className="mt-1 text-xl font-normal tracking-tight text-foreground">
          OAuth grants
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {oauthApp.name}
          <code className="inline-block rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {oauthApp.slug}
          </code>
        </p>
      </section>

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
              <TableEmptyRow
                colSpan={6}
                title="No OAuth clients"
                description="Create a client before delegating access to resources."
              />
            ) : !selectedClientId ? (
              <TableEmptyRow
                colSpan={6}
                title="Select a client"
                description="Choose an OAuth client above to view its grants."
              />
            ) : grantsLoading ? (
              <SkeletonTableRows rows={8} columns={6} withAvatar={false} />
            ) : grants.length === 0 ? (
              <TableEmptyRow
                colSpan={6}
                icon={
                  <ShieldCheckIcon className="h-6 w-6 text-muted-foreground/50" />
                }
                title="No grants yet"
                description="This client has not been granted access to any resources."
              />
            ) : (
              grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell className="font-mono text-xs">{grant.api_auth_app_slug}</TableCell>
                  <TableCell>{grant.resource}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {grant.scopes.join(", ")}
                  </TableCell>
                  <TableCell>
                    <Pill tone={grant.status === "active" ? "ok" : "mute"}>
                      {grant.status}
                    </Pill>
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
