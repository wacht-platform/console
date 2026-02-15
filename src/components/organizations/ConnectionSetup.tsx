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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { InlineLoader } from "@/components/ui/loading-screen";
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
  idp_entity_id: z.string().optional(),
  idp_sso_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  idp_certificate: z.string().optional(),
  oidc_issuer_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  oidc_client_id: z.string().optional(),
  oidc_client_secret: z.string().optional(),
  oidc_scopes: z.string().optional(),
  jit_enabled: z.boolean().optional(),
  attr_first_name: z.string().optional(),
  attr_last_name: z.string().optional(),
  attr_email: z.string().optional(),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

// IdP Templates for quick configuration
interface IdPTemplate {
  id: string;
  name: string;
  logo: string;
  protocol: "saml" | "oidc";
  description: string;
  docUrl: string;
  placeholders: {
    issuerUrl?: string;
    ssoUrl?: string;
    entityId?: string;
    scopes?: string;
  };
}

const IDP_TEMPLATES: IdPTemplate[] = [
  {
    id: "okta",
    name: "Okta",
    logo: "https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png",
    protocol: "saml",
    description: "Enterprise identity management",
    docUrl: "https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_saml.htm",
    placeholders: {
      entityId: "http://www.okta.com/{yourOktaDomain}",
      ssoUrl: "https://{yourOktaDomain}.okta.com/app/{appName}/{appId}/sso/saml",
    },
  },
  {
    id: "azure",
    name: "Azure AD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/150px-Microsoft_Azure.svg.png",
    protocol: "saml",
    description: "Microsoft Entra ID",
    docUrl: "https://learn.microsoft.com/en-us/azure/active-directory/manage-apps/add-application-portal-setup-sso",
    placeholders: {
      entityId: "https://sts.windows.net/{tenantId}/",
      ssoUrl: "https://login.microsoftonline.com/{tenantId}/saml2",
    },
  },
  {
    id: "google",
    name: "Google Workspace",
    logo: "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png",
    protocol: "saml",
    description: "Google Cloud Identity",
    docUrl: "https://support.google.com/a/answer/6087519",
    placeholders: {
      entityId: "https://accounts.google.com/o/saml2?idpid={idpId}",
      ssoUrl: "https://accounts.google.com/o/saml2/idp?idpid={idpId}",
    },
  },
  {
    id: "okta-oidc",
    name: "Okta",
    logo: "https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png",
    protocol: "oidc",
    description: "OpenID Connect",
    docUrl: "https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/",
    placeholders: {
      issuerUrl: "https://{yourOktaDomain}.okta.com",
      scopes: "openid profile email",
    },
  },
  {
    id: "azure-oidc",
    name: "Azure AD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/150px-Microsoft_Azure.svg.png",
    protocol: "oidc",
    description: "Microsoft Entra ID (OIDC)",
    docUrl: "https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc",
    placeholders: {
      issuerUrl: "https://login.microsoftonline.com/{tenantId}/v2.0",
      scopes: "openid profile email",
    },
  },
  {
    id: "google-oidc",
    name: "Google Workspace",
    logo: "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png",
    protocol: "oidc",
    description: "Google Cloud OIDC",
    docUrl: "https://developers.google.com/identity/openid-connect/openid-connect",
    placeholders: {
      issuerUrl: "https://accounts.google.com",
      scopes: "openid profile email",
    },
  },
  {
    id: "auth0",
    name: "Auth0",
    logo: "https://cdn.auth0.com/styleguide/latest/lib/logos/img/badge.png",
    protocol: "oidc",
    description: "Identity platform",
    docUrl: "https://auth0.com/docs/authenticate/protocols/openid-connect-protocol",
    placeholders: {
      issuerUrl: "https://{yourDomain}.auth0.com/",
      scopes: "openid profile email",
    },
  },
  {
    id: "onelogin",
    name: "OneLogin",
    logo: "https://cdn.onelogin.com/images/icons/onelogin-icon.svg",
    protocol: "saml",
    description: "Identity & access management",
    docUrl: "https://onelogin.service-now.com/support?id=kb_article&sys_id=912bb23adbdc1cd0ca1c400e0b96197d",
    placeholders: {
      entityId: "https://app.onelogin.com/saml/metadata/{appId}",
      ssoUrl: "https://{subdomain}.onelogin.com/trust/saml2/http-post/sso/{appId}",
    },
  },
  {
    id: "ping",
    name: "PingOne",
    logo: "https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav/ping-logo.svg",
    protocol: "saml",
    description: "Ping Identity",
    docUrl: "https://docs.pingidentity.com/pingone/latest/connector/configure-saml.html",
    placeholders: {
      entityId: "https://auth.pingone.com/{environmentId}",
      ssoUrl: "https://auth.pingone.com/{environmentId}/saml20/idp/sso",
    },
  },
];

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
              <InlineLoader />
            ) : (
              <>
                {/* SCIM Base URL */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500">SCIM Base URL</label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded flex-1 truncate">
                      {scimToken?.scim_base_url || "—"}
                    </code>
                    <Button
                      variant="ghost"
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
                        variant="ghost"
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
                      variant="ghost"
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
      <Dialog open={showRevokeConfirm} onOpenChange={(val) => !val && setShowRevokeConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke SCIM Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this SCIM token? Any IdP using this token will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revokeToken.isPending}>
              {revokeToken.isPending ? <Spinner className="h-4 w-4" /> : "Revoke Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


export function ConnectionSetup({ organizationId }: ConnectionSetupProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<EnterpriseConnection | null>(null);
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<IdPTemplate | null>(null);

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
      jit_enabled: true,
    },
  });

  const selectTemplate = (template: IdPTemplate) => {
    setSelectedTemplate(template);
    form.setValue("protocol", template.protocol);
    if (template.protocol === "saml") {
      form.setValue("idp_entity_id", template.placeholders.entityId || "");
      form.setValue("idp_sso_url", template.placeholders.ssoUrl || "");
    } else {
      form.setValue("oidc_issuer_url", template.placeholders.issuerUrl || "");
      form.setValue("oidc_scopes", template.placeholders.scopes || "openid profile email");
    }
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    form.reset();
  };

  const onSubmit = async (data: ConnectionFormValues) => {
    try {
      const attributeMapping: Record<string, string> = {};
      if (data.attr_first_name) attributeMapping.first_name = data.attr_first_name;
      if (data.attr_last_name) attributeMapping.last_name = data.attr_last_name;
      if (data.attr_email) attributeMapping.email = data.attr_email;
      const hasAttributeMapping = Object.keys(attributeMapping).length > 0;

      if (editingConnection) {
        await updateConnection.mutateAsync({
          organizationId,
          connectionId: editingConnection.id,
          data: {
            idp_entity_id: data.idp_entity_id,
            idp_sso_url: data.idp_sso_url,
            idp_certificate: data.idp_certificate,
            oidc_issuer_url: data.oidc_issuer_url,
            oidc_client_id: data.oidc_client_id,
            oidc_client_secret: data.oidc_client_secret || undefined,
            oidc_scopes: data.oidc_scopes,
            jit_enabled: data.jit_enabled ?? true,
            ...(hasAttributeMapping && { attribute_mapping: attributeMapping }),
          },
        });
        toast.success("Connection updated successfully");
      } else {
        await createConnection.mutateAsync({
          organizationId,
          data: {
            protocol: data.protocol,
            domain_id: data.domain_id === "none" ? undefined : data.domain_id,
            idp_entity_id: data.idp_entity_id,
            idp_sso_url: data.idp_sso_url,
            idp_certificate: data.idp_certificate,
            oidc_issuer_url: data.oidc_issuer_url,
            oidc_client_id: data.oidc_client_id,
            oidc_client_secret: data.oidc_client_secret,
            oidc_scopes: data.oidc_scopes,
            jit_enabled: data.jit_enabled ?? true,
            ...(hasAttributeMapping && { attribute_mapping: attributeMapping }),
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
      idp_entity_id: connection.idp_entity_id,
      idp_sso_url: connection.idp_sso_url,
      idp_certificate: connection.idp_certificate,
      oidc_issuer_url: connection.oidc_issuer_url || "",
      oidc_client_id: connection.oidc_client_id || "",
      oidc_client_secret: "",
      oidc_scopes: connection.oidc_scopes || "openid profile email",
      jit_enabled: connection.jit_enabled ?? true,
      attr_first_name: connection.attribute_mapping?.first_name || "",
      attr_last_name: connection.attribute_mapping?.last_name || "",
      attr_email: connection.attribute_mapping?.email || "",
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
      setSelectedTemplate(null);
      form.reset();
    }
  };

  if (connectionsLoading) {
    return <InlineLoader />;
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

        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? "Edit Connection" : "Add New Connection"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-zinc-500 dark:text-zinc-400">
                Configure your Identity Provider (IdP) settings for SAML or OIDC authentication.
                {editingConnection ? " Update the details below." : " Select a protocol and verify your domain first."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <form
                id="connection-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* IdP Template Selector - only shown when creating new connection */}
                {!editingConnection && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Choose Identity Provider
                      </label>
                      {selectedTemplate && (
                        <button
                          type="button"
                          onClick={clearTemplate}
                          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {IDP_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => selectTemplate(template)}
                          className={`
                            relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all
                            hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20
                            ${selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                              : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50'
                            }
                          `}
                        >
                          <img
                            src={template.logo}
                            alt={template.name}
                            className="h-6 w-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <span className="hidden text-lg font-bold text-zinc-600 dark:text-zinc-400">
                            {template.name.charAt(0)}
                          </span>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
                            {template.name}
                          </span>
                          <span className={`
                            text-xs font-medium px-1.5 py-0.5 rounded uppercase tracking-wide
                            ${template.protocol === 'saml'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }
                          `}>
                            {template.protocol}
                          </span>
                          {selectedTemplate?.id === template.id && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedTemplate && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          📚 <a href={selectedTemplate.docUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                            View {selectedTemplate.name} setup documentation
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-500 uppercase tracking-wider">
                      {selectedTemplate ? `${selectedTemplate.name} Configuration` : 'Manual Configuration'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-4">
                    {/* Only show Protocol dropdown when no template selected */}
                    {!selectedTemplate && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Protocol
                        </label>
                        <Select
                          disabled={!editingConnection}
                          value={form.watch("protocol")}
                          onValueChange={(value) => form.setValue("protocol", value as "saml" | "oidc")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select protocol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saml">SAML 2.0</SelectItem>
                            <SelectItem value="oidc">OIDC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Template
                        </label>
                        <Select
                          disabled={!editingConnection}
                          value={selectedTemplate?.name}
                          onValueChange={(value) => {
                            const template = IDP_TEMPLATES.find(t => t.name === value);
                            if (template) selectTemplate(template);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a template (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {IDP_TEMPLATES.map((t) => (
                              <SelectItem key={t.name} value={t.name}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
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
                          className="text-xs h-32 dark:bg-zinc-800/50"
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

                  {/* JIT Provisioning Toggle */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...form.register("jit_enabled")}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span className="font-medium text-sm">Enable JIT Provisioning</span>
                    </label>
                    <p className="text-xs text-zinc-500 mt-1 ml-7">
                      When enabled, new users are automatically created on their first SSO login.
                    </p>
                  </div>

                  {/* Attribute Mapping (Collapsible) */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <details className="group">
                      <summary className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                        Advanced: Attribute Mapping
                      </summary>
                      <div className="mt-4 space-y-4 pl-0.5">
                        <p className="text-xs text-zinc-500">
                          Map IdP attribute names to Wacht user fields. Leave empty to use defaults.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              First Name
                            </label>
                            <Input
                              {...form.register("attr_first_name")}
                              placeholder={form.watch("protocol") === "saml" ? "givenName" : "given_name"}
                              className="dark:bg-zinc-800/50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Last Name
                            </label>
                            <Input
                              {...form.register("attr_last_name")}
                              placeholder={form.watch("protocol") === "saml" ? "surname" : "family_name"}
                              className="dark:bg-zinc-800/50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Email
                            </label>
                            <Input
                              {...form.register("attr_email")}
                              placeholder="email"
                              className="dark:bg-zinc-800/50"
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </form>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
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
            </DialogFooter>
          </DialogContent>
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
                          <h4 className="text-sm font-normal text-zinc-900 dark:text-zinc-100">
                            {connection.protocol.toUpperCase()} Connection
                          </h4>
                          {connection.domain_id ? (
                            <Badge color="blue" className="px-1.5 py-0 text-xs">
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
                            <span className="truncate max-w-[200px]">{connection.idp_entity_id || "Not set"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">SSO URL:</span>
                            <span className="truncate max-w-[200px]">{connection.idp_sso_url || "Not set"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      onClick={() => handleEdit(connection)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
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
      <Dialog open={!!deletingConnectionId} onOpenChange={(val) => !val && setDeletingConnectionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this connection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingConnectionId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteConnection.isPending}>
              {deleteConnection.isPending ? <Spinner className="h-4 w-4" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
