import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Heading, Subheading } from "@/components/ui/heading";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { useState } from "react";


import AppleIcon from "@/assets/apple.svg";
import DiscordIcon from "@/assets/discord.svg";
import FacebookIcon from "@/assets/facebook.svg";
import GithubIcon from "@/assets/github.svg";
import GoogleIcon from "@/assets/google.svg";
import LinkedInIcon from "@/assets/linkedin.svg";
import MicrosoftIcon from "@/assets/microsoft.svg";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";



interface ProviderSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  provider: string;
}

function ProviderSettingsDialog({
  open,
  onClose,
  provider,
}: ProviderSettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{provider} Configuration</DialogTitle>
      <DialogDescription>Configure connection settings</DialogDescription>
      <DialogBody className="space-y-4">
        <Field>
          <Label>Client ID</Label>
          <Input className="mt-1" placeholder="Enter client ID" />
        </Field>
        <Field>
          <Label>Client Secret</Label>
          <Input
            className="mt-1"
            type="password"
            placeholder="Enter client secret"
          />
        </Field>
      </DialogBody>
      <DialogActions>
        <Button onClick={onClose}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}

const PROVIDERS = [
  { name: "Google", icon: GoogleIcon },
  { name: "GitHub", icon: GithubIcon },
  { name: "Facebook", icon: FacebookIcon },
  { name: "Apple", icon: AppleIcon },
  { name: "Microsoft", icon: MicrosoftIcon },
  { name: "LinkedIn", icon: LinkedInIcon },
  { name: "Discord", icon: DiscordIcon },
];

export default function SSOConnectionsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>(
    PROVIDERS.reduce((acc, provider) => {
      acc[provider.name] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleSwitchChange = (providerName: string) => {
    setSwitchStates((prevState) => ({
      ...prevState,
      [providerName]: !prevState[providerName],
    }));
  };

  return (
    <>
      <ProviderSettingsDialog
        open={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        provider={selectedProvider || ""}
      />

      <div>
        <Heading>Social Connections</Heading>
        <Subheading>
          Configure social login providers for your application
        </Subheading>

        <div className="space-y-6 mt-8">
          <div className="space-y-6">
            {PROVIDERS.map((provider) => (
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
                    onClick={() => setSelectedProvider(provider.name)}
                    disabled={!switchStates[provider.name]}
                  >
                    <Cog6ToothIcon />
                  </Button>
                  <Switch
                    name={`${provider.name.toLowerCase()}_enabled`}
                    checked={switchStates[provider.name]}
                    onChange={() => handleSwitchChange(provider.name)}
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

