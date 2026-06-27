import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Pill } from "@/components/ui/pill";
import { usePostHog } from "@posthog/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription as DialogDescriptionBase,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import DiscordIcon from "@/assets/discord.svg";
import GithubIcon from "@/assets/github.svg";
import GitlabIcon from "@/assets/gitlab.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
// import MicrosoftIcon from "@/assets/microsoft.svg";
import {
  Description,
  Field,
  FieldGroup,
  Label,
  ErrorMessage,
} from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Cog6ToothIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  useDeploymentSocialConnections,
  useUpsertDeploymentSocialConnection,
} from "@/lib/api/hooks/use-deployment-connections";
import {
  DeploymentSocialConnection,
  DeploymentSocialConnectionUpsert,
  OauthCredentials,
  SocialConnectionProvider,
} from "@/types/deployment";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { Badge } from "@/components/ui/badge";

interface ProviderSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  providerName: string;
  provider?: SocialConnectionProvider;
  connection?: DeploymentSocialConnection;
  deploymentId?: string;
  isProductionDeployment?: boolean;
  ssoCallbackUrl?: string;
}

const DialogDescription = DialogDescriptionBase;

const DEFAULT_SCOPES_BY_PROVIDER: Record<SocialConnectionProvider, string[]> = {
  [SocialConnectionProvider.GithubOauth]: ["read:user", "user:email"],
  [SocialConnectionProvider.GitlabOauth]: ["read_user"],
  [SocialConnectionProvider.GoogleOauth]: ["openid", "email", "profile"],
  [SocialConnectionProvider.MicrosoftOauth]: [
    "openid",
    "email",
    "profile",
    "https://graph.microsoft.com/User.Read",
  ],
  [SocialConnectionProvider.LinkedinOauth]: ["openid", "profile", "email"],
  [SocialConnectionProvider.DiscordOauth]: ["identify", "email"],
};

function getDefaultScopesForProvider(provider?: SocialConnectionProvider): string[] {
  if (!provider) {
    return [];
  }
  return [...(DEFAULT_SCOPES_BY_PROVIDER[provider] ?? [])];
}

function ProviderSettingsDialog({
  open,
  onClose,
  onSuccess,
  providerName,
  provider,
  connection,
  deploymentId,
  isProductionDeployment = false,
  ssoCallbackUrl,
}: ProviderSettingsDialogProps) {
  const [signInEnabled, setSignInEnabled] = useState(false);
  const [useCustomCredentials, setUseCustomCredentials] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [currentScope, setCurrentScope] = useState("");
  const [addedScopes, setAddedScopes] = useState<string[]>([]);

  const [clientIdError, setClientIdError] = useState<string | null>(null);
  const [clientSecretError, setClientSecretError] = useState<string | null>(
    null,
  );
  const [redirectUriError, setRedirectUriError] = useState<string | null>(null);

  const posthogDialog = usePostHog();
  const { mutate: upsertConnection, isPending: isSaving } =
    useUpsertDeploymentSocialConnection();

  useEffect(() => {
    if (open) {
      const defaultScopes = getDefaultScopesForProvider(provider);
      setClientId("");
      setClientSecret("");
      setRedirectUri("");
      setCurrentScope("");
      setAddedScopes(defaultScopes);
      setClientIdError(null);
      setClientSecretError(null);
      setRedirectUriError(null);
      const hasExistingCredentials =
        !!connection?.credentials &&
        !!connection.credentials.client_id &&
        !!connection.credentials.client_secret &&
        !!connection.credentials.redirect_uri;
      setSignInEnabled(connection?.enabled ?? false);
      setUseCustomCredentials(hasExistingCredentials);
      if (connection?.credentials) {
        setClientId(connection.credentials.client_id);
        setClientSecret(connection.credentials.client_secret);
        setRedirectUri(connection.credentials.redirect_uri);
        const configuredScopes = connection.credentials.scopes ?? [];
        setAddedScopes(
          configuredScopes.length > 0 ? configuredScopes : defaultScopes,
        );
      }
    }
  }, [open, connection, provider, ssoCallbackUrl]);

  const handleAddScope = () => {
    const scopeToAdd = currentScope.trim();
    if (scopeToAdd && !addedScopes.includes(scopeToAdd)) {
      setAddedScopes([...addedScopes, scopeToAdd]);
      setCurrentScope("");
    }
  };

  const handleRemoveScope = (scopeToRemove: string) => {
    setAddedScopes(addedScopes.filter((scope) => scope !== scopeToRemove));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setClientIdError(null);
    setClientSecretError(null);
    setRedirectUriError(null);

    const customCredentialsRequired =
      isProductionDeployment && !!signInEnabled;

    if (customCredentialsRequired && !useCustomCredentials) {
      setClientIdError("Custom credentials are required in production.");
      setClientSecretError("Custom credentials are required in production.");
      setRedirectUriError("Custom credentials are required in production.");
      return false;
    }

    if (useCustomCredentials || customCredentialsRequired) {
      if (!clientId.trim()) {
        setClientIdError("Client ID is required.");
        isValid = false;
      }
      if (!clientSecret.trim()) {
        setClientSecretError("Client Secret is required.");
        isValid = false;
      }
      if (!redirectUri.trim()) {
        setRedirectUriError("Redirect URI is required.");
        isValid = false;
      } else if (
        !redirectUri.startsWith("http://") &&
        !redirectUri.startsWith("https://")
      ) {
        setRedirectUriError("Redirect URI must start with http:// or https://");
        isValid = false;
      }
    }
    return isValid;
  };

  const handleSaveChanges = () => {
    if (!validateForm()) {
      return;
    }

    if (!deploymentId || !provider) {
      console.error("Missing deploymentId or provider for saving settings.");
      return;
    }

    let credentialsPayload: OauthCredentials | null = null;
    if (useCustomCredentials) {
      const scopes =
        addedScopes.length > 0 ? addedScopes : getDefaultScopesForProvider(provider);
      credentialsPayload = {
        client_id: clientId.trim(),
        client_secret: clientSecret,
        redirect_uri: redirectUri.trim(),
        scopes,
      };
    }

    const payload: DeploymentSocialConnectionUpsert = {
      provider,
      enabled: signInEnabled,
      credentials: credentialsPayload,
    };

    upsertConnection(
      { deploymentId, payload },
      {
        onSuccess: () => {
          posthogDialog?.capture("social_connection_configured", {
            provider,
            provider_name: providerName,
            sign_in_enabled: signInEnabled,
            use_custom_credentials: useCustomCredentials,
          });
          onSuccess();
        },
        onError: (error) => {
          console.error("Save error:", error);
          posthogDialog?.captureException(error);
        },
      },
    );
  };

  const isSaveDisabled =
    isSaving ||
    ((useCustomCredentials || (isProductionDeployment && signInEnabled)) &&
      (!clientId ||
        !clientSecret ||
        !redirectUri ||
        !!clientIdError ||
        !!clientSecretError ||
        !!redirectUriError));

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{providerName} Configuration</DialogTitle>
          <DialogDescription>
            Configure how users sign up and sign in with {providerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <Label>Enable for sign-up and sign-in</Label>
                <Switch
                  checked={signInEnabled}
                  onCheckedChange={(checked) => {
                    setSignInEnabled(checked);
                    if (checked && isProductionDeployment) {
                      setUseCustomCredentials(true);
                    }
                  }}
                  name="enable_sign_in"
                  disabled={isSaving}
                  aria-describedby="enable-signin-description"
                />
              </div>
              <Description>
                Allow users to sign up and sign in to your application using this
                method.
              </Description>
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <Label>Use custom credentials</Label>
                <Switch
                  checked={useCustomCredentials}
                  onCheckedChange={setUseCustomCredentials}
                  name="use_custom_credentials"
                  disabled={isSaving || (isProductionDeployment && signInEnabled)}
                  aria-describedby="custom-credentials-description"
                />
              </div>
              <Description>
                Use your own credentials.
              </Description>
            </Field>
          </FieldGroup>

          {isProductionDeployment && signInEnabled && !useCustomCredentials && (
            <p className="text-sm text-red-500">
              Custom credentials are required to enable social login in
              production.
            </p>
          )}

          {useCustomCredentials && (
            <FieldGroup className="border-t border-border pt-4 mt-4 space-y-3">
              {ssoCallbackUrl && (
                <Field>
                  <Label>SSO Redirect URL</Label>
                  <Input
                    value={ssoCallbackUrl}
                    readOnly
                    disabled
                    className="cursor-default text-muted-foreground"
                    aria-describedby="sso-redirect-description"
                  />
                  <Description id="sso-redirect-description">
                    Enter this URL in your {providerName} OAuth app configuration as the authorized redirect URI.
                  </Description>
                </Field>
              )}
              <Field>
                <Label>Client ID</Label>
                <Input
                  placeholder="Enter client ID"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setClientIdError(null);
                  }}
                  disabled={isSaving}
                  required
                  aria-invalid={!!clientIdError}
                  aria-describedby={clientIdError ? "client-id-error" : undefined}
                />
                {clientIdError && (
                  <ErrorMessage id="client-id-error">
                    {clientIdError}
                  </ErrorMessage>
                )}
              </Field>
              <Field>
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder="Enter client secret"
                  value={clientSecret}
                  onChange={(e) => {
                    setClientSecret(e.target.value);
                    setClientSecretError(null);
                  }}
                  disabled={isSaving}
                  required
                  aria-invalid={!!clientSecretError}
                  aria-describedby={
                    clientSecretError ? "client-secret-error" : undefined
                  }
                />
                {clientSecretError && (
                  <ErrorMessage id="client-secret-error">
                    {clientSecretError}
                  </ErrorMessage>
                )}
              </Field>
              <Field>
                <Label>Authorized Redirect URI</Label>
                <Input
                  placeholder="Enter redirect URI"
                  value={redirectUri}
                  onChange={(e) => {
                    setRedirectUri(e.target.value);
                    setRedirectUriError(null);
                  }}
                  disabled={isSaving}
                  required
                  aria-invalid={!!redirectUriError}
                  aria-describedby={
                    redirectUriError ? "redirect-uri-error" : undefined
                  }
                />
                {redirectUriError && (
                  <ErrorMessage id="redirect-uri-error">
                    {redirectUriError}
                  </ErrorMessage>
                )}
              </Field>
              <Field>
                <Label>Scopes</Label>
                <p
                  id="scopes-description"
                  className="text-sm text-muted-foreground"
                >
                  Enter required OAuth scopes one by one.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    className="flex-grow"
                    placeholder="e.g., openid"
                    value={currentScope}
                    onChange={(e) => setCurrentScope(e.target.value)}
                    disabled={isSaving}
                    aria-describedby="scopes-description"
                  />
                  <Button
                    onClick={handleAddScope}
                    disabled={isSaving || !currentScope.trim()}
                    variant="ghost"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {addedScopes.map((scope) => (
                    <Badge key={scope} className="flex items-center gap-1 pr-1">
                      {scope}
                      <button
                        onClick={() => handleRemoveScope(scope)}
                        disabled={isSaving}
                        className="rounded-full hover:bg-accent p-0.5"
                        aria-label={`Remove ${scope} scope`}
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </Field>
            </FieldGroup>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaveDisabled}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PROVIDERS: {
  name: string;
  icon: string;
  provider: SocialConnectionProvider;
}[] = [
    {
      name: "Google",
      icon: GoogleIcon,
      provider: SocialConnectionProvider.GoogleOauth,
    },
    {
      name: "GitHub",
      icon: GithubIcon,
      provider: SocialConnectionProvider.GithubOauth,
    },
    {
      name: "GitLab",
      icon: GitlabIcon,
      provider: SocialConnectionProvider.GitlabOauth,
    },
    // Microsoft OAuth temporarily disabled - unverified credentials
    // {
    //   name: "Microsoft",
    //   icon: MicrosoftIcon,
    //   provider: SocialConnectionProvider.MicrosoftOauth,
    // },
    {
      name: "LinkedIn",
      icon: LinkedInIcon,
      provider: SocialConnectionProvider.LinkedinOauth,
    },
    {
      name: "Discord",
      icon: DiscordIcon,
      provider: SocialConnectionProvider.DiscordOauth,
    },
  ];

type SelectedProviderInfo = {
  name: string;
  provider: SocialConnectionProvider;
  connection: DeploymentSocialConnection | undefined;
} | null;

export default function SSOConnectionsPage() {
  const [selectedProviderInfo, setSelectedProviderInfo] =
    useState<SelectedProviderInfo>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const { data: socialConnections, isLoading } =
    useDeploymentSocialConnections();
  const { selectedDeployment } = useProjects();
  const posthog = usePostHog();

  const providerConnections = useMemo(() => {
    return PROVIDERS.map((provider) => {
      const connection = socialConnections?.find(
        (connection) => connection.provider === provider.provider,
      );
      return { ...provider, connection };
    });
  }, [socialConnections]);

  const handleOpenSettings = (
    providerInfo: (typeof providerConnections)[0],
  ) => {
    setSelectedProviderInfo({
      name: providerInfo.name,
      provider: providerInfo.provider,
      connection: providerInfo.connection,
    });
    setSettingsModalOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsModalOpen(false);
    setTimeout(() => {
      setSelectedProviderInfo(null);
    }, 100);
  };

  const { mutate: upsertConnection, isPending: isTogglingConnection } =
    useUpsertDeploymentSocialConnection();

  const handleSwitchToggle = (
    providerInfo: (typeof providerConnections)[0],
    checked: boolean,
  ) => {
    if (!selectedDeployment) return;

    if (checked) {
      posthog?.capture("social_connection_enabled", {
        provider: providerInfo.provider,
        provider_name: providerInfo.name,
      });
      handleOpenSettings(providerInfo);
    } else {
      upsertConnection(
        {
          deploymentId: selectedDeployment.id,
          payload: {
            provider: providerInfo.provider,
            enabled: false,
            credentials: null,
          },
        },
        {
          onSuccess: () => {
            posthog?.capture("social_connection_disabled", {
              provider: providerInfo.provider,
              provider_name: providerInfo.name,
            });
            toast.success(`${providerInfo.name} OAuth disabled successfully.`);
          },
          onError: (error) => {
            console.error("Disable error:", error);
            posthog?.captureException(error);
            toast.error(`Failed to disable ${providerInfo.name} OAuth.`);
          },
        },
      );
    }
  };

  const ssoCallbackUrl = useMemo(() => {
    if (!selectedDeployment?.frontend_host) return undefined;
    return `https://${selectedDeployment.frontend_host}/sso-callback`;
  }, [selectedDeployment]);

  if (isLoading) {
    return <InlineLoader />;
  }

  return (
    <>
      <ProviderSettingsDialog
        open={settingsModalOpen}
        onClose={handleCloseSettings}
        providerName={selectedProviderInfo?.name ?? ""}
        provider={selectedProviderInfo?.provider}
        connection={selectedProviderInfo?.connection}
        deploymentId={selectedDeployment?.id}
        isProductionDeployment={selectedDeployment?.mode === "production"}
        ssoCallbackUrl={ssoCallbackUrl}
        onSuccess={() => {
          handleCloseSettings();
        }}
      />

      <div className="flex flex-col gap-4">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {providerConnections.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center gap-4 px-4 py-3.5"
            >
              <img
                src={provider.icon}
                alt={`${provider.name} icon`}
                className="h-7 w-7 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {provider.name}
                  </span>
                  <Pill tone={provider.connection?.enabled ? "ok" : "mute"}>
                    {provider.connection?.enabled ? "on" : "off"}
                  </Pill>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Allow users to sign in with {provider.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                onClick={() => handleOpenSettings(provider)}
              >
                <Cog6ToothIcon className="size-4" />
              </Button>
              <Switch
                name={`${provider.name.toLowerCase()}_enabled`}
                checked={provider.connection?.enabled ?? false}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchToggle(provider, checked)
                }
                disabled={isTogglingConnection}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
