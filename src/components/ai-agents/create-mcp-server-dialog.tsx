import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  useCreateMcpServer,
  useDiscoverMcpServerAuth,
  useUpdateMcpServer,
} from "@/lib/api/hooks/use-mcp-servers";
import type { McpServer, McpServerConfig } from "@/types/mcp-server";

type AuthMode =
  | "none"
  | "token"
  | "oauth_client_credentials"
  | "oauth_authorization_code_public_pkce"
  | "oauth_authorization_code_confidential_pkce";

interface Props {
  open: boolean;
  onClose: () => void;
  mcpServer?: McpServer;
}

interface FormData {
  name: string;
  endpoint: string;
  authMode: AuthMode;
  authToken: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  registerUrl: string;
  tokenUrl: string;
  scopes: string;
  resource: string;
}

const defaultFormData: FormData = {
  name: "",
  endpoint: "",
  authMode: "none",
  authToken: "",
  clientId: "",
  clientSecret: "",
  authUrl: "",
  registerUrl: "",
  tokenUrl: "",
  scopes: "",
  resource: "",
};

function buildConfig(formData: FormData): McpServerConfig {
  const baseConfig: McpServerConfig = {
    endpoint: formData.endpoint,
  };

  if (formData.authMode === "token" && formData.authToken.trim() !== "") {
    baseConfig.auth = {
      type: "token",
      auth_token: formData.authToken,
    };
  }

  if (formData.authMode === "oauth_client_credentials") {
    baseConfig.auth = {
      type: "oauth_client_credentials",
      client_id: formData.clientId.trim(),
      client_secret: formData.clientSecret.trim(),
      token_url: formData.tokenUrl || undefined,
      scopes: formData.scopes
        ? formData.scopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean)
        : undefined,
    };
  }

  if (formData.authMode === "oauth_authorization_code_public_pkce") {
    baseConfig.auth = {
      type: "oauth_authorization_code_public_pkce",
      client_id: formData.clientId || undefined,
      auth_url: formData.authUrl || undefined,
      token_url: formData.tokenUrl || undefined,
      register_url: formData.registerUrl || undefined,
      scopes: formData.scopes
        ? formData.scopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean)
        : undefined,
      resource: formData.resource || undefined,
    };
  }

  if (formData.authMode === "oauth_authorization_code_confidential_pkce") {
    baseConfig.auth = {
      type: "oauth_authorization_code_confidential_pkce",
      client_id: formData.clientId.trim(),
      client_secret: formData.clientSecret.trim(),
      auth_url: formData.authUrl || undefined,
      token_url: formData.tokenUrl || undefined,
      scopes: formData.scopes
        ? formData.scopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean)
        : undefined,
      resource: formData.resource || undefined,
    };
  }

  return baseConfig;
}

export function CreateMcpServerDialog({ open, onClose, mcpServer }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const createMutation = useCreateMcpServer();
  const updateMutation = useUpdateMcpServer();
  const discoverAuthMutation = useDiscoverMcpServerAuth();
  const isEditing = !!mcpServer;
  const [discoveryMessage, setDiscoveryMessage] = useState<string>("");

  useEffect(() => {
    if (!mcpServer) {
      setFormData(defaultFormData);
      setDiscoveryMessage("");
      return;
    }

    const auth = mcpServer.config.auth;
    const authMode: AuthMode = auth?.type ?? "none";
    setFormData({
      name: mcpServer.name,
      endpoint: mcpServer.config.endpoint,
      authMode,
      authToken: auth?.type === "token" ? auth.auth_token : "",
      clientId:
        auth?.type === "oauth_client_credentials" ||
        auth?.type === "oauth_authorization_code_confidential_pkce" ||
        auth?.type === "oauth_authorization_code_public_pkce"
          ? (auth.client_id ?? "")
          : "",
      clientSecret:
        auth?.type === "oauth_client_credentials" ||
        auth?.type === "oauth_authorization_code_confidential_pkce"
          ? auth.client_secret
          : "",
      authUrl:
        auth?.type === "oauth_authorization_code_confidential_pkce" ||
        auth?.type === "oauth_authorization_code_public_pkce"
          ? auth.auth_url || ""
          : "",
      registerUrl:
        auth?.type === "oauth_authorization_code_public_pkce"
          ? auth.register_url || ""
          : "",
      tokenUrl:
        auth?.type === "oauth_client_credentials" ||
        auth?.type === "oauth_authorization_code_confidential_pkce" ||
        auth?.type === "oauth_authorization_code_public_pkce"
          ? auth.token_url || ""
          : "",
      scopes:
        (auth?.type === "oauth_client_credentials" ||
          auth?.type === "oauth_authorization_code_confidential_pkce" ||
          auth?.type === "oauth_authorization_code_public_pkce") &&
        auth.scopes
          ? auth.scopes.join(", ")
          : "",
      resource:
        auth?.type === "oauth_authorization_code_confidential_pkce" ||
        auth?.type === "oauth_authorization_code_public_pkce"
          ? auth.resource || ""
          : "",
    });
    setDiscoveryMessage("");
  }, [mcpServer, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (formData.authMode === "none") {
        const discovery = await discoverAuthMutation.mutateAsync({
          endpoint: formData.endpoint,
        });

        setDiscoveryMessage(discovery.message);

        if (discovery.requires_auth) {
          setFormData((prev) => ({
            ...prev,
            authMode:
              discovery.recommended_auth_mode === "token"
                ? "token"
                : discovery.recommended_auth_mode ===
                    "oauth_authorization_code_confidential_pkce"
                  ? "oauth_authorization_code_confidential_pkce"
                  : discovery.recommended_auth_mode ===
                      "oauth_authorization_code_public_pkce"
                    ? "oauth_authorization_code_public_pkce"
                    : "oauth_client_credentials",
            tokenUrl: discovery.token_url || prev.tokenUrl,
            authUrl: discovery.auth_url || prev.authUrl,
            registerUrl: discovery.register_url || prev.registerUrl,
            resource: discovery.resource || prev.resource,
            scopes:
              discovery.scopes && discovery.scopes.length > 0
                ? discovery.scopes.join(", ")
                : prev.scopes,
          }));
          return;
        }
      }

      if (isEditing && mcpServer) {
        await updateMutation.mutateAsync({
          mcpServerId: mcpServer.id,
          payload: {
            name: formData.name,
            config: buildConfig(formData),
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          config: buildConfig(formData),
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save MCP server:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit MCP Server" : "Create MCP Server"}</DialogTitle>
          <DialogDescription>
            Define reusable MCP servers for this deployment. They are available
            across sessions in the deployment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Customer Support MCP"
              />
            </div>

            <div className="space-y-2">
              <Label>Endpoint</Label>
              <Input
                required
                value={formData.endpoint}
                onChange={(event) =>
                  setFormData({ ...formData, endpoint: event.target.value })
                }
                placeholder="https://mcp.example.com/mcp"
              />
            </div>

            {discoveryMessage ? (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {discoveryMessage}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Authentication</Label>
              <Select
                value={formData.authMode}
                onValueChange={(value) =>
                  setFormData({ ...formData, authMode: value as AuthMode })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select auth mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="token">Token</SelectItem>
                  <SelectItem value="oauth_client_credentials">
                    OAuth Client Credentials
                  </SelectItem>
                  <SelectItem value="oauth_authorization_code_public_pkce">
                    OAuth Authorization Code (Public PKCE)
                  </SelectItem>
                  <SelectItem value="oauth_authorization_code_confidential_pkce">
                    OAuth Authorization Code (Confidential PKCE)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.authMode === "token" && (
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input
                  type="password"
                  value={formData.authToken}
                  onChange={(event) =>
                    setFormData({ ...formData, authToken: event.target.value })
                  }
                  placeholder="Bearer token"
                />
              </div>
            )}

            {formData.authMode === "oauth_client_credentials" && (
              <>
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={formData.clientId}
                    onChange={(event) =>
                      setFormData({ ...formData, clientId: event.target.value })
                    }
                    placeholder="oauth-client-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input
                    type="password"
                    value={formData.clientSecret}
                    onChange={(event) =>
                      setFormData({ ...formData, clientSecret: event.target.value })
                    }
                    placeholder="oauth-client-secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token URL (optional)</Label>
                  <Input
                    value={formData.tokenUrl}
                    onChange={(event) =>
                      setFormData({ ...formData, tokenUrl: event.target.value })
                    }
                    placeholder="https://auth.example.com/oauth/token"
                  />
                  <p className="text-xs text-muted-foreground">
                    OAuth token endpoint used to exchange client ID/secret for an access token.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Scopes (optional)</Label>
                  <Input
                    value={formData.scopes}
                    onChange={(event) =>
                      setFormData({ ...formData, scopes: event.target.value })
                    }
                    placeholder="read, write"
                  />
                </div>
              </>
            )}

            {(formData.authMode === "oauth_authorization_code_public_pkce" ||
              formData.authMode === "oauth_authorization_code_confidential_pkce") && (
              <>
                <div className="space-y-2">
                  <Label>Client ID {formData.authMode === "oauth_authorization_code_confidential_pkce" ? "" : "(optional)"}</Label>
                  <Input
                    value={formData.clientId}
                    onChange={(event) =>
                      setFormData({ ...formData, clientId: event.target.value })
                    }
                    placeholder="oauth-client-id"
                  />
                </div>
                {formData.authMode === "oauth_authorization_code_confidential_pkce" && (
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      value={formData.clientSecret}
                      onChange={(event) =>
                        setFormData({ ...formData, clientSecret: event.target.value })
                      }
                      placeholder="oauth-client-secret"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Authorization URL (optional)</Label>
                  <Input
                    value={formData.authUrl}
                    onChange={(event) =>
                      setFormData({ ...formData, authUrl: event.target.value })
                    }
                    placeholder="https://auth.example.com/oauth/authorize"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token URL (optional)</Label>
                  <Input
                    value={formData.tokenUrl}
                    onChange={(event) =>
                      setFormData({ ...formData, tokenUrl: event.target.value })
                    }
                    placeholder="https://auth.example.com/oauth/token"
                  />
                </div>
                {formData.authMode === "oauth_authorization_code_public_pkce" && (
                  <div className="space-y-2">
                    <Label>Registration URL (optional)</Label>
                    <Input
                      value={formData.registerUrl}
                      onChange={(event) =>
                        setFormData({ ...formData, registerUrl: event.target.value })
                      }
                      placeholder="https://auth.example.com/oauth/register"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Scopes (optional)</Label>
                  <Input
                    value={formData.scopes}
                    onChange={(event) =>
                      setFormData({ ...formData, scopes: event.target.value })
                    }
                    placeholder="read, write"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resource (optional)</Label>
                  <Input
                    value={formData.resource}
                    onChange={(event) =>
                      setFormData({ ...formData, resource: event.target.value })
                    }
                    placeholder="https://mcp.example.com/"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
