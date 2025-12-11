import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useOrganizationConnections,
  useCreateEnterpriseConnection,
  useUpdateEnterpriseConnection,
  useDeleteEnterpriseConnection,
  useOrganizationDomains,
  useSCIMToken,
  useGenerateSCIMToken,
  useRevokeSCIMToken,
  EnterpriseConnection,
} from "@/lib/api/hooks/use-organization-sso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription, AlertActions } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  PencilIcon,
  TrashIcon,
  KeyIcon,
  LockClosedIcon,
  ClipboardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const connectionSchema = z.object({
  protocol: z.enum(["saml", "oidc"]),
  domain_id: z.string().optional(),
  // SAML fields
  idp_entity_id: z.string().optional(),
  idp_sso_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  idp_certificate: z.string().optional(),
  // OIDC fields
  oidc_issuer_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  oidc_client_id: z.string().optional(),
  oidc_client_secret: z.string().optional(),
  oidc_scopes: z.string().optional(),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

interface ConnectionSetupProps {
  organizationId: string;
}

// SCIM Section Component
function SCIMSection({ organizationId, connectionId }: { organizationId: string; connectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const { data: scimToken, isLoading } = useSCIMToken(organizationId, connectionId);
  const generateToken = useGenerateSCIMToken();
  const revokeToken = useRevokeSCIMToken();

  const handleGenerate = async () => {
    try {
      const result = await generateToken.mutateAsync({ organizationId, connectionId });
      if (result.token?.token) {
        setGeneratedToken(result.token.token);
        toast.success("SCIM token generated. Copy it now - it won't be shown again!");
      }
    } catch {
      toast.error("Failed to generate SCIM token");
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeToken.mutateAsync({ organizationId, connectionId });
      setGeneratedToken(null);
      setShowRevokeConfirm(false);
      toast.success("SCIM token revoked");
    } catch {
      toast.error("Failed to revoke SCIM token");
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          SCIM Provisioning
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {isLoading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                {/* SCIM Base URL */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500">SCIM Base URL</label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded flex-1 truncate">
                      {scimToken?.scim_base_url || "Loading..."}
                    </code>
                    <Button
                      plain
                      className="p-1"
                      onClick={() => handleCopy(scimToken?.scim_base_url || "")}
                    >
                      <ClipboardIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Token Status */}
                {generatedToken ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-green-600">New Token (copy now!)</label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded flex-1 truncate">
                        {generatedToken}
                      </code>
                      <Button
                        plain
                        className="p-1 text-green-600"
                        onClick={() => handleCopy(generatedToken)}
                      >
                        <ClipboardIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-amber-600">⚠️ This token will not be shown again</p>
                  </div>
                ) : scimToken?.exists && scimToken?.token?.enabled ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500">Token</label>
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-mono">{scimToken.token.token_prefix}...</span>
                      {scimToken.token.last_used_at && (
                        <span className="text-zinc-400">
                          Last used: {new Date(scimToken.token.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={generateToken.isPending}
                    className="text-xs"
                  >
                    {generateToken.isPending ? <Spinner className="h-3 w-3" /> : (scimToken?.exists ? "Rotate Token" : "Generate Token")}
                  </Button>
                  {scimToken?.exists && scimToken?.token?.enabled && (
                    <Button
                      plain
                      onClick={() => setShowRevokeConfirm(true)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Revoke
                    </Button>
                  )}
                </div>

                {copied && <p className="text-xs text-green-600">Copied to clipboard!</p>}
              </>
            )}
          </div>
        )}
      </div>

      {/* Revoke Confirmation Dialog */}
      <Alert open={showRevokeConfirm} onClose={() => setShowRevokeConfirm(false)}>
        <AlertTitle>Revoke SCIM Token</AlertTitle>
        <AlertDescription>
          Are you sure you want to revoke this SCIM token? Any IdP using this token will lose access immediately.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
          <Button color="red" onClick={handleRevoke} disabled={revokeToken.isPending}>
            {revokeToken.isPending ? <Spinner className="h-4 w-4" /> : "Revoke Token"}
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}


export function ConnectionSetup({ organizationId }: ConnectionSetupProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<EnterpriseConnection | null>(null);
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);

  const { data: connections, isLoading: connectionsLoading } =
    useOrganizationConnections(organizationId);
  const { data: domains } = useOrganizationDomains(organizationId);

  const createConnection = useCreateEnterpriseConnection();
  const updateConnection = useUpdateEnterpriseConnection();
  const deleteConnection = useDeleteEnterpriseConnection();

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      protocol: "saml",
    },
  });

  const onSubmit = async (data: ConnectionFormValues) => {
    try {
      if (editingConnection) {
        await updateConnection.mutateAsync({
          organizationId,
          connectionId: editingConnection.id,
          data: {
            // SAML fields
            idp_entity_id: data.idp_entity_id,
            idp_sso_url: data.idp_sso_url,
            idp_certificate: data.idp_certificate,
            // OIDC fields
            oidc_issuer_url: data.oidc_issuer_url,
            oidc_client_id: data.oidc_client_id,
            oidc_client_secret: data.oidc_client_secret || undefined, // Don't send empty string
            oidc_scopes: data.oidc_scopes,
          },
        });
        toast.success("Connection updated successfully");
      } else {
        await createConnection.mutateAsync({
          organizationId,
          data: {
            protocol: data.protocol,
            domain_id: data.domain_id === "none" ? undefined : data.domain_id,
            // SAML fields
            idp_entity_id: data.idp_entity_id,
            idp_sso_url: data.idp_sso_url,
            idp_certificate: data.idp_certificate,
            // OIDC fields
            oidc_issuer_url: data.oidc_issuer_url,
            oidc_client_id: data.oidc_client_id,
            oidc_client_secret: data.oidc_client_secret,
            oidc_scopes: data.oidc_scopes,
          },
        });
        toast.success("Connection created successfully");
      }
      setIsDialogOpen(false);
      setEditingConnection(null);
      form.reset();
    } catch (error) {
      toast.error(
        editingConnection
          ? "Failed to update connection"
          : "Failed to create connection",
      );
    }
  };

  const handleEdit = (connection: EnterpriseConnection) => {
    setEditingConnection(connection);
    form.reset({
      protocol: connection.protocol,
      domain_id: connection.domain_id ? String(connection.domain_id) : "none",
      // SAML fields
      idp_entity_id: connection.idp_entity_id,
      idp_sso_url: connection.idp_sso_url,
      idp_certificate: connection.idp_certificate,
      // OIDC fields
      oidc_issuer_url: connection.oidc_issuer_url || "",
      oidc_client_id: connection.oidc_client_id || "",
      oidc_client_secret: "", // Don't populate secret for security
      oidc_scopes: connection.oidc_scopes || "openid profile email",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingConnectionId) return;
    try {
      await deleteConnection.mutateAsync({ organizationId, connectionId: deletingConnectionId });
      setDeletingConnectionId(null);
      toast.success("Connection deleted successfully");
    } catch (error) {
      toast.error("Failed to delete connection");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingConnection(null);
      form.reset();
    }
  };

  if (connectionsLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Identity Providers
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Configure SSO connections for your organization.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>Add Connection</Button>

        <Dialog open={isDialogOpen} onClose={handleOpenChange} size="2xl">
          <DialogTitle>
            {editingConnection ? "Edit Connection" : "Add New Connection"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-zinc-500 dark:text-zinc-400">
            Configure your Identity Provider (IdP) settings for SAML or OIDC authentication.
            {editingConnection ? " Update the details below." : " Select a protocol and verify your domain first."}
          </DialogDescription>
          <DialogBody className="mt-6">
            <form
              id="connection-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Protocol
                    </label>
                    <Select
                      disabled={!!editingConnection}
                      name="protocol"
                      value={form.watch("protocol")}
                      onChange={(e) =>
                        form.setValue(
                          "protocol",
                          e.target.value as "saml" | "oidc",
                        )
                      }
                      className="dark:bg-zinc-800"
                    >
                      <option value="saml">SAML 2.0</option>
                      <option value="oidc">OpenID Connect</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Domain (Optional)
                    </label>
                    <Select
                      disabled={!!editingConnection}
                      name="domain_id"
                      value={form.watch("domain_id")}
                      onChange={(e) => form.setValue("domain_id", e.target.value)}
                      className="dark:bg-zinc-800"
                    >
                      <option value="none">Select a verified domain...</option>
                      {domains
                        ?.filter((d) => d.verified)
                        .map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {domain.fqdn}
                          </option>
                        ))}
                    </Select>
                  </div>
                </div>

                {domains?.filter((d) => d.verified).length === 0 &&
                  !editingConnection && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900/50">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-amber-600 dark:text-amber-500 text-lg">⚠️</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">No verified domains</h3>
                          <div className="mt-1 text-sm text-amber-700 dark:text-amber-500/90">
                            <p>You need to verify a domain before you can link it to this connection.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-500 uppercase tracking-wider">
                    Configuration
                  </span>
                </div>
              </div>

              {form.watch("protocol") === "saml" ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      IdP Entity ID (Issuer)
                    </label>
                    <Input
                      {...form.register("idp_entity_id")}
                      placeholder="https://idp.example.com/metadata"
                      className="dark:bg-zinc-800/50"
                    />
                    <p className="text-xs text-zinc-500">The unique identifier for your Identity Provider.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      IdP SSO URL
                    </label>
                    <Input
                      {...form.register("idp_sso_url")}
                      placeholder="https://idp.example.com/sso"
                      className="dark:bg-zinc-800/50"
                    />
                    {form.formState.errors.idp_sso_url && (
                      <p className="text-sm text-red-500">{form.formState.errors.idp_sso_url.message}</p>
                    )}
                    <p className="text-xs text-zinc-500">The endpoint where we'll redirect users to sign in.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      X.509 Certificate
                    </label>
                    <Textarea
                      {...form.register("idp_certificate")}
                      placeholder="-----BEGIN CERTIFICATE-----..."
                      className="font-mono text-xs h-32 dark:bg-zinc-800/50"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Paste the entire PEM-encoded certificate, including headers.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Issuer URL
                    </label>
                    <Input
                      {...form.register("oidc_issuer_url")}
                      placeholder="https://login.example.com"
                      className="dark:bg-zinc-800/50"
                    />
                    {form.formState.errors.oidc_issuer_url && (
                      <p className="text-sm text-red-500">{form.formState.errors.oidc_issuer_url.message}</p>
                    )}
                    <p className="text-xs text-zinc-500">The base URL of your OIDC provider (e.g., https://login.example.com).</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Client ID
                    </label>
                    <Input
                      {...form.register("oidc_client_id")}
                      placeholder="your-client-id"
                      className="dark:bg-zinc-800/50"
                    />
                    <p className="text-xs text-zinc-500">The OAuth 2.0 client ID for your application.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Client Secret
                    </label>
                    <Input
                      {...form.register("oidc_client_secret")}
                      type="password"
                      placeholder="Enter client secret"
                      className="dark:bg-zinc-800/50"
                    />
                    <p className="text-xs text-zinc-500">
                      {editingConnection ? "Leave blank to keep existing secret." : "The OAuth 2.0 client secret."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Scopes
                    </label>
                    <Input
                      {...form.register("oidc_scopes")}
                      placeholder="openid profile email"
                      className="dark:bg-zinc-800/50"
                    />
                    <p className="text-xs text-zinc-500">Space-separated list of OAuth scopes to request.</p>
                  </div>
                </div>
              )}
            </form>
          </DialogBody>
          <DialogActions className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button plain onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="connection-form"
              disabled={
                createConnection.isPending || updateConnection.isPending
              }
            >
              {createConnection.isPending || updateConnection.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                "Save Connection"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      {connections?.length === 0 ? (
        <EmptyState
          title="No connections configured"
          description="Add an Identity Provider to enable SSO."
          icon={<KeyIcon className="h-12 w-12 text-zinc-400" />}
        />
      ) : (
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-zinc-200 dark:divide-zinc-800">
            {connections?.map((connection) => (
              <li
                key={connection.id}
                className="py-5 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <LockClosedIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {connection.protocol.toUpperCase()} Connection
                          </h4>
                          {connection.domain_id ? (
                            <Badge color="blue" className="px-1.5 py-0 text-[10px]">
                              {domains?.find(
                                (d) => d.id === String(connection.domain_id),
                              )?.fqdn || "Unknown Domain"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-500">Unlinked</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Entity ID:</span>
                            <span className="font-mono truncate max-w-[200px]">{connection.idp_entity_id || "Not set"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">SSO URL:</span>
                            <span className="font-mono truncate max-w-[200px]">{connection.idp_sso_url || "Not set"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      plain
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      onClick={() => handleEdit(connection)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      plain
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      onClick={() => setDeletingConnectionId(connection.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <SCIMSection organizationId={organizationId} connectionId={connection.id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete Connection Confirmation */}
      <Alert open={!!deletingConnectionId} onClose={() => setDeletingConnectionId(null)}>
        <AlertTitle>Delete Connection</AlertTitle>
        <AlertDescription>
          Are you sure you want to delete this connection? This action cannot be undone.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setDeletingConnectionId(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} disabled={deleteConnection.isPending}>
            {deleteConnection.isPending ? <Spinner className="h-4 w-4" /> : "Delete"}
          </Button>
        </AlertActions>
      </Alert>
    </div>
  );
}
