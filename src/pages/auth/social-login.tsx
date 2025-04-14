import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Heading, Subheading } from "@/components/ui/heading";
import {
  Dialog,
  DialogTitle,
  DialogDescription as DialogDescriptionBase,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";

import AppleIcon from "@/assets/apple.svg";
import DiscordIcon from "@/assets/discord.svg";
import FacebookIcon from "@/assets/facebook.svg";
import GithubIcon from "@/assets/github.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import { Description, Field, FieldGroup, Label, ErrorMessage } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Cog6ToothIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDeploymentSocialConnections, useUpsertDeploymentSocialConnection } from "@/lib/api/hooks/use-deployment-connections";
import { DeploymentSocialConnection, DeploymentSocialConnectionUpsert, OauthCredentials, SocialConnectionProvider } from "@/types/deployment";
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
}

const DialogDescription = DialogDescriptionBase;

function ProviderSettingsDialog({
  open,
  onClose,
  onSuccess,
  providerName,
  provider,
  connection,
  deploymentId,
}: ProviderSettingsDialogProps) {
  const [signInEnabled, setSignInEnabled] = useState(false);
  const [useCustomCredentials, setUseCustomCredentials] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [currentScope, setCurrentScope] = useState("");
  const [addedScopes, setAddedScopes] = useState<string[]>([]);

  const [clientIdError, setClientIdError] = useState<string | null>(null);
  const [clientSecretError, setClientSecretError] = useState<string | null>(null);
  const [redirectUriError, setRedirectUriError] = useState<string | null>(null);

  const { mutate: upsertConnection, isPending: isSaving } = useUpsertDeploymentSocialConnection();

  useEffect(() => {
    if (open) {
      setClientId("");
      setClientSecret("");
      setRedirectUri("");
      setCurrentScope("");
      setAddedScopes([]);
      setClientIdError(null);
      setClientSecretError(null);
      setRedirectUriError(null);
      const hasExistingCredentials = !!connection?.credentials && !!connection.credentials.client_id && !!connection.credentials.client_secret && !!connection.credentials.redirect_uri;
      setSignInEnabled(connection?.enabled ?? false);
      setUseCustomCredentials(hasExistingCredentials);
      if (connection?.credentials) {
        setClientId(connection.credentials.client_id);
        setClientSecret(connection.credentials.client_secret);
        setRedirectUri(connection.credentials.redirect_uri);
        setAddedScopes(connection.credentials.scopes ?? []);
      }
    }
  }, [open, connection]);

  const handleAddScope = () => {
    const scopeToAdd = currentScope.trim();
    if (scopeToAdd && !addedScopes.includes(scopeToAdd)) {
      setAddedScopes([...addedScopes, scopeToAdd]);
      setCurrentScope("");
    }
  };

  const handleRemoveScope = (scopeToRemove: string) => {
    setAddedScopes(addedScopes.filter(scope => scope !== scopeToRemove));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setClientIdError(null);
    setClientSecretError(null);
    setRedirectUriError(null);

    if (useCustomCredentials) {
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
      } else if (!redirectUri.startsWith("http://") && !redirectUri.startsWith("https://")) {
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
      credentialsPayload = {
        client_id: clientId.trim(),
        client_secret: clientSecret,
        redirect_uri: redirectUri.trim(),
        scopes: addedScopes,
      };
    }

    const payload: DeploymentSocialConnectionUpsert = {
      provider,
      enabled: signInEnabled,
      credentials: credentialsPayload,
    };

    upsertConnection(
      { deploymentId, payload },
      { onSuccess, onError: (error) => { console.error("Save error:", error); } }
    );
  };

  const isSaveDisabled = isSaving || (useCustomCredentials && (!clientId || !clientSecret || !redirectUri || !!clientIdError || !!clientSecretError || !!redirectUriError));

  return (
    <Dialog open={open} onClose={onClose} className="w-full max-w-lg">
      <DialogTitle>{providerName} Configuration</DialogTitle>
      <DialogDescription>
        Configure how users sign up and sign in with {providerName}.
      </DialogDescription>
      <DialogBody className="mt-4">
        <FieldGroup>
          <Field className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Enable for sign-up and sign-in</Label>
              <Switch
                checked={signInEnabled}
                onChange={setSignInEnabled}
                name="enable_sign_in"
                disabled={isSaving}
                aria-describedby="enable-signin-description"
              />
            </div>
            <Description>Allow users to sign up and sign in to your application using this method.</Description>
          </Field>
          <Field className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Use custom credentials</Label>
              <Switch
                checked={useCustomCredentials}
                onChange={setUseCustomCredentials}
                name="use_custom_credentials"
                disabled={isSaving}
                aria-describedby="custom-credentials-description"
              />
            </div>
            <Description>Use your own credentials. If turned off, default shared credentials will be used.</Description>
          </Field>
        </FieldGroup>

        {useCustomCredentials && (
          <FieldGroup className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4 space-y-3">
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
              {clientIdError && <ErrorMessage id="client-id-error">{clientIdError}</ErrorMessage>}
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
                aria-describedby={clientSecretError ? "client-secret-error" : undefined}
              />
              {clientSecretError && <ErrorMessage id="client-secret-error">{clientSecretError}</ErrorMessage>}
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
                aria-describedby={redirectUriError ? "redirect-uri-error" : undefined}
              />
              {redirectUriError && <ErrorMessage id="redirect-uri-error">{redirectUriError}</ErrorMessage>}
            </Field>
            <Field>
              <Label>Scopes</Label>
              <p id="scopes-description" className="text-sm text-zinc-500 dark:text-zinc-400">
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
                  plain
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
                      className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600 p-0.5"
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
      </DialogBody>
      <DialogActions>
        <Button onClick={handleSaveChanges} disabled={isSaveDisabled}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button plain onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const PROVIDERS: { name: string; icon: string; provider: SocialConnectionProvider }[] = [
  { name: "Google", icon: GoogleIcon, provider: SocialConnectionProvider.GoogleOauth },
  { name: "GitHub", icon: GithubIcon, provider: SocialConnectionProvider.GithubOauth },
  { name: "Facebook", icon: FacebookIcon, provider: SocialConnectionProvider.FacebookOauth },
  { name: "Apple", icon: AppleIcon, provider: SocialConnectionProvider.AppleOauth },
  { name: "Microsoft", icon: MicrosoftIcon, provider: SocialConnectionProvider.MicrosoftOauth },
  { name: "LinkedIn", icon: LinkedInIcon, provider: SocialConnectionProvider.LinkedinOauth },
  { name: "Discord", icon: DiscordIcon, provider: SocialConnectionProvider.DiscordOauth },
];

type SelectedProviderInfo = {
  name: string;
  provider: SocialConnectionProvider;
  connection: DeploymentSocialConnection | undefined;
} | null;

export default function SSOConnectionsPage() {
  const [selectedProviderInfo, setSelectedProviderInfo] = useState<SelectedProviderInfo>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const { data: socialConnections, isLoading } = useDeploymentSocialConnections();
  const { selectedDeployment } = useProjects();

  console.log(selectedDeployment?.mode === "production");

  const providerConnections = useMemo(() => {
    return PROVIDERS.map((provider) => {
      const connection = socialConnections?.find((connection) => connection.provider === provider.provider);
      return { ...provider, connection };
    });
  }, [socialConnections, PROVIDERS]);

  console.log(providerConnections);

  const handleOpenSettings = (providerInfo: typeof providerConnections[0]) => {
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

  const handleSwitchToggle = (providerInfo: typeof providerConnections[0], checked: boolean) => {
    if (!selectedDeployment) return;

    if (checked) {
      handleOpenSettings(providerInfo);
    } else {
      window.alert(
        `Disabling ${providerInfo.name} requires confirmation or further action. This action is not yet fully implemented.`
      );
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
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
        onSuccess={() => {
          handleCloseSettings();
        }}
      />

      <div>
        <Heading>Social Connections</Heading>
        <Subheading>
          Configure social login providers for your application
        </Subheading>

        <div className="space-y-6 mt-8">
          <div className="space-y-6">
            {providerConnections.map((provider) => (
              <div
                key={provider.name}
                className="flex items-start justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={provider.icon}
                    alt={`${provider.name} icon`}
                    className="w-6 h-6"
                  />

                  <div>
                    <h3 className="text-sm font-medium">{provider.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Allow users to sign in with {provider.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    plain
                    onClick={() => handleOpenSettings(provider)}
                  >
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name={`${provider.name.toLowerCase()}_enabled`}
                    checked={provider.connection?.enabled ?? false}
                    onChange={(checked: boolean) => handleSwitchToggle(provider, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

